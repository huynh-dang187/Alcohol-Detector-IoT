# 📊 ANALYTICS DASHBOARD - 12 CHỨC NĂNG THỐNG KÊ HOÀN CHỈNH

## 🎯 OVERVIEW

Implement **12 chức năng analytics** mạnh mẽ để dashboard thống kê chuyên nghiệp, có khả năng phân tích dữ liệu sâu sắc và hỗ trợ decision-making.

---

## 📦 DATABASE SCHEMA

### Cập nhật bảng violations

```sql
-- Thêm cột support analytics
ALTER TABLE violations ADD COLUMN (
    age_group VARCHAR(20),              -- 18-25, 25-35, 35-50, 50+
    violation_category VARCHAR(50),     -- First-time, Repeat-2, Repeat-3+
    location_zone VARCHAR(100),         -- Zone name for heatmap
    risk_level VARCHAR(20),             -- Low, Medium, High, Critical
    violation_date DATE,                -- Riêng date (cho grouping dễ hơn)
    violation_hour INTEGER,             -- Hour (0-23)
    vehicle_type VARCHAR(50),           -- Ô tô, Xe máy, Xe tải, etc.
    repeat_count INTEGER DEFAULT 0      -- Số lần vi phạm của người này
);

-- Create index cho performance
CREATE INDEX idx_violations_age_group ON violations(age_group);
CREATE INDEX idx_violations_vehicle_type ON violations(vehicle_type);
CREATE INDEX idx_violations_violation_date ON violations(violation_date);
CREATE INDEX idx_violations_violation_hour ON violations(violation_hour);
CREATE INDEX idx_violations_risk_level ON violations(risk_level);
CREATE INDEX idx_violations_cccd ON violations(cccd);  -- Để count repeat

-- Tạo bảng analytics cache (performance optimization)
CREATE TABLE analytics_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    metric_name VARCHAR(100),
    metric_value TEXT,                  -- JSON string
    date_range VARCHAR(50),             -- today, this_week, this_month, etc.
    cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

-- Tạo bảng officer performance
CREATE TABLE officer_performance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    officer_id INTEGER,
    officer_name VARCHAR(150),
    violations_count INTEGER DEFAULT 0,
    total_fines INTEGER DEFAULT 0,
    performance_score FLOAT DEFAULT 0,
    last_updated TIMESTAMP,
    FOREIGN KEY(officer_id) REFERENCES users(id)
);
```

---

## 🔌 BACKEND API ENDPOINTS

### Core Analytics API

```python
# config.py - Thêm constants
ANALYTICS_CACHE_TTL = 300  # 5 minutes cache
AGE_GROUPS = {
    '18-25': (18, 25),
    '25-35': (25, 35),
    '35-50': (35, 50),
    '50+': (50, 150)
}
RISK_LEVELS = {
    'safe': (0, 0.25),
    'low': (0.25, 0.4),
    'medium': (0.4, 0.6),
    'high': (0.6, 1.0)
}
```

### API Endpoints

