"""
database.py - Khởi tạo SQLite, quản lý bảng Users và Violations
"""

import sqlite3
import os
from datetime import datetime
import hashlib

DB_PATH = './database/system.db'

def get_db_connection():
    """Kết nối đến database"""
    os.makedirs('./database', exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def hash_password(password):
    """Mã hóa mật khẩu SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()


def init_database():
    """Khởi tạo cơ sở dữ liệu và tạo các bảng"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Tạo bảng Users
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            fullname TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('admin', 'officer')),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Tạo bảng Violations
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS violations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            cccd TEXT NOT NULL,
            age INTEGER NOT NULL,
            gender TEXT NOT NULL CHECK(gender IN ('Nam', 'Nữ', 'Khác')),
            license_plate TEXT NOT NULL,
            vehicle_type TEXT NOT NULL CHECK(vehicle_type IN ('motor', 'car')),
            alcohol_level REAL NOT NULL,
            fine_amount TEXT NOT NULL,
            points_deducted INTEGER NOT NULL,
            gplx_status TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Chèn seed data nếu chưa có user
    cursor.execute('SELECT COUNT(*) FROM users')
    if cursor.fetchone()[0] == 0:
        officer_password = hash_password('123')
        admin_password = hash_password('123')
        
        cursor.execute('''
            INSERT INTO users (username, password, fullname, role)
            VALUES (?, ?, ?, ?)
        ''', ('csgt01', officer_password, 'Chiến sĩ Nguyễn Văn A', 'officer'))
        
        cursor.execute('''
            INSERT INTO users (username, password, fullname, role)
            VALUES (?, ?, ?, ?)
        ''', ('admin', admin_password, 'Chỉ huy Lê Biên Phòng', 'admin'))
        
        conn.commit()
        print("[DB] ✓ Tạo bảng và seed data thành công")
        print("[DB] Tài khoản Officer: csgt01 / 123")
        print("[DB] Tài khoản Admin: admin / 123")
    else:
        print("[DB] ✓ Database đã tồn tại")
    
    conn.close()


def verify_login(username, password):
    """
    Kiểm tra thông tin đăng nhập
    Return: dict {'success': bool, 'role': str, 'fullname': str} hoặc None nếu sai
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT id, password, role, fullname FROM users WHERE username = ?', (username,))
        user = cursor.fetchone()
        conn.close()
        
        if user:
            password_hash = hash_password(password)
            if user['password'] == password_hash:
                return {
                    'success': True,
                    'role': user['role'],
                    'fullname': user['fullname']
                }
        
        return {'success': False}
    
    except Exception as e:
        print(f"[DB] ✗ Lỗi verify_login: {e}")
        return {'success': False}


def save_violation(violation_data):
    """
    Lưu thông tin vi phạm vào database
    violation_data: dict chứa tất cả thông tin vi phạm
    Return: violation_id hoặc None nếu lỗi
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO violations 
            (name, cccd, age, gender, license_plate, vehicle_type, 
             alcohol_level, fine_amount, points_deducted, gplx_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            violation_data['name'],
            violation_data['cccd'],
            int(violation_data['age']),
            violation_data['gender'],
            violation_data['license_plate'],
            violation_data['vehicle_type'],
            float(violation_data['alcohol_level']),
            violation_data['fine_amount'],
            int(violation_data['points_deducted']),
            violation_data.get('gplx_status', '')
        ))
        
        conn.commit()
        violation_id = cursor.lastrowid
        conn.close()
        
        print(f"[DB] ✓ Lưu vi phạm #{violation_id}: {violation_data['name']} - {violation_data['license_plate']}")
        return violation_id
    
    except Exception as e:
        print(f"[DB] ✗ Lỗi save_violation: {e}")
        return None


