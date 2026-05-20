"""
config.py - Cấu hình toàn bộ ứng dụng Backend
"""

import os
from datetime import timedelta

# ============ CẤU HÌNH SERIAL PORT ============
COM_PORT = os.getenv('COM_PORT', 'COM2')
BAUD_RATE = 9600
SERIAL_TIMEOUT = 1
SERIAL_RETRY_INTERVAL = 5  # Thử kết nối lại sau 5 giây

# ============ CẤU HÌNH CHUYỂN ĐỔI DỮ LIỆU ============
# Proteus gửi dữ liệu theo thang 0-900, cần convert sang 0-1 (hoặc 0-0.5)
# Công thức: alcohol_level_mg_lit = raw_value / 900
ALCOHOL_DATA_SCALE = 900  # Chia cho 900 để convert sang thang mới (0-1 mg/L)

# ============ CẤU HÌNH FLASK ============
FLASK_ENV = os.getenv('FLASK_ENV', 'development')
DEBUG = True
JSON_SORT_KEYS = False

# ============ CẤU HÌNH CORS (Cross-Origin Resource Sharing) ============
# Frontend có thể từ port khác gọi API
CORS_ORIGINS = [
    '*',                          # Allow tất cả origins (development - KHÔNG dùng production)
    'http://localhost:3000',      # Frontend dev server (nếu có)
    'http://localhost:8080',      # Hoặc port khác
    'http://127.0.0.1:3000',
    'http://127.0.0.1:8080',
    'http://localhost:5000',      # Nếu frontend cùng server
    'http://127.0.0.1:5000',
    'null',                        # Cho phép mở file HTML trực tiếp từ file system
]

# ============ CẤU HÌNH DATABASE ============
DATABASE_TYPE = os.getenv('DATABASE_TYPE', 'sqlite')  # sqlite hoặc mysql

if DATABASE_TYPE == 'sqlite':
    DATABASE_URL = 'sqlite:///./database/violations.db'
elif DATABASE_TYPE == 'mysql':
    DATABASE_URL = f"mysql+pymysql://{os.getenv('DB_USER', 'root')}:{os.getenv('DB_PASSWORD', '')}@{os.getenv('DB_HOST', 'localhost')}/{os.getenv('DB_NAME', 'alcohol_detector')}"
else:
    DATABASE_URL = 'sqlite:///./database/violations.db'

# ============ CẤU HÌNH SESSION ============
PERMANENT_SESSION_LIFETIME = timedelta(hours=24)
SESSION_COOKIE_SECURE = False  # Bỏ True nếu dùng HTTPS trong production
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'

# ============ CẤU HÌNH NỒNG ĐỘ CỒN ============
# Các mức phạt theo nồng độ cồn và loại xe (theo Luật giao thông đường bộ)
VI_PHAM_NONG_DO_CON = {
    "xe_may_xe_gan_may": {
        "name": "Xe máy/Xe gắn máy",
        "color": "#3b82f6",
        "muc_1": {
            "dieu_kien": {
                "khi_tho_mg_lit": "<= 0.25",
                "mau_mg_100ml": "<= 50"
            },
            "xu_phat": {
                "phat_tien": "2-3 triệu đồng",
                "phat_tien_min": 2000000,
                "phat_tien_max": 3000000,
                "phat_tien_avg": 2500000,
                "tru_diem_gplx": 4,
                "tuoc_gplx": None
            },
            "color": "#f59e0b",
            "level_name": "Mức 1"
        },
        "muc_2": {
            "dieu_kien": {
                "khi_tho_mg_lit": "0.25-0.4",
                "mau_mg_100ml": "50-80"
            },
            "xu_phat": {
                "phat_tien": "6-8 triệu đồng",
                "phat_tien_min": 6000000,
                "phat_tien_max": 8000000,
                "phat_tien_avg": 7000000,
                "tuoc_gplx": "10-12 tháng",
                "tru_diem_gplx": 10
            },
            "color": "#ef4444",
            "level_name": "Mức 2"
        },
        "muc_3": {
            "dieu_kien": {
                "khi_tho_mg_lit": "> 0.4",
                "mau_mg_100ml": "> 80"
            },
            "xu_phat": {
                "phat_tien": "8-10 triệu đồng",
                "phat_tien_min": 8000000,
                "phat_tien_max": 10000000,
                "phat_tien_avg": 9000000,
                "tuoc_gplx": "22-24 tháng",
                "tru_diem_gplx": 10
            },
            "color": "#7f1d1d",
            "level_name": "Mức 3 (Kịch khung)"
        }
    },
    "oto_va_xe_tuong_tu": {
        "name": "Ô tô và xe tương tự",
        "color": "#ef4444",
        "muc_1": {
            "dieu_kien": {
                "khi_tho_mg_lit": "<= 0.25",
                "mau_mg_100ml": "<= 50"
            },
            "xu_phat": {
                "phat_tien": "6-8 triệu đồng",
                "phat_tien_min": 6000000,
                "phat_tien_max": 8000000,
                "phat_tien_avg": 7000000,
                "tuoc_gplx": "10-12 tháng",
                "tru_diem_gplx": 4
            },
            "color": "#f59e0b",
            "level_name": "Mức 1"
        },
        "muc_2": {
            "dieu_kien": {
                "khi_tho_mg_lit": "0.25-0.4",
                "mau_mg_100ml": "50-80"
            },
            "xu_phat": {
                "phat_tien": "18-20 triệu đồng",
                "phat_tien_min": 18000000,
                "phat_tien_max": 20000000,
                "phat_tien_avg": 19000000,
                "tuoc_gplx": "22-24 tháng",
                "tru_diem_gplx": 10
            },
            "color": "#ef4444",
            "level_name": "Mức 2"
        },
        "muc_3": {
            "dieu_kien": {
                "khi_tho_mg_lit": "> 0.4",
                "mau_mg_100ml": "> 80"
            },
            "xu_phat": {
                "phat_tien": "30-40 triệu đồng",
                "phat_tien_min": 30000000,
                "phat_tien_max": 40000000,
                "phat_tien_avg": 35000000,
                "tuoc_gplx": "22-24 tháng",
                "tru_diem_gplx": 10
            },
            "color": "#7f1d1d",
            "level_name": "Mức 3 (Kịch khung)"
        }
    }
}

