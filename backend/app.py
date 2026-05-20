"""
app.py - Backend Flask Server với API RESTful
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import time
from datetime import datetime
import sqlite3
import os

from config import (
    FLASK_ENV, DEBUG, CORS_ORIGINS, ALCOHOL_LEVELS, VI_PHAM_NONG_DO_CON,
    get_penalty_info, COM_PORT, BAUD_RATE
)
from serial_worker import start_serial_worker, get_current_value, get_connection_status

# ============ KHỞI TẠO FLASK ============
app = Flask(__name__)
app.config['ENV'] = FLASK_ENV
app.config['DEBUG'] = DEBUG

# ============ CẤU HÌNH CORS ============
CORS(app, resources={r"/api/*": {"origins": CORS_ORIGINS}})

# ============ KHỞI TẠO DATABASE ============
DB_PATH = './database/violations.db'

def init_database():
    """Tạo bảng violations nếu chưa có, hoặc thêm cột nếu cần"""
    os.makedirs('./database', exist_ok=True)
    
    if not os.path.exists(DB_PATH):
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE violations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                ho_ten TEXT NOT NULL,
                cccd TEXT NOT NULL,
                bien_so TEXT NOT NULL,
                alcohol_level REAL NOT NULL,
                muc_phat TEXT NOT NULL,
                tien_phat INTEGER NOT NULL,
                diem_tru INTEGER NOT NULL,
                loai_xe TEXT DEFAULT 'oto_va_xe_tuong_tu',
                ghi_chu TEXT
            )
        ''')
        
        conn.commit()
        conn.close()
        print("[DB] ✓ Tạo bảng violations thành công")
    else:
        # Kiểm tra xem cột loai_xe đã tồn tại chưa
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute("PRAGMA table_info(violations)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'loai_xe' not in columns:
            try:
                cursor.execute('''
                    ALTER TABLE violations 
                    ADD COLUMN loai_xe TEXT DEFAULT 'oto_va_xe_tuong_tu'
                ''')
                conn.commit()
                print("[DB] ✓ Thêm cột loai_xe thành công")
            except Exception as e:
                print(f"[DB] ! Không thể thêm cột loai_xe: {e}")
        
        conn.close()
        print("[DB] ✓ Bảng violations đã tồn tại")


def save_violation(data):
    """Lưu thông tin vi phạm vào database"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO violations 
            (ho_ten, cccd, bien_so, alcohol_level, muc_phat, tien_phat, diem_tru, loai_xe, ghi_chu)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data['ho_ten'],
            data['cccd'],
            data['bien_so'],
            float(data['alcohol_level']),
            data['muc_phat'],
            int(data['tien_phat']),
            int(data['diem_tru']),
            data.get('loai_xe', 'oto_va_xe_tuong_tu'),
            data.get('ghi_chu', '')
        ))
        
        conn.commit()
        violation_id = cursor.lastrowid
        conn.close()
        
        print(f"[DB] ✓ Lưu vi phạm #{violation_id}: {data['ho_ten']} - {data['bien_so']} ({data.get('loai_xe', 'oto')})")
        return violation_id
    
    except Exception as e:
        print(f"[DB] ✗ Lỗi lưu dữ liệu: {e}")
        return None