def get_violation_stats():
    """
    Lấy thống kê tổng hợp vi phạm
    Return: dict chứa dữ liệu thống kê
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Tổng số tiền phạt
        cursor.execute('''
            SELECT SUM(CAST(REPLACE(fine_amount, '.', '') AS INTEGER)) as total_fine
            FROM violations
        ''')
        total_fine_row = cursor.fetchone()
        total_fine = total_fine_row['total_fine'] if total_fine_row['total_fine'] else 0
        
        # Tổng số ca vi phạm
        cursor.execute('SELECT COUNT(*) as total_cases FROM violations')
        total_cases = cursor.fetchone()['total_cases']
        
        # Tổng điểm GPLX bị trừ
        cursor.execute('SELECT SUM(points_deducted) as total_points FROM violations')
        total_points_row = cursor.fetchone()
        total_points = total_points_row['total_points'] if total_points_row['total_points'] else 0
        
        # Thống kê theo giới tính (Nam, Nữ, Khác)
        cursor.execute('''
            SELECT gender, COUNT(*) as count
            FROM violations
            GROUP BY gender
        ''')
        gender_stats = {row['gender']: row['count'] for row in cursor.fetchall()}
        
        # Thống kê theo loại xe (motor, car)
        cursor.execute('''
            SELECT vehicle_type, COUNT(*) as count
            FROM violations
            GROUP BY vehicle_type
        ''')
        vehicle_stats = {
            'motor': 0,
            'car': 0
        }
        for row in cursor.fetchall():
            vehicle_stats[row['vehicle_type']] = row['count']
        
        conn.close()
        
        return {
            'total_fine': int(total_fine),
            'total_cases': total_cases,
            'total_points': total_points,
            'by_gender': gender_stats,
            'by_vehicle': vehicle_stats
        }
    
    except Exception as e:
        print(f"[DB] ✗ Lỗi get_violation_stats: {e}")
        return {
            'total_fine': 0,
            'total_cases': 0,
            'total_points': 0,
            'by_gender': {},
            'by_vehicle': {'motor': 0, 'car': 0}
        }


def get_all_violations(limit=100):
    """Lấy danh sách tất cả vi phạm"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT * FROM violations
            ORDER BY created_at DESC
            LIMIT ?
        ''', (limit,))
        
        violations = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        return violations
    
    except Exception as e:
        print(f"[DB] ✗ Lỗi get_all_violations: {e}")
        return []


def get_statistics():
    """
    Lấy dữ liệu thống kê chi tiết cho Analytics Dashboard
    Return: dict chứa 4 categories dữ liệu
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 1. Nồng độ trung bình theo nhóm tuổi
        cursor.execute('''
            SELECT 
                CASE 
                    WHEN age < 25 THEN 'Dưới 25'
                    WHEN age BETWEEN 25 AND 35 THEN '25-35'
                    WHEN age BETWEEN 36 AND 50 THEN '36-50'
                    ELSE 'Trên 50'
                END as age_group,
                COUNT(*) as count,
                ROUND(AVG(alcohol_level), 2) as avg_alcohol
            FROM violations
            GROUP BY age_group
            ORDER BY 
                CASE 
                    WHEN age_group = 'Dưới 25' THEN 1
                    WHEN age_group = '25-35' THEN 2
                    WHEN age_group = '36-50' THEN 3
                    ELSE 4
                END
        ''')
        avg_by_age = []
        for row in cursor.fetchall():
            avg_by_age.append({
                'label': row['age_group'],
                'avg_alcohol': row['avg_alcohol'] if row['avg_alcohol'] else 0,
                'count': row['count']
            })
        
        # 2. Phân bố mức vi phạm
        cursor.execute('''
            SELECT 
                CASE 
                    WHEN alcohol_level = 0 THEN 'An toàn'
                    WHEN alcohol_level <= 0.08 THEN 'Mức 1'
                    WHEN alcohol_level <= 0.15 THEN 'Mức 2'
                    WHEN alcohol_level <= 0.25 THEN 'Mức 3'
                    ELSE 'Mức 4'
                END as penalty_level,
                COUNT(*) as count
            FROM violations
            GROUP BY penalty_level
            ORDER BY count DESC
        ''')
        penalty_distribution = {}
        for row in cursor.fetchall():
            penalty_distribution[row['penalty_level']] = row['count']
        
        # 3. Phân bố theo giới tính
        cursor.execute('''
            SELECT gender, COUNT(*) as count
            FROM violations
            GROUP BY gender
        ''')
        gender_distribution = {}
        for row in cursor.fetchall():
            gender_distribution[row['gender']] = row['count']
        
        # 4. Xu hướng vi phạm theo khung giờ
        cursor.execute('''
            SELECT 
                CASE 
                    WHEN strftime('%H', created_at) >= '00' AND strftime('%H', created_at) < '06' THEN '00h-06h'
                    WHEN strftime('%H', created_at) >= '06' AND strftime('%H', created_at) < '12' THEN '06h-12h'
                    WHEN strftime('%H', created_at) >= '12' AND strftime('%H', created_at) < '18' THEN '12h-18h'
                    ELSE '18h-24h'
                END as time_slot,
                COUNT(*) as count
            FROM violations
            GROUP BY time_slot
            ORDER BY time_slot
        ''')
        time_distribution = {}
        for row in cursor.fetchall():
            time_distribution[row['time_slot']] = row['count']
        
        conn.close()
        
        return {
            'by_age': avg_by_age,
            'by_penalty_level': penalty_distribution,
            'by_gender': gender_distribution,
            'by_time': time_distribution
        }
    
    except Exception as e:
        print(f"[DB] ✗ Lỗi get_statistics: {e}")
        return {
            'by_age': [],
            'by_penalty_level': {},
            'by_gender': {},
            'by_time': {}
        }


def seed_mock_violations():
    """
    Tạo dữ liệu giả (mock data) để test
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Kiểm tra xem có dữ liệu chưa
        cursor.execute('SELECT COUNT(*) as cnt FROM violations')
        if cursor.fetchone()['cnt'] > 0:
            print("[DB] Database đã có dữ liệu, skip seed")
            return
        
        # Dữ liệu giả
        mock_data = [
            # Nhóm tuổi Dưới 25
            ('Trần Minh Khôi', '001234567890', 22, 'Nam', '30A-12345', 'car', 0.15, '4.000.000đ', 4, 'Normal'),
            ('Ngô Thu Hà', '002345678901', 23, 'Nữ', '30B-54321', 'motor', 0.05, '500.000đ', 2, 'Normal'),
            ('Phan Hoàng Anh', '003456789012', 24, 'Nam', '51C-11111', 'car', 0.08, '2.000.000đ', 2, 'Normal'),
            
            # Nhóm tuổi 25-35
            ('Võ Văn Thắng', '004567890123', 28, 'Nam', '36D-22222', 'car', 0.20, '8.000.000đ', 6, 'Normal'),
            ('Lê Thanh Tùng', '005678901234', 30, 'Nam', '51E-33333', 'motor', 0.08, '1.000.000đ', 4, 'Normal'),
            ('Bùi Hương Giang', '006789012345', 32, 'Nữ', '29F-44444', 'car', 0.12, '4.000.000đ', 4, 'Normal'),
            ('Hoàng Minh Tuấn', '007890123456', 29, 'Nam', '30G-55555', 'motor', 0.06, '1.000.000đ', 4, 'Normal'),
            
            # Nhóm tuổi 36-50
            ('Trương Văn Lâm', '008901234567', 38, 'Nam', '74H-66666', 'car', 0.25, '8.000.000đ', 6, 'Normal'),
            ('Đặng Thanh Hằng', '009012345678', 42, 'Nữ', '36I-77777', 'car', 0.18, '4.000.000đ', 4, 'Normal'),
            ('Vũ Gia Bảo', '010123456789', 45, 'Nam', '51J-88888', 'motor', 0.10, '1.000.000đ', 4, 'Normal'),
            
            # Nhóm tuổi Trên 50
            ('Trần Hữu Phong', '011234567890', 55, 'Nam', '30K-99999', 'car', 0.30, '16.000.000đ', 10, 'Normal'),
            ('Nguyễn Thị Loan', '012345678901', 58, 'Nữ', '29L-10101', 'motor', 0.07, '500.000đ', 2, 'Normal'),
        ]
        
        for data in mock_data:
            cursor.execute('''
                INSERT INTO violations 
                (name, cccd, age, gender, license_plate, vehicle_type, 
                 alcohol_level, fine_amount, points_deducted, gplx_status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', data)
        
        conn.commit()
        conn.close()
        print(f"[DB] ✓ Tạo {len(mock_data)} mẫu dữ liệu thành công")
    
    except Exception as e:
        print(f"[DB] ✗ Lỗi seed_mock_violations: {e}")
