-- STQMS Initial Seed Data

-- 1. Departments
INSERT INTO departments (id, code, name, is_active) VALUES 
('d1111111-1111-1111-1111-111111111111', 'BGH', 'Ban Giám Hiệu', true),
('d2222222-2222-2222-2222-222222222222', 'PDBCL', 'Phòng Đảm bảo chất lượng', true),
('d3333333-3333-3333-3333-333333333333', 'KCNTT', 'Khoa Công nghệ thông tin', true);

-- 2. Roles
INSERT INTO roles (id, code, name, description) VALUES 
('r1111111-1111-1111-1111-111111111111', 'ADMIN', 'Quản trị hệ thống', 'Toàn quyền hệ thống'),
('r2222222-2222-2222-2222-222222222222', 'QA_MANAGER', 'Quản lý chất lượng', 'Quản lý tiêu chuẩn, phê duyệt minh chứng'),
('r3333333-3333-3333-3333-333333333333', 'STAFF', 'Giảng viên / Chuyên viên', 'Upload minh chứng, thực hiện công việc');

-- 3. Permissions
INSERT INTO permissions (id, code, name, module) VALUES 
('p1111111-1111-1111-1111-111111111111', 'USER_MANAGE', 'Quản lý người dùng', 'SYSTEM'),
('p2222222-2222-2222-2222-222222222222', 'STANDARD_MANAGE', 'Quản lý tiêu chuẩn', 'QUALITY'),
('p3333333-3333-3333-3333-333333333333', 'EVIDENCE_CREATE', 'Tạo minh chứng', 'EVIDENCE'),
('p4444444-4444-4444-4444-444444444444', 'EVIDENCE_APPROVE', 'Phê duyệt minh chứng', 'EVIDENCE');

-- 4. Role Permissions
INSERT INTO role_permissions (role_id, permission_id) VALUES 
('r1111111-1111-1111-1111-111111111111', 'p1111111-1111-1111-1111-111111111111'),
('r1111111-1111-1111-1111-111111111111', 'p2222222-2222-2222-2222-222222222222'),
('r1111111-1111-1111-1111-111111111111', 'p3333333-3333-3333-3333-333333333333'),
('r1111111-1111-1111-1111-111111111111', 'p4444444-4444-4444-4444-444444444444'),
('r2222222-2222-2222-2222-222222222222', 'p2222222-2222-2222-2222-222222222222'),
('r2222222-2222-2222-2222-222222222222', 'p3333333-3333-3333-3333-333333333333'),
('r2222222-2222-2222-2222-222222222222', 'p4444444-4444-4444-4444-444444444444'),
('r3333333-3333-3333-3333-333333333333', 'p3333333-3333-3333-3333-333333333333');

-- 5. Users (Password is hashed version of 'password123' - assuming bcrypt)
INSERT INTO users (id, username, email, password_hash, full_name, department_id, is_active) VALUES 
('u1111111-1111-1111-1111-111111111111', 'admin', 'admin@stqms.edu.vn', '$2b$12$NqN.U7y...fakehash...', 'System Admin', 'd1111111-1111-1111-1111-111111111111', true),
('u2222222-2222-2222-2222-222222222222', 'qamanager', 'qa@stqms.edu.vn', '$2b$12$NqN.U7y...fakehash...', 'Trưởng phòng QA', 'd2222222-2222-2222-2222-222222222222', true),
('u3333333-3333-3333-3333-333333333333', 'staff1', 'staff1@stqms.edu.vn', '$2b$12$NqN.U7y...fakehash...', 'Nguyễn Văn A', 'd3333333-3333-3333-3333-333333333333', true);

-- 6. User Roles
INSERT INTO user_roles (user_id, role_id) VALUES 
('u1111111-1111-1111-1111-111111111111', 'r1111111-1111-1111-1111-111111111111'),
('u2222222-2222-2222-2222-222222222222', 'r2222222-2222-2222-2222-222222222222'),
('u3333333-3333-3333-3333-333333333333', 'r3333333-3333-3333-3333-333333333333');

-- 7. Academic Years
INSERT INTO academic_years (id, code, name, start_date, end_date, is_current) VALUES 
('a1111111-1111-1111-1111-111111111111', 'AY2023_2024', 'Năm học 2023-2024', '2023-09-01', '2024-08-31', false),
('a2222222-2222-2222-2222-222222222222', 'AY2024_2025', 'Năm học 2024-2025', '2024-09-01', '2025-08-31', true);

-- 8. Standards & Criteria
INSERT INTO standards (id, code, name, description, issued_date) VALUES 
('s1111111-1111-1111-1111-111111111111', 'TT_12_2017', 'Thông tư 12/2017/TT-BGDĐT', 'Quy định về kiểm định chất lượng cơ sở giáo dục đại học', '2017-05-19');

INSERT INTO criteria (id, standard_id, code, name, description, sequence_num) VALUES 
('c1111111-1111-1111-1111-111111111111', 's1111111-1111-1111-1111-111111111111', 'TC1', 'Tầm nhìn, sứ mạng và văn hóa', 'Mô tả TC1...', 1),
('c2222222-2222-2222-2222-222222222222', 's1111111-1111-1111-1111-111111111111', 'TC2', 'Quản trị, lãnh đạo và quản lý', 'Mô tả TC2...', 2);