```python
# Backend Flask routes

from flask import request, jsonify
from datetime import datetime, timedelta
import json

# ============ ENDPOINT 1: KPI SUMMARY ============
@app.route('/api/analytics/summary', methods=['GET'])
@login_required
def analytics_summary():
    """
    GET /api/analytics/summary?range=today|this_week|this_month|all
    
    Response:
    {
        "total_violations": 500,
        "today": 12,
        "this_week": 85,
        "this_month": 320,
        "total_fines": 2540000000,
        "average_alcohol": 0.32,
        "max_alcohol": 0.82,
        "safe_rate": 15.5,           # % an toàn
        "violation_rate": 84.5       # % có vi phạm
    }
    """
    pass

# ============ ENDPOINT 2: AGE GROUP DISTRIBUTION ============
@app.route('/api/analytics/age-distribution', methods=['GET'])
@login_required
def age_distribution():
    """
    GET /api/analytics/age-distribution
    
    Response:
    {
        "18-25": {"count": 145, "avg_alcohol": 0.38, "percentage": 29},
        "25-35": {"count": 165, "avg_alcohol": 0.32, "percentage": 33},
        "35-50": {"count": 125, "avg_alcohol": 0.28, "percentage": 25},
        "50+": {"count": 65, "avg_alcohol": 0.22, "percentage": 13}
    }
    """
    pass

# ============ ENDPOINT 3: VIOLATION LEVEL DISTRIBUTION ============
@app.route('/api/analytics/violation-levels', methods=['GET'])
@login_required
def violation_levels():
    """
    GET /api/analytics/violation-levels
    
    Response:
    {
        "an_toan": {"count": 75, "percentage": 15, "avg_fine": 0},
        "muc_1": {"count": 175, "percentage": 35, "avg_fine": 2500000},
        "muc_2": {"count": 200, "percentage": 40, "avg_fine": 19000000},
        "muc_3": {"count": 50, "percentage": 10, "avg_fine": 35000000}
    }
    """
    pass

# ============ ENDPOINT 4: GENDER DISTRIBUTION ============
@app.route('/api/analytics/gender-distribution', methods=['GET'])
@login_required
def gender_distribution():
    """
    GET /api/analytics/gender-distribution
    
    Response:
    {
        "M": {"count": 325, "percentage": 65, "avg_alcohol": 0.35},
        "F": {"count": 175, "percentage": 35, "avg_alcohol": 0.28},
        "Other": {"count": 0, "percentage": 0, "avg_alcohol": 0}
    }
    """
    pass

# ============ ENDPOINT 5: TIME SERIES (MEASUREMENT COUNT) ============
@app.route('/api/analytics/time-series', methods=['GET'])
@login_required
def time_series():
    """
    GET /api/analytics/time-series?granularity=hourly|daily|weekly|monthly
    
    Response:
    {
        "data": [
            {"date": "2026-05-21", "count": 12, "avg_alcohol": 0.32},
            {"date": "2026-05-20", "count": 15, "avg_alcohol": 0.30},
            ...
        ]
    }
    """
    pass

# ============ ENDPOINT 6: VEHICLE TYPE DISTRIBUTION ============
@app.route('/api/analytics/vehicle-distribution', methods=['GET'])
@login_required
def vehicle_distribution():
    """
    GET /api/analytics/vehicle-distribution
    
    Response:
    {
        "oto_va_xe_tuong_tu": {"count": 220, "percentage": 44},
        "xe_may_xe_gan_may": {"count": 240, "percentage": 48},
        "xe_tai": {"count": 40, "percentage": 8}
    }
    """
    pass

# ============ ENDPOINT 7: PEAK VIOLATION TIMES ============
@app.route('/api/analytics/peak-times', methods=['GET'])
@login_required
def peak_times():
    """
    GET /api/analytics/peak-times
    
    Response:
    {
        "morning": {"hours": "6-12", "count": 175, "percentage": 35},
        "afternoon": {"hours": "12-17", "count": 125, "percentage": 25},
        "evening": {"hours": "17-24", "count": 175, "percentage": 35},
        "night": {"hours": "24-6", "count": 25, "percentage": 5}
    }
    """
    pass

# ============ ENDPOINT 8: TOP VIOLATORS ============
@app.route('/api/analytics/top-violators', methods=['GET'])
@login_required
def top_violators():
    """
    GET /api/analytics/top-violators?limit=10
    
    Response:
    {
        "data": [
            {
                "rank": 1,
                "ho_ten": "Nguyễn A",
                "bien_so": "12A-12345",
                "violation_count": 5,
                "total_fines": 80000000,
                "last_violation": "2026-05-20",
                "category": "repeat-offender"
            },
            ...
        ]
    }
    """
    pass

# ============ ENDPOINT 9: GEOGRAPHIC HEATMAP ============
@app.route('/api/analytics/heatmap', methods=['GET'])
@login_required
def geographic_heatmap():
    """
    GET /api/analytics/heatmap?limit=5
    
    Response:
    {
        "data": [
            {
                "location": "Đường Nguyễn Huệ, HCM",
                "violation_count": 140,
                "percentage": 28,
                "avg_alcohol": 0.35,
                "risk_level": "high"
            },
            ...
        ]
    }
    """
    pass

# ============ ENDPOINT 10: OFFICER PERFORMANCE ============
@app.route('/api/analytics/officer-performance', methods=['GET'])
@login_required
def officer_performance():
    """
    GET /api/analytics/officer-performance
    
    Response:
    {
        "data": [
            {
                "rank": 1,
                "officer_name": "Officer A",
                "violations_recorded": 45,
                "total_fines": 450000000,
                "performance_score": 95,
                "efficiency": "high"
            },
            ...
        ]
    }
    """
    pass

# ============ ENDPOINT 11: RECURRENCE RATE ============
@app.route('/api/analytics/recurrence-rate', methods=['GET'])
@login_required
def recurrence_rate():
    """
    GET /api/analytics/recurrence-rate
    
    Response:
    {
        "first_time": {"count": 390, "percentage": 78},
        "repeat_2_3": {"count": 75, "percentage": 15},
        "repeat_4_plus": {"count": 35, "percentage": 7},
        "overall_recurrence_rate": 22,
        "industry_benchmark": 15,
        "trend": "up"  # up, down, stable
    }
    """
    pass

# ============ ENDPOINT 12: COMPARISON METRICS ============
@app.route('/api/analytics/comparison', methods=['GET'])
@login_required
def comparison_metrics():
    """
    GET /api/analytics/comparison
    
    Response:
    {
        "this_week_vs_last_week": {
            "violations_change": "+12%",
            "trend": "up",
            "fines_change": "+8%"
        },
        "this_month_vs_last_month": {
            "violations_change": "-5%",
            "trend": "down",
            "fines_change": "-3%"
        },
        "this_year_vs_last_year": {
            "violations_change": "+28%",
            "trend": "up"
        }
    }
    """
    pass

# ============ ENDPOINT 13: RISK ASSESSMENT ============
@app.route('/api/analytics/risk-assessment', methods=['GET'])
@login_required
def risk_assessment():
    """
    GET /api/analytics/risk-assessment
    
    Response:
    {
        "safe": {
            "count": 75,
            "percentage": 15,
            "trend": "stable",
            "change": "+1%"
        },
        "low": {
            "count": 175,
            "percentage": 35,
            "trend": "down",
            "change": "-8%"
        },
        "medium": {
            "count": 200,
            "percentage": 40,
            "trend": "up",
            "change": "+3%"
        },
        "high": {
            "count": 50,
            "percentage": 10,
            "trend": "stable",
            "change": "0%"
        },
        "alerts": [
            {"message": "Medium risk up 3%", "severity": "warning"},
            {"message": "High violators stable", "severity": "info"}
        ]
    }
    """
    pass

# ============ ENDPOINT 14: PREDICTIVE ANALYTICS ============
@app.route('/api/analytics/forecast', methods=['GET'])
@login_required
def forecast():
    """
    GET /api/analytics/forecast?days=7
    
    Response:
    {
        "forecast_period": "2026-05-21 to 2026-05-28",
        "expected_violations": 280,
        "confidence": 92,
        "expected_revenue": 1400000000,
        "peak_days": [
            {"date": "2026-05-24", "day": "Friday", "expected": 45},
            {"date": "2026-05-25", "day": "Saturday", "expected": 48}
        ],
        "peak_times": ["18-21", "19-23"],
        "recommendations": [
            "Increase patrol on Friday 18-21",
            "Focus on young drivers (18-25)"
        ]
    }
    """
    pass

# ============ ENDPOINT 15: DEMOGRAPHIC INSIGHTS ============
@app.route('/api/analytics/demographics', methods=['GET'])
@login_required
def demographic_insights():
    """
    GET /api/analytics/demographics
    
    Response:
    {
        "by_age": [
            {"age_group": "18-25", "avg_alcohol": 0.38, "risk_score": 9.5},
            {"age_group": "25-35", "avg_alcohol": 0.32, "risk_score": 7.5},
            {"age_group": "35-50", "avg_alcohol": 0.28, "risk_score": 5.5},
            {"age_group": "50+", "avg_alcohol": 0.22, "risk_score": 3.5}
        ],
        "by_gender": [
            {"gender": "M", "avg_alcohol": 0.35, "risk_score": 8.5},
            {"gender": "F", "avg_alcohol": 0.28, "risk_score": 6.5}
        ],
        "high_risk_profile": {
            "age": "18-25",
            "gender": "M",
            "vehicle": "Xe máy",
            "time": "18-21"
        },
        "recommendations": [
            "Target young male drivers for education",
            "Increase enforcement on motorbikes in evenings"
        ]
    }
    """
    pass

# ============ ENDPOINT 16: EXPORT REPORTS ============
@app.route('/api/analytics/export', methods=['GET'])
@login_required
def export_report():
    """
    GET /api/analytics/export?format=pdf|excel|csv&range=this_month
    
    Return: File download (PDF/Excel/CSV)
    """
    pass
```

