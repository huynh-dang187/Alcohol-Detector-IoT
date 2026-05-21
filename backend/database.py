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
