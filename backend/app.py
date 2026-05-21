"""
app.py - Backend Flask Server với API RESTful
Chứa tất cả các endpoint API chuẩn cho hệ thống đo cồn IoT
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import time
from datetime import datetime

from database import (
    init_database, verify_login, save_violation, 
    get_violation_stats, get_all_violations
)
from serial_worker import (
    start_serial_worker, get_current_value, get_connection_status,
    get_measure_mode, set_measure_mode, trigger_manual_measurement
)

# ============ KHỞI TẠO FLASK ============
app = Flask(__name__)
app.config['JSON_AS_ASCII'] = False

# ============ CẤU HÌNH CORS ============
CORS(app)

# ============ HÀNG SỐ TÍNH TOÁN MỤC PHạT ============
PENALTY_LIMITS = {
    'car': [  # Ô tô và xe tương tự
        {'max': 0.04, 'level': 'An toàn', 'fine': 0, 'points': 0, 'color': '#4CAF50'},
        {'max': 0.08, 'level': 'Mức 1', 'fine': '2.000.000đ', 'points': 2, 'color': '#FFC107'},
        {'max': 0.15, 'level': 'Mức 2', 'fine': '4.000.000đ', 'points': 4, 'color': '#FF9800'},
        {'max': 0.25, 'level': 'Mức 3', 'fine': '8.000.000đ', 'points': 6, 'color': '#F44336'},
        {'max': float('inf'), 'level': 'Mức 4', 'fine': '16.000.000đ', 'points': 10, 'color': '#8B0000'}
    ],
    'motor': [  # Xe máy, xe gắn máy
        {'max': 0.03, 'level': 'An toàn', 'fine': 0, 'points': 0, 'color': '#4CAF50'},
        {'max': 0.05, 'level': 'Mức 1', 'fine': '500.000đ', 'points': 2, 'color': '#FFC107'},
        {'max': 0.08, 'level': 'Mức 2', 'fine': '1.000.000đ', 'points': 4, 'color': '#FF9800'},
        {'max': 0.15, 'level': 'Mức 3', 'fine': '2.500.000đ', 'points': 6, 'color': '#F44336'},
        {'max': float('inf'), 'level': 'Mức 4', 'fine': '5.000.000đ', 'points': 10, 'color': '#8B0000'}
    ]
}


def get_penalty_by_level(alcohol_level, vehicle_type='car'):
    """Tính toán mục phạt dựa trên nồng độ cồn và loại xe"""
    vehicle_type = vehicle_type if vehicle_type in PENALTY_LIMITS else 'car'
    limits = PENALTY_LIMITS[vehicle_type]
    
    for limit in limits:
        if alcohol_level <= limit['max']:
            return limit
    
    return limits[-1]


# ============ API ENDPOINTS ============

@app.route('/api/login', methods=['POST'])
def api_login():
    """
    POST /api/login
    Đăng nhập hệ thống
    
    Body JSON:
    {
        "username": "csgt01",
        "password": "123"
    }
    
    Response:
    {
        "status": "success",
        "role": "officer",
        "fullname": "Chiến sĩ Nguyễn Văn A"
    }
    """
    try:
        data = request.get_json()
        username = data.get('username', '').strip()
        password = data.get('password', '').strip()
        
        if not username or not password:
            return jsonify({'status': 'error', 'message': 'Username hoặc password không hợp lệ'}), 400
        
        result = verify_login(username, password)
        
        if result['success']:
            print(f"[API] ✓ {username} đăng nhập thành công ({result['role']})")
            return jsonify({
                'status': 'success',
                'role': result['role'],
                'fullname': result['fullname']
            }), 200
        else:
            print(f"[API] ✗ Đăng nhập thất bại: {username}")
            return jsonify({'status': 'error', 'message': 'Username hoặc password sai'}), 401
    
    except Exception as e:
        print(f"[API] ✗ Lỗi login: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 400


@app.route('/api/alcohol', methods=['GET'])
def api_get_alcohol():
    """
    GET /api/alcohol?vehicle_type=car
    Lấy giá trị nồng độ cồn realtime
    
    Query params:
    - vehicle_type: 'car' hoặc 'motor' (default: 'car')
    
    Response:
    {
        "alcohol_level": 0.15,
        "connected": true,
        "measure_mode": "auto",
        "timestamp": "2026-05-21T12:34:56"
    }
    """
    try:
        alcohol_level = get_current_value()
        is_connected = get_connection_status()
        mode = get_measure_mode()
        
        print(f"[API] GET /api/alcohol → {alcohol_level:.2f} mg/L (Mode: {mode})")
        
        return jsonify({
            'alcohol_level': round(alcohol_level, 2),
            'connected': is_connected,
            'measure_mode': mode,
            'timestamp': datetime.now().isoformat()
        }), 200
    
    except Exception as e:
        print(f"[API] ✗ Lỗi GET /api/alcohol: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/api/trigger-manual', methods=['POST'])
def api_trigger_manual():
    """
    POST /api/trigger-manual
    Kích hoạt đo thủ công - ghi nhận Peak Value cao nhất trong 2 giây
    
    Response:
    {
        "status": "success",
        "peak_value": 0.18,
        "timestamp": "2026-05-21T12:34:56"
    }
    """
    try:
        peak_value = trigger_manual_measurement()
        
        print(f"[API] ✓ Đo thủ công hoàn tất: {peak_value:.2f} mg/L")
        
        return jsonify({
            'status': 'success',
            'peak_value': round(peak_value, 2),
            'timestamp': datetime.now().isoformat()
        }), 200
    
    except Exception as e:
        print(f"[API] ✗ Lỗi POST /api/trigger-manual: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/api/toggle-mode', methods=['POST'])
def api_toggle_mode():
    """
    POST /api/toggle-mode
    Chuyển đổi chế độ đo (auto ↔ manual)
    
    Body JSON:
    {
        "mode": "auto" hoặc "manual"
    }
    
    Response:
    {
        "status": "success",
        "measure_mode": "auto",
        "timestamp": "2026-05-21T12:34:56"
    }
    """
    try:
        data = request.get_json()
        mode = data.get('mode', 'auto').lower()
        
        if mode not in ['auto', 'manual']:
            return jsonify({'status': 'error', 'message': 'Chế độ không hợp lệ'}), 400
        
        set_measure_mode(mode)
        
        print(f"[API] ✓ Chế độ đo được thay đổi thành: {mode}")
        
        return jsonify({
            'status': 'success',
            'measure_mode': mode,
            'timestamp': datetime.now().isoformat()
        }), 200
    
    except Exception as e:
        print(f"[API] ✗ Lỗi POST /api/toggle-mode: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/api/violation', methods=['POST'])
def api_create_violation():
    """
    POST /api/violation
    Ghi nhận vi phạm giao thông
    
    Body JSON:
    {
        "name": "Nguyễn Văn A",
        "cccd": "012345678910",
        "age": 35,
        "gender": "Nam",
        "license_plate": "30A-12345",
        "vehicle_type": "car",
        "alcohol_level": 0.15,
        "gplx_status": "Không bị đề xuất tước bằng"
    }
    
    Response:
    {
        "status": "success",
        "violation_id": 1,
        "message": "Vi phạm đã được ghi nhận",
        "timestamp": "2026-05-21T12:34:56"
    }
    """
    try:
        data = request.get_json()
        
        # Kiểm tra các trường bắt buộc
        required_fields = ['name', 'cccd', 'age', 'gender', 'license_plate', 'vehicle_type', 'alcohol_level']
        for field in required_fields:
            if field not in data:
                return jsonify({'status': 'error', 'message': f'Thiếu trường: {field}'}), 400
        
        # Tính toán mục phạt
        vehicle_type = data['vehicle_type']
        alcohol_level = float(data['alcohol_level'])
        penalty = get_penalty_by_level(alcohol_level, vehicle_type)
        
        # Chuẩn bị dữ liệu để lưu
        violation_data = {
            'name': data['name'],
            'cccd': data['cccd'],
            'age': int(data['age']),
            'gender': data['gender'],
            'license_plate': data['license_plate'],
            'vehicle_type': vehicle_type,
            'alcohol_level': alcohol_level,
            'fine_amount': penalty['fine'],
            'points_deducted': penalty['points'],
            'gplx_status': data.get('gplx_status', '')
        }
        
        # Lưu vào database
        violation_id = save_violation(violation_data)
        
        if violation_id:
            print(f"[API] ✓ Lưu vi phạm #{violation_id}: {data['name']} - {data['license_plate']}")
            return jsonify({
                'status': 'success',
                'violation_id': violation_id,
                'penalty_level': penalty['level'],
                'fine_amount': penalty['fine'],
                'points_deducted': penalty['points'],
                'message': 'Vi phạm đã được ghi nhận',
                'timestamp': datetime.now().isoformat()
            }), 201
        else:
            return jsonify({'status': 'error', 'message': 'Lỗi lưu dữ liệu'}), 500
    
    except Exception as e:
        print(f"[API] ✗ Lỗi POST /api/violation: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 400


@app.route('/api/stats', methods=['GET'])
def api_get_stats():
    """
    GET /api/stats
    Lấy thống kê tổng hợp vi phạm (Chỉ dành cho admin)
    
    Requires: Kiểm tra quyền từ Frontend (localStorage role)
    
    Response:
    {
        "status": "success",
        "total_fine": 25000000,
        "total_cases": 5,
        "total_points": 30,
        "by_gender": {
            "Nam": 3,
            "Nữ": 2,
            "Khác": 0
        },
        "by_vehicle": {
            "car": 3,
            "motor": 2
        }
    }
    """
    try:
        stats = get_violation_stats()
        
        print(f"[API] GET /api/stats → Tổng ca: {stats['total_cases']}, Tổng tiền: {stats['total_fine']}")
        
        return jsonify({
            'status': 'success',
            'total_fine': stats['total_fine'],
            'total_cases': stats['total_cases'],
            'total_points': stats['total_points'],
            'by_gender': stats['by_gender'],
            'by_vehicle': stats['by_vehicle'],
            'timestamp': datetime.now().isoformat()
        }), 200
    
    except Exception as e:
        print(f"[API] ✗ Lỗi GET /api/stats: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat()
    }), 200


@app.errorhandler(404)
def not_found(e):
    """Handler cho 404 errors"""
    return jsonify({'status': 'error', 'message': 'Endpoint không tồn tại'}), 404


@app.errorhandler(500)
def internal_error(e):
    """Handler cho 500 errors"""
    return jsonify({'status': 'error', 'message': 'Lỗi server nội bộ'}), 500


# ============ KHỞI ĐỘNG SERVER ============
if __name__ == '__main__':
    print("\n" + "=" * 80)
    print("🚀 KHỞI ĐỘNG BACKEND - ALCOHOL DETECTOR IoT")
    print("=" * 80)
    
    # Khởi tạo database
    print("[MAIN] Khởi tạo database...")
    init_database()
    
    # Khởi động thread đọc serial
    print("[MAIN] Khởi động thread đọc Serial (COM2 @ 9600 baud)...")
    serial_thread = start_serial_worker()
    time.sleep(1)
    
    # Thông tin server
    print("\n[MAIN] ✓ Backend sẵn sàng")
    print("[MAIN] API Server: http://localhost:5000")
    print("[MAIN] Database: ./database/system.db")
    print("[MAIN] CORS: Cho phép tất cả origins")
    print("=" * 80 + "\n")
    
    # Chạy Flask server
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=False,
        use_reloader=False,
        threaded=True
    )