---

## 🎨 FRONTEND STRUCTURE

### New Files

```
frontend/
├── pages/
│   └── analytics/
│       ├── dashboard.html              # Main analytics dashboard
│       ├── age-analysis.html           # Age group detail
│       ├── vehicle-analysis.html       # Vehicle type detail
│       ├── top-violators.html          # Top violators detail
│       ├── heatmap.html                # Geographic heatmap
│       └── officer-performance.html    # Officer stats
├── js/
│   └── analytics/
│       ├── analytics-api.js            # API calls for analytics
│       ├── charts-init.js              # Chart.js initialization
│       ├── dashboard.js                # Main dashboard logic
│       ├── utils.js                    # Helper functions
│       └── export.js                   # Export functionality
├── css/
│   └── analytics.css                   # Analytics styling
└── assets/
    └── icons/
        ├── chart-icon.svg
        ├── trend-up.svg
        └── trend-down.svg
```

---

## 📊 DASHBOARD LAYOUT

### Main Analytics Page

```html
<!DOCTYPE html>
<html>
<head>
    <title>Analytics Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@3.9.1"></script>
    <script src="https://cdn.jsdelivr.net/npm/moment@2.29.4"></script>
</head>
<body>
    <!-- HEADER -->
    <header class="analytics-header">
        <h1>📊 Bảng Điều Khiển Thống Kê</h1>
        <div class="controls">
            <select id="date-range">
                <option value="today">Hôm Nay</option>
                <option value="this_week">Tuần Này</option>
                <option value="this_month">Tháng Này</option>
                <option value="all">Tất Cả</option>
            </select>
            <button onclick="exportReport('pdf')">📥 Xuất PDF</button>
            <button onclick="exportReport('excel')">📊 Xuất Excel</button>
        </div>
    </header>

    <!-- SECTION 1: KPI CARDS -->
    <section class="kpi-cards">
        <div class="card">
            <h3>Tổng Vi Phạm</h3>
            <p class="value" id="total-violations">500</p>
            <p class="change positive">↑ +12% từ tuần trước</p>
        </div>
        <div class="card">
            <h3>Doanh Thu</h3>
            <p class="value" id="total-revenue">2,540M</p>
            <p class="change positive">↑ +8% từ tuần trước</p>
        </div>
        <div class="card">
            <h3>Trung Bình Nồng Độ</h3>
            <p class="value" id="avg-alcohol">0.32</p>
            <p class="unit">mg/L</p>
        </div>
        <div class="card">
            <h3>Tỷ Lệ An Toàn</h3>
            <p class="value" id="safe-rate">15.5</p>
            <p class="unit">%</p>
        </div>
    </section>

    <!-- SECTION 2: 2x2 GRID CHARTS -->
    <section class="chart-grid">
        <!-- Chart 1: Violation Levels -->
        <div class="chart-container">
            <h3>Phân Bố Mức Vi Phạm</h3>
            <canvas id="violationLevelChart"></canvas>
        </div>

        <!-- Chart 2: Gender Distribution -->
        <div class="chart-container">
            <h3>Phân Bố Giới Tính</h3>
            <canvas id="genderChart"></canvas>
        </div>

        <!-- Chart 3: Age Group -->
        <div class="chart-container">
            <h3>Phân Tích Theo Nhóm Tuổi</h3>
            <canvas id="ageChart"></canvas>
        </div>

        <!-- Chart 4: Vehicle Type -->
        <div class="chart-container">
            <h3>Phân Bố Theo Loại Xe</h3>
            <canvas id="vehicleChart"></canvas>
        </div>
    </section>

    <!-- SECTION 3: TIME SERIES -->
    <section class="time-series">
        <h3>📈 Xu Hướng Số Lượt Đo Theo Thời Gian</h3>
        <div class="time-range-selector">
            <button onclick="updateTimeSeries('hourly')">Theo Giờ</button>
            <button onclick="updateTimeSeries('daily')">Theo Ngày</button>
            <button onclick="updateTimeSeries('weekly')">Theo Tuần</button>
            <button onclick="updateTimeSeries('monthly')">Theo Tháng</button>
        </div>
        <canvas id="timeSeriesChart"></canvas>
    </section>

    <!-- SECTION 4: PEAK TIMES -->
    <section class="peak-times">
        <h3>⏱️ Giờ Cao Điểm Vi Phạm</h3>
        <canvas id="peakTimesChart"></canvas>
    </section>

    <!-- SECTION 5: TOP VIOLATORS -->
    <section class="top-violators">
        <h3>🔴 Top 10 Người Vi Phạm Nhiều Nhất</h3>
        <table>
            <thead>
                <tr>
                    <th>Xếp Hạng</th>
                    <th>Họ Tên</th>
                    <th>Biển Số</th>
                    <th>Lần Vi Phạm</th>
                    <th>Tổng Tiền Phạt</th>
                    <th>Lần Vi Phạm Gần Nhất</th>
                </tr>
            </thead>
            <tbody id="top-violators-table">
                <!-- Filled by JS -->
            </tbody>
        </table>
    </section>

    <!-- SECTION 6: GEOGRAPHIC HEATMAP -->
    <section class="heatmap">
        <h3>🗺️ Khu Vực Vi Phạm Nhiều Nhất</h3>
        <table>
            <thead>
                <tr>
                    <th>Xếp Hạng</th>
                    <th>Địa Điểm</th>
                    <th>Số Lần Vi Phạm</th>
                    <th>%</th>
                    <th>Mức Rủi Ro</th>
                </tr>
            </thead>
            <tbody id="heatmap-table">
                <!-- Filled by JS -->
            </tbody>
        </table>
    </section>

    <!-- SECTION 7: OFFICER PERFORMANCE -->
    <section class="officer-performance">
        <h3>👮 Hiệu Suất Cảnh Sát</h3>
        <canvas id="officerPerformanceChart"></canvas>
        <table>
            <thead>
                <tr>
                    <th>Xếp Hạng</th>
                    <th>Tên Cảnh Sát</th>
                    <th>Vi Phạm Ghi Nhận</th>
                    <th>Tổng Tiền Phạt</th>
                    <th>Điểm Hiệu Suất</th>
                </tr>
            </thead>
            <tbody id="officer-table">
                <!-- Filled by JS -->
            </tbody>
        </table>
    </section>

    <!-- SECTION 8: RECURRENCE RATE -->
    <section class="recurrence">
        <h3>🔄 Tỷ Lệ Tái Phạm</h3>
        <canvas id="recurrenceChart"></canvas>
        <div class="insights">
            <p>Tỷ lệ tái phạm: <span id="recurrence-rate">22%</span></p>
            <p>Mức tiêu chuẩn ngành: 15%</p>
            <p>Xu hướng: <span id="recurrence-trend">Tăng ⚠️</span></p>
        </div>
    </section>

    <!-- SECTION 9: COMPARISON METRICS -->
    <section class="comparison">
        <h3>📊 So Sánh Kỳ</h3>
        <div class="comparison-grid">
            <div class="comparison-card">
                <h4>Tuần Này vs Tuần Trước</h4>
                <p>Vi phạm: <span class="trend up">+12%</span></p>
                <p>Tiền phạt: <span class="trend up">+8%</span></p>
            </div>
            <div class="comparison-card">
                <h4>Tháng Này vs Tháng Trước</h4>
                <p>Vi phạm: <span class="trend down">-5%</span></p>
                <p>Tiền phạt: <span class="trend down">-3%</span></p>
            </div>
            <div class="comparison-card">
                <h4>Năm Này vs Năm Trước</h4>
                <p>Vi phạm: <span class="trend up">+28%</span></p>
                <p>Tiền phạt: <span class="trend up">+25%</span></p>
            </div>
        </div>
    </section>

    <!-- SECTION 10: RISK ASSESSMENT -->
    <section class="risk-assessment">
        <h3>⚡ Đánh Giá Rủi Ro</h3>
        <div class="risk-indicators">
            <div class="risk-item safe">
                <span class="status">🟢 An Toàn</span>
                <p>100% (0.00-0.25)</p>
                <p class="change">Tăng 5% từ tuần trước ✅</p>
            </div>
            <div class="risk-item moderate">
                <span class="status">🟡 Trung Bình</span>
                <p>87% (0.25-0.4)</p>
                <p class="change">Giảm 8% từ tuần trước ✅</p>
            </div>
            <div class="risk-item high">
                <span class="status">🟠 Cao</span>
                <p>92% (0.4-0.6)</p>
                <p class="change">Tăng 3% ⚠️ Theo dõi</p>
            </div>
            <div class="risk-item critical">
                <span class="status">🔴 Nghiêm Trọng</span>
                <p>88% (>0.6)</p>
                <p class="change">Ổn định 2%</p>
            </div>
        </div>
    </section>

    <!-- SECTION 11: PREDICTIVE FORECAST -->
    <section class="forecast">
        <h3>🔮 Dự Báo (7 Ngày Tới)</h3>
        <div class="forecast-info">
            <p>Vi phạm dự kiến: <strong id="forecast-violations">280 ±15</strong></p>
            <p>Độ chính xác: <strong id="forecast-confidence">92%</strong></p>
            <p>Doanh thu dự kiến: <strong id="forecast-revenue">1.4B VNĐ</strong></p>
        </div>
        <canvas id="forecastChart"></canvas>
        <div class="recommendations">
            <h4>💡 Khuyến Nghị:</h4>
            <ul id="forecast-recommendations">
                <!-- Filled by JS -->
            </ul>
        </div>
    </section>

    <!-- SECTION 12: DEMOGRAPHIC INSIGHTS -->
    <section class="demographics">
        <h3>👥 Phân Tích Nhân Khẩu Học</h3>
        <div class="demographics-grid">
            <div class="demo-card">
                <h4>Phân Tích Theo Tuổi</h4>
                <canvas id="ageRiskChart"></canvas>
            </div>
            <div class="demo-card">
                <h4>Phân Tích Theo Giới Tính</h4>
                <canvas id="genderRiskChart"></canvas>
            </div>
        </div>
        <div class="high-risk-profile">
            <h4>Hồ Sơ Rủi Ro Cao:</h4>
            <p>Độ tuổi: <strong id="high-risk-age">18-25</strong></p>
            <p>Giới tính: <strong id="high-risk-gender">Nam</strong></p>
            <p>Loại xe: <strong id="high-risk-vehicle">Xe máy</strong></p>
            <p>Thời gian: <strong id="high-risk-time">18-21</strong></p>
        </div>
    </section>

    <script src="js/analytics/charts-init.js"></script>
    <script src="js/analytics/dashboard.js"></script>
</body>
</html>
```

