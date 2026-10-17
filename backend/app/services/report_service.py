from datetime import datetime
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.quality import Standard, Criterion
from app.models.evidence import Evidence
from app.models.evaluation import Evaluation, EvaluationDetail
from app.models.training import Task

class ReportService:
    def __init__(self, db: Session):
        self.db = db

    def generate_accreditation_summary(self) -> Dict[str, Any]:
        """Tổng hợp dữ liệu tự đánh giá chất lượng Trường Tiểu học Hợp Minh"""
        standards = self.db.query(Standard).order_by(Standard.sequence_num.asc(), Standard.code.asc()).all()
        
        standards_data = []
        total_criteria_all = 0
        passed_criteria_all = 0
        level_counts = {"LEVEL_1": 0, "LEVEL_2": 0, "LEVEL_3": 0, "LEVEL_4": 0}

        for std in standards:
            criteria = self.db.query(Criterion).filter(Criterion.standard_id == std.id).order_by(Criterion.sequence_num.asc()).all()
            criteria_ids = [c.id for c in criteria]
            total_c = len(criteria)
            total_criteria_all += total_c

            # Lấy kết quả đánh giá mới nhất từ evaluation_details
            details = self.db.query(EvaluationDetail).filter(EvaluationDetail.criteria_id.in_(criteria_ids)).all() if criteria_ids else []
            passed_c = 0
            crit_items = []

            detail_map = {d.criteria_id: d for d in details}

            for c in criteria:
                d = detail_map.get(c.id)
                status = d.status if d else "PENDING"
                level = d.level if d else None
                if status == "PASS":
                    passed_c += 1
                    passed_criteria_all += 1
                    if level and level in level_counts:
                        level_counts[level] += 1

                crit_items.append({
                    "id": str(c.id),
                    "code": c.code,
                    "name": c.name,
                    "status": status,
                    "level": level,
                    "comment": d.comments if d else None
                })

            rate = round((passed_c / total_c * 100), 2) if total_c > 0 else 0.0

            standards_data.append({
                "id": str(std.id),
                "code": std.code,
                "name": std.name,
                "total_criteria": total_c,
                "passed_criteria": passed_c,
                "completion_rate": rate,
                "criteria": crit_items
            })

        # Thống kê minh chứng
        total_evidences = self.db.query(Evidence).count()
        approved_evidences = self.db.query(Evidence).filter(Evidence.status == "APPROVED").count()
        submitted_evidences = self.db.query(Evidence).filter(Evidence.status == "SUBMITTED").count()
        draft_evidences = self.db.query(Evidence).filter(Evidence.status == "DRAFT").count()

        overall_rate = round((passed_criteria_all / total_criteria_all * 100), 2) if total_criteria_all > 0 else 0.0

        # Xác định cấp độ kiểm định dự kiến
        if overall_rate >= 100 and level_counts["LEVEL_3"] > 0:
            conclusion = "Đạt Tiêu chuẩn Kiểm định chất lượng giáo dục Cấp độ 3 (Chuẩn Quốc gia Mức độ 2)"
        elif overall_rate >= 100:
            conclusion = "Đạt Tiêu chuẩn Kiểm định chất lượng giáo dục Cấp độ 2 (Chuẩn Quốc gia Mức độ 1)"
        elif overall_rate >= 80:
            conclusion = "Đạt Tiêu chuẩn Kiểm định chất lượng giáo dục Cấp độ 1"
        else:
            conclusion = "Đang trong tiến trình tự đánh giá và hoàn thiện minh chứng"

        return {
            "school_name": "Trường Tiểu học Hợp Minh",
            "report_title": "BÁO CÁO TỰ ĐÁNH GIÁ CHẤT LƯỢNG GIÁO DỤC TRƯỜNG TIỂU HỌC",
            "standard_regulation": "Thông tư số 17/2018/TT-BGDĐT của Bộ Giáo dục và Đào tạo",
            "generated_at": datetime.now().strftime("%d/%m/%Y %H:%M:%S"),
            "kpis": {
                "total_standards": len(standards),
                "total_criteria": total_criteria_all,
                "passed_criteria": passed_criteria_all,
                "overall_completion_rate": overall_rate,
                "level_counts": level_counts,
                "evidence_stats": {
                    "total": total_evidences,
                    "approved": approved_evidences,
                    "submitted": submitted_evidences,
                    "draft": draft_evidences
                }
            },
            "conclusion": conclusion,
            "standards": standards_data
        }

    def generate_html_report(self) -> str:
        """Tạo bản in Báo cáo Tự đánh giá chuẩn Thông tư 17/2018/TT-BGDĐT"""
        data = self.generate_accreditation_summary()
        kpis = data["kpis"]
        standards = data["standards"]

        rows_html = ""
        for std in standards:
            rows_html += f"""
            <tr style="background-color: #f1f5f9; font-weight: bold;">
                <td colspan="5">{std['code']}: {std['name']} ({std['passed_criteria']}/{std['total_criteria']} tiêu chí đạt - {std['completion_rate']}%)</td>
            </tr>
            """
            for c in std["criteria"]:
                status_badge = '<span style="color: #16a34a; font-weight: 600;">ĐẠT</span>' if c['status'] == "PASS" else '<span style="color: #ca8a04;">CHƯA ĐẠT</span>'
                level_str = c['level'].replace("LEVEL_", "Mức ") if c['level'] else "—"
                comment_str = c['comment'] or "Đang tiến hành rà soát minh chứng"
                rows_html += f"""
                <tr>
                    <td style="text-align: center;">{c['code']}</td>
                    <td>{c['name']}</td>
                    <td style="text-align: center;">{status_badge}</td>
                    <td style="text-align: center;">{level_str}</td>
                    <td>{comment_str}</td>
                </tr>
                """

        html = f"""<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>{data['report_title']} — {data['school_name']}</title>
    <style>
        body {{ font-family: 'Times New Roman', Times, serif; margin: 40px; color: #1e293b; line-height: 1.5; }}
        .header {{ display: flex; justify-content: space-between; text-align: center; margin-bottom: 25px; }}
        .header .left {{ font-weight: bold; font-size: 14px; text-transform: uppercase; }}
        .header .right {{ font-weight: bold; font-size: 14px; }}
        .title {{ text-align: center; margin: 30px 0; }}
        .title h1 {{ font-size: 20px; font-weight: bold; margin: 5px 0; text-transform: uppercase; }}
        .title p {{ font-style: italic; font-size: 14px; margin: 4px 0; }}
        table {{ width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }}
        th, td {{ border: 1px solid #94a3b8; padding: 8px 10px; }}
        th {{ background-color: #e2e8f0; font-weight: bold; text-align: center; }}
        .kpi-box {{ display: flex; gap: 15px; margin: 20px 0; }}
        .kpi-card {{ flex: 1; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; text-align: center; background: #f8fafc; }}
        .kpi-card .val {{ font-size: 22px; font-weight: bold; color: #0284c7; }}
        .signatures {{ display: flex; justify-content: space-between; margin-top: 50px; text-align: center; page-break-inside: avoid; }}
        .signatures div {{ width: 45%; }}
        .signatures .sign-title {{ font-weight: bold; text-transform: uppercase; }}
        .signatures .sign-name {{ margin-top: 80px; font-weight: bold; }}
        @media print {{ body {{ margin: 20px; }} }}
    </style>
</head>
<body>
    <div class="header">
        <div class="left">
            PHÒNG GD&ĐT THÀNH PHỐ YÊN BÁI<br/>
            <strong>TRƯỜNG TIỂU HỌC HỢP MINH</strong><br/>
            ----------------
        </div>
        <div class="right">
            CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br/>
            <strong>Độc lập - Tự do - Hạnh phúc</strong><br/>
            ----------------
        </div>
    </div>

    <div class="title">
        <h1>{data['report_title']}</h1>
        <p>Áp dụng quy chuẩn: {data['standard_regulation']}</p>
        <p>Thời điểm xuất báo cáo: {data['generated_at']}</p>
    </div>

    <div class="kpi-box">
        <div class="kpi-card">
            <div>Tổng tiêu chuẩn</div>
            <div class="val">{kpis['total_standards']}</div>
        </div>
        <div class="kpi-card">
            <div>Tổng tiêu chí</div>
            <div class="val">{kpis['total_criteria']}</div>
        </div>
        <div class="kpi-card">
            <div>Tiêu chí đạt</div>
            <div class="val" style="color: #16a34a;">{kpis['passed_criteria']} ({kpis['overall_completion_rate']}%)</div>
        </div>
        <div class="kpi-card">
            <div>Minh chứng đã duyệt</div>
            <div class="val" style="color: #4f46e5;">{kpis['evidence_stats']['approved']}/{kpis['evidence_stats']['total']}</div>
        </div>
    </div>

    <p><strong>Kết luận tự đánh giá:</strong> <em>{data['conclusion']}</em></p>

    <table>
        <thead>
            <tr>
                <th style="width: 80px;">Mã TC</th>
                <th>Tên Tiêu chí</th>
                <th style="width: 100px;">Kết quả</th>
                <th style="width: 80px;">Mức đạt</th>
                <th style="width: 280px;">Ghi chú / Nhận xét</th>
            </tr>
        </thead>
        <tbody>
            {rows_html}
        </tbody>
    </table>

    <div class="signatures">
        <div>
            <div class="sign-title">THƯ KÝ HỘI ĐỒNG</div>
            <div style="font-style: italic;">(Ký và ghi rõ họ tên)</div>
            <div class="sign-name">Hội đồng Tự đánh giá</div>
        </div>
        <div>
            <div><em>Hợp Minh, ngày ..... tháng ..... năm 202...</em></div>
            <div class="sign-title">HIỆU TRƯỞNG / CHỦ TỊCH HỘI ĐỒNG</div>
            <div style="font-style: italic;">(Ký, ghi rõ họ tên và đóng dấu)</div>
            <div class="sign-name">Trường Tiểu học Hợp Minh</div>
        </div>
    </div>
</body>
</html>"""
        return html