# Giữ lại cấu trúc cũ để backward compatibility
ALCOHOL_LEVELS = {
    'safe': {
        'max_level': 20,
        'name': 'An toàn',
        'color': '#10b981',
        'fine': 0,
        'penalty_description': 'Không có vi phạm'
    }
}

# ============ CẤU HÌNH LOG ============
LOG_FILE = os.getenv('LOG_FILE', './logs/app.log')
LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')

# ============ CẤU HÌNH API ============
JSON_RESPONSE_CHARSET = 'utf-8'
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max upload

def get_penalty_info(alcohol_level, loai_xe='oto_va_xe_tuong_tu'):
    """
    Lấy thông tin phạt dựa trên nồng độ cồn và loại xe
    
    Args:
        alcohol_level (float): Nồng độ cồn (mg/L)
        loai_xe (str): Loại xe - 'xe_may_xe_gan_may' hoặc 'oto_va_xe_tuong_tu' (default)
    
    Returns:
        dict: Thông tin mức phạt
    """
    alcohol_level = float(alcohol_level)
    
    # Kiểm tra loại xe hợp lệ
    if loai_xe not in VI_PHAM_NONG_DO_CON:
        loai_xe = 'oto_va_xe_tuong_tu'
    
    # An toàn - không phát hiện hoặc < 0.01 mg/L
    if alcohol_level < 0.01:
        return {
            'level': 'safe',
            'name': 'An toàn',
            'color': '#10b981',
            'fine': 0,
            'penalty_points': 0,
            'penalty_description': 'Không có vi phạm',
            'loai_xe': loai_xe
        }
    
    # Kiểm tra các mức vi phạm
    xe_config = VI_PHAM_NONG_DO_CON[loai_xe]
    
    if alcohol_level <= 0.25:
        # Mức 1: ≤ 0.25 mg/L (≤ 50 mg/100ml)
        muc = xe_config['muc_1']
        return {
            'level': 'muc_1',
            'name': muc['level_name'],
            'color': muc['color'],
            'fine': muc['xu_phat']['phat_tien_avg'],
            'fine_min': muc['xu_phat']['phat_tien_min'],
            'fine_max': muc['xu_phat']['phat_tien_max'],
            'fine_text': muc['xu_phat']['phat_tien'],
            'penalty_points': muc['xu_phat']['tru_diem_gplx'],
            'license_suspension': muc['xu_phat'].get('tuoc_gplx', None),
            'penalty_description': f"{muc['xu_phat']['phat_tien']} | Trừ {muc['xu_phat']['tru_diem_gplx']} điểm" + (f" | Tước {muc['xu_phat']['tuoc_gplx']}" if muc['xu_phat'].get('tuoc_gplx') else ""),
            'loai_xe': loai_xe
        }
    elif alcohol_level <= 0.4:
        # Mức 2: 0.25 < alcohol ≤ 0.4 mg/L (50-80 mg/100ml)
        muc = xe_config['muc_2']
        return {
            'level': 'muc_2',
            'name': muc['level_name'],
            'color': muc['color'],
            'fine': muc['xu_phat']['phat_tien_avg'],
            'fine_min': muc['xu_phat']['phat_tien_min'],
            'fine_max': muc['xu_phat']['phat_tien_max'],
            'fine_text': muc['xu_phat']['phat_tien'],
            'penalty_points': muc['xu_phat']['tru_diem_gplx'],
            'license_suspension': muc['xu_phat'].get('tuoc_gplx', None),
            'penalty_description': f"{muc['xu_phat']['phat_tien']} | Trừ {muc['xu_phat']['tru_diem_gplx']} điểm" + (f" | Tước {muc['xu_phat']['tuoc_gplx']}" if muc['xu_phat'].get('tuoc_gplx') else ""),
            'loai_xe': loai_xe
        }
    else:
        # Mức 3: > 0.4 mg/L (> 80 mg/100ml)
        muc = xe_config['muc_3']
        return {
            'level': 'muc_3',
            'name': muc['level_name'],
            'color': muc['color'],
            'fine': muc['xu_phat']['phat_tien_avg'],
            'fine_min': muc['xu_phat']['phat_tien_min'],
            'fine_max': muc['xu_phat']['phat_tien_max'],
            'fine_text': muc['xu_phat']['phat_tien'],
            'penalty_points': muc['xu_phat']['tru_diem_gplx'],
            'license_suspension': muc['xu_phat'].get('tuoc_gplx', None),
            'penalty_description': f"{muc['xu_phat']['phat_tien']} | Trừ {muc['xu_phat']['tru_diem_gplx']} điểm | Tước {muc['xu_phat']['tuoc_gplx']} (Kịch khung)",
            'loai_xe': loai_xe
        }