---

## 🔧 BACKEND IMPLEMENTATION DETAILS

### analytics.py (New File)

```python
# backend/analytics.py
from flask import Blueprint, request, jsonify
from flask_login import login_required
from datetime import datetime, timedelta
import sqlite3
from config import VI_PHAM_NONG_DO_CON
import json

analytics_bp = Blueprint('analytics', __name__, url_prefix='/api/analytics')

def get_date_range(range_type='this_month'):
    """Calculate date range based on type"""
    today = datetime.now().date()
    if range_type == 'today':
        return today, today
    elif range_type == 'this_week':
        start = today - timedelta(days=today.weekday())
        return start, today
    elif range_type == 'this_month':
        start = today.replace(day=1)
        return start, today
    else:  # all
        return None, today

def get_db():
    """Get database connection"""
    conn = sqlite3.connect('./database/violations.db')
    conn.row_factory = sqlite3.Row
    return conn

@analytics_bp.route('/summary', methods=['GET'])
@login_required
def summary():
    """KPI Summary"""
    range_type = request.args.get('range', 'this_month')
    start_date, end_date = get_date_range(range_type)
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Total violations
    if start_date:
        cursor.execute('''
            SELECT COUNT(*) as count, AVG(alcohol_level) as avg_alcohol,
                   MAX(alcohol_level) as max_alcohol
            FROM violations
            WHERE violation_date BETWEEN ? AND ?
        ''', (start_date, end_date))
    else:
        cursor.execute('''
            SELECT COUNT(*) as count, AVG(alcohol_level) as avg_alcohol,
                   MAX(alcohol_level) as max_alcohol
            FROM violations
        ''')
    
    result = cursor.fetchone()
    
    return jsonify({
        'total_violations': result['count'] or 0,
        'avg_alcohol': round(result['avg_alcohol'] or 0, 2),
        'max_alcohol': round(result['max_alcohol'] or 0, 2),
        'safe_rate': 15.5,  # Calculate based on alcohol_level <= 0.25
        'violation_rate': 84.5
    })

@analytics_bp.route('/age-distribution', methods=['GET'])
@login_required
def age_distribution():
    """Age group distribution"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT age_group, COUNT(*) as count, AVG(alcohol_level) as avg_alcohol
        FROM violations
        WHERE age_group IS NOT NULL
        GROUP BY age_group
    ''')
    
    results = cursor.fetchall()
    total = sum(r['count'] for r in results)
    
    data = {}
    for r in results:
        data[r['age_group']] = {
            'count': r['count'],
            'avg_alcohol': round(r['avg_alcohol'], 2),
            'percentage': round((r['count'] / total * 100), 1) if total > 0 else 0
        }
    
    return jsonify(data)

# ... Implement other 14 endpoints similarly ...

# Register blueprint
app.register_blueprint(analytics_bp)
```