def get_violations(limit=100):
    """Lấy danh sách vi phạm từ database"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, timestamp, ho_ten, cccd, bien_so, alcohol_level, 
                   muc_phat, tien_phat, diem_tru, loai_xe, ghi_chu
            FROM violations
            ORDER BY timestamp DESC
            LIMIT ?
        ''', (limit,))
        
        rows = cursor.fetchall()
        conn.close()
        
        violations = []
        for row in rows:
            violations.append({
                'id': row[0],
                'timestamp': row[1],
                'ho_ten': row[2],
                'cccd': row[3],
                'bien_so': row[4],
                'alcohol_level': row[5],
                'muc_phat': row[6],
                'tien_phat': row[7],
                'diem_tru': row[8],
                'loai_xe': row[9],
                'ghi_chu': row[10]
            })
        
        return violations
    
    except Exception as e:
        print(f"[DB] ✗ Lỗi lấy dữ liệu: {e}")
        return []


# ============ ENDPOINTS API ============

@app.route('/api/status', methods=['GET'])
def api_status():
    """
    GET /api/status
    Lấy thông tin trạng thái hệ thống
    """
    return jsonify({
        'status': 'ok',
        'timestamp': datetime.now().isoformat(),
        'com_port': COM_PORT,
        'baud_rate': BAUD_RATE,
        'connected': get_connection_status()
    })


@app.route('/api/alcohol', methods=['GET'])
def api_get_alcohol():
    """
    GET /api/alcohol?loai_xe=oto_va_xe_tuong_tu
    Lấy giá trị nồng độ cồn realtime
    Query params:
        loai_xe: xe_may_xe_gan_may hoặc oto_va_xe_tuong_tu (default)
    """
    alcohol_level = get_current_value()
    is_connected = get_connection_status()
    loai_xe = request.args.get('loai_xe', 'oto_va_xe_tuong_tu')
    penalty_info = get_penalty_info(alcohol_level, loai_xe)
    
    print(f"[API] GET /api/alcohol → {alcohol_level:.1f} mg/L ({loai_xe}) ({'Connected' if is_connected else 'Disconnected'})")
    
    return jsonify({
        'alcohol_level': round(alcohol_level, 2),
        'unit': 'mg/L',
        'connected': is_connected,
        'loai_xe': loai_xe,
        'timestamp': datetime.now().isoformat(),
        'penalty': {
            'level': penalty_info.get('name', 'Unknown'),
            'fine': penalty_info.get('fine', 0),
            'color': penalty_info.get('color', '#ffffff'),
            'description': penalty_info.get('penalty_description', '')
        }
    })


@app.route('/api/vi-pham', methods=['POST'])
def api_create_violation():
    """
    POST /api/vi-pham
    Lưu thông tin vi phạm từ Frontend
    
    Body JSON:
    {
        "ho_ten": "Nguyễn Văn A",
        "cccd": "123456789",
        "bien_so": "30A-12345",
        "alcohol_level": 0.45,
        "muc_phat": "Mức 3",
        "tien_phat": 35000000,
        "diem_tru": 10,
        "loai_xe": "oto_va_xe_tuong_tu",
        "ghi_chu": "Khu vực trung tâm thành phố"
    }
    """
    try:
        data = request.get_json()
        
        # Validate dữ liệu
        required_fields = ['ho_ten', 'cccd', 'bien_so', 'alcohol_level', 'muc_phat', 'tien_phat', 'diem_tru']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Thiếu trường: {field}'}), 400
        
        # Lưu vào database
        violation_id = save_violation(data)
        
        if violation_id:
            return jsonify({
                'status': 'ok',
                'violation_id': violation_id,
                'message': 'Vi phạm đã được ghi nhận',
                'timestamp': datetime.now().isoformat()
            }), 201
        else:
            return jsonify({'error': 'Lỗi lưu dữ liệu'}), 500
    
    except Exception as e:
        print(f"[API] ✗ Lỗi POST /api/vi-pham: {e}")
        return jsonify({'error': str(e)}), 400


@app.route('/api/vi-pham/lich-su', methods=['GET'])
def api_violation_history():
    """
    GET /api/vi-pham/lich-su
    Lấy danh sách lịch sử vi phạm
    
    Query params:
    - limit: số bản ghi (default: 100)
    """
    limit = request.args.get('limit', 100, type=int)
    violations = get_violations(limit)
    
    return jsonify({
        'status': 'ok',
        'count': len(violations),
        'data': violations
    })


@app.route('/api/vi-pham/thong-ke', methods=['GET'])
def api_violation_stats():
    """
    GET /api/vi-pham/thong-ke
    Lấy thống kê vi phạm
    """
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Tổng số vi phạm
        cursor.execute('SELECT COUNT(*) FROM violations')
        total_violations = cursor.fetchone()[0]
        
        # Tổng tiền phạt
        cursor.execute('SELECT SUM(tien_phat) FROM violations')
        result = cursor.fetchone()
        total_fine = result[0] if result[0] else 0
        
        # Thống kê theo mức phạt
        cursor.execute('''
            SELECT muc_phat, COUNT(*) as count, SUM(tien_phat) as total_fine
            FROM violations
            GROUP BY muc_phat
        ''')
        
        stats_by_level = {}
        for row in cursor.fetchall():
            stats_by_level[row[0]] = {
                'count': row[1],
                'total_fine': row[2]
            }
        
        conn.close()
        
        return jsonify({
            'status': 'ok',
            'total_violations': total_violations,
            'total_fine': total_fine,
            'by_level': stats_by_level
        })
    
    except Exception as e:
        print(f"[API] ✗ Lỗi GET /api/vi-pham/thong-ke: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat()
    })


@app.errorhandler(404)
def not_found(e):
    """Handler cho 404 errors"""
    return jsonify({'error': 'Endpoint không tồn tại'}), 404


@app.errorhandler(500)
def internal_error(e):
    """Handler cho 500 errors"""
    return jsonify({'error': 'Lỗi server nội bộ'}), 500


# ============ KHỞI ĐỘNG SERVER ============
if __name__ == '__main__':
    print("\n" + "=" * 80)
    print("🚀 KHỞI ĐỘNG BACKEND - ALCOHOL DETECTOR IOT")
    print("=" * 80)
    
    # Khởi tạo database
    init_database()
    
    # Khởi động thread đọc serial
    print(f"\n[MAIN] Khởi động thread đọc Serial ({COM_PORT} @ {BAUD_RATE} baud)...")
    serial_thread = start_serial_worker()
    time.sleep(2)  # Chờ thread kết nối
    
    # Thông tin server
    print(f"\n[MAIN] ✓ Backend sẵn sàng")
    print(f"[MAIN] API Server: http://localhost:5000")
    print(f"[MAIN] CORS cho phép: {len(CORS_ORIGINS)} origins")
    print(f"[MAIN] Database: {DB_PATH}")
    print("=" * 80 + "\n")
    
    # Chạy Flask server
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=DEBUG,
        use_reloader=False,
        threaded=True
    )