---

## 📄 FRONTEND IMPLEMENTATION

### js/analytics/dashboard.js

```javascript
// Analytics Dashboard initialization and logic

class AnalyticsDashboard {
    constructor() {
        this.apiBase = 'http://localhost:5000/api/analytics';
        this.charts = {};
        this.init();
    }

    init() {
        console.log('[ANALYTICS] Initializing dashboard...');
        this.setupEventListeners();
        this.loadAllData();
    }

    setupEventListeners() {
        // Date range selector
        document.getElementById('date-range')?.addEventListener('change', (e) => {
            this.loadAllData(e.target.value);
        });

        // Time series buttons
        document.querySelectorAll('[data-timeseries]').forEach(btn => {
            btn.addEventListener('click', () => this.updateTimeSeries(btn.dataset.timeseries));
        });
    }

    async loadAllData(range = 'this_month') {
        try {
            // Load all 12 data sets in parallel
            const [
                summary, ageData, violationLevels, genderData,
                timeSeries, vehicleData, peakTimes, topViolators,
                heatmap, officerPerf, recurrence, comparison,
                riskAssessment, forecast, demographics
            ] = await Promise.all([
                this.fetchAPI('/summary', { range }),
                this.fetchAPI('/age-distribution'),
                this.fetchAPI('/violation-levels'),
                this.fetchAPI('/gender-distribution'),
                this.fetchAPI('/time-series', { granularity: 'daily' }),
                this.fetchAPI('/vehicle-distribution'),
                this.fetchAPI('/peak-times'),
                this.fetchAPI('/top-violators', { limit: 10 }),
                this.fetchAPI('/heatmap', { limit: 5 }),
                this.fetchAPI('/officer-performance'),
                this.fetchAPI('/recurrence-rate'),
                this.fetchAPI('/comparison'),
                this.fetchAPI('/risk-assessment'),
                this.fetchAPI('/forecast', { days: 7 }),
                this.fetchAPI('/demographics')
            ]);

            // Update UI
            this.updateKPICards(summary);
            this.renderViolationLevelChart(violationLevels);
            this.renderGenderChart(genderData);
            this.renderAgeChart(ageData);
            this.renderVehicleChart(vehicleData);
            this.renderTimeSeriesChart(timeSeries);
            this.renderPeakTimesChart(peakTimes);
            this.renderTopViolatorsTable(topViolators);
            this.renderHeatmapTable(heatmap);
            this.renderOfficerPerformanceChart(officerPerf);
            this.renderRecurrenceChart(recurrence);
            this.renderComparisonMetrics(comparison);
            this.renderRiskAssessment(riskAssessment);
            this.renderForecast(forecast);
            this.renderDemographics(demographics);

            console.log('[ANALYTICS] Dashboard loaded successfully');
        } catch (error) {
            console.error('[ANALYTICS] Error loading data:', error);
        }
    }

    async fetchAPI(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = `${this.apiBase}${endpoint}${queryString ? '?' + queryString : ''}`;
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
        return response.json();
    }

    updateKPICards(data) {
        document.getElementById('total-violations').textContent = data.total_violations;
        // Update other KPI cards...
    }

    renderViolationLevelChart(data) {
        const ctx = document.getElementById('violationLevelChart').getContext('2d');
        this.charts.violationLevel = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['An Toàn', 'Mức 1', 'Mức 2', 'Mức 3'],
                datasets: [{
                    data: [
                        data.an_toan.count,
                        data.muc_1.count,
                        data.muc_2.count,
                        data.muc_3.count
                    ],
                    backgroundColor: [
                        '#10b981',
                        '#f59e0b',
                        '#ef4444',
                        '#7f1d1d'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    }

    // ... Implement other 11 chart rendering methods ...

    async exportReport(format) {
        const range = document.getElementById('date-range').value;
        window.location.href = `${this.apiBase}/export?format=${format}&range=${range}`;
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    new AnalyticsDashboard();
});
```

---

## 📝 CHECKLIST IMPLEMENTATION

### Backend (Phase 1)
- [ ] Cập nhật database schema với các cột mới
- [ ] Tạo analytics.py với 16 endpoints
- [ ] Implement mỗi endpoint chi tiết
- [ ] Thêm caching layer (Redis optional)
- [ ] Test từng endpoint với Postman

### Frontend (Phase 2)
- [ ] Tạo analytics/dashboard.html
- [ ] Implement dashboard.js class
- [ ] Tạo charts-init.js
- [ ] Render 12 charts + tables
- [ ] Add export functionality (PDF/Excel)
- [ ] Mobile responsive design
- [ ] Test all features

### Data Processing (Phase 3)
- [ ] Populate age_group khi insert violation
- [ ] Tính repeat_count cho tái phạm
- [ ] Tính risk_level theo alcohol
- [ ] Populate location_zone
- [ ] Background job để update cached data

---

## 🚀 QUICK START

1. **Update Database:**
```sql
-- Run migration script
sqlite3 ./backend/database/violations.db < analytics_schema.sql
```

2. **Update Backend:**
```python
# Add to app.py
from analytics import analytics_bp
app.register_blueprint(analytics_bp)
```

3. **Start Frontend:**
```bash
cd frontend
python -m http.server 8000
```

4. **Access Dashboard:**
```
http://localhost:8000/pages/analytics/dashboard.html
```

---

## 💡 OPTIMIZATION TIPS

1. **Caching:** Cache thống kê mỗi 5 phút
2. **Pagination:** Bảng top violators dùng pagination
3. **Lazy Loading:** Load charts khi scroll vào view
4. **Database Indexes:** Đã tạo index trên các cột quan trọng
5. **Date Filtering:** Cho phép custom date range

---

Bạn muốn tôi bắt đầu implement từ đâu? Backend hay Frontend?
