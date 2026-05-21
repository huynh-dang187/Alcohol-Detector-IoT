# 📊 ANALYTICS 12 FEATURES - QUICK PROMPT (Copy-Paste Ready)

Implement **12 chức năng analytics thống kê** hoàn chỉnh:

1. **KPI Summary** - Tổng hợp metrics chính
2. **Age Distribution** - Phân tích theo nhóm tuổi
3. **Violation Levels** - Phân bố mức vi phạm
4. **Gender Distribution** - Phân tích giới tính
5. **Time Series** - Số lượt đo theo thời gian
6. **Vehicle Distribution** - Phân bố loại xe
7. **Peak Times** - Giờ cao điểm vi phạm
8. **Top Violators** - Top 10 người vi phạm
9. **Geographic Heatmap** - Khu vực vi phạm
10. **Officer Performance** - Hiệu suất cảnh sát
11. **Recurrence Rate** - Tỷ lệ tái phạm
12. **Comparison Metrics** - So sánh kỳ

---

## 🗄️ DATABASE SCHEMA

```sql
-- Cập nhật violations table
ALTER TABLE violations ADD COLUMN (
    age_group VARCHAR(20),              -- 18-25, 25-35, 35-50, 50+
    violation_category VARCHAR(50),     -- First-time, Repeat-2, Repeat-3+
    location_zone VARCHAR(100),         -- Zone name
    risk_level VARCHAR(20),             -- Low, Medium, High, Critical
    violation_date DATE,
    violation_hour INTEGER,             -- 0-23
    vehicle_type VARCHAR(50),
    repeat_count INTEGER DEFAULT 0
);

CREATE INDEX idx_violations_age_group ON violations(age_group);
CREATE INDEX idx_violations_vehicle_type ON violations(vehicle_type);
CREATE INDEX idx_violations_violation_date ON violations(violation_date);
CREATE INDEX idx_violations_violation_hour ON violations(violation_hour);

-- Analytics cache table
CREATE TABLE analytics_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    metric_name VARCHAR(100),
    metric_value TEXT,
    date_range VARCHAR(50),
    cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

-- Officer performance tracking
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

## 🔌 BACKEND ENDPOINTS (16 total)

```
GET /api/analytics/summary?range=today|week|month|all
├─ KPI: total, today, week, month, revenue, avg_alcohol, safe_rate

GET /api/analytics/age-distribution
├─ {18-25, 25-35, 35-50, 50+} với count, avg_alcohol, percentage

GET /api/analytics/violation-levels
├─ {an_toan, muc_1, muc_2, muc_3} với stats

GET /api/analytics/gender-distribution
├─ {M, F, Other} với count, percentage, avg_alcohol

GET /api/analytics/time-series?granularity=hourly|daily|weekly|monthly
├─ Array [{date, count, avg_alcohol}, ...]

GET /api/analytics/vehicle-distribution
├─ {oto_va_xe_tuong_tu, xe_may_xe_gan_may, xe_tai}

GET /api/analytics/peak-times
├─ {morning, afternoon, evening, night} với hours, count, percentage

GET /api/analytics/top-violators?limit=10
├─ Array [{rank, ho_ten, bien_so, violation_count, total_fines, last_violation}]

GET /api/analytics/heatmap?limit=5
├─ Array [{location, violation_count, percentage, avg_alcohol, risk_level}]

GET /api/analytics/officer-performance
├─ Array [{rank, officer_name, violations, fines, score}]

GET /api/analytics/recurrence-rate
├─ {first_time%, repeat_2_3%, repeat_4_plus%, overall_rate, benchmark, trend}

GET /api/analytics/comparison?range=week|month|year
├─ {week_vs_week, month_vs_month, year_vs_year} violations%, fines%

GET /api/analytics/risk-assessment
├─ {safe, low, medium, high} với count, %, trend, alerts

GET /api/analytics/forecast?days=7
├─ {expected_violations, confidence, expected_revenue, peak_days, recommendations}

GET /api/analytics/demographics
├─ {by_age, by_gender, high_risk_profile, recommendations}

GET /api/analytics/export?format=pdf|excel|csv
├─ File download
```

---

## 🎨 FRONTEND STRUCTURE

```
frontend/
├── pages/analytics/dashboard.html
├── js/analytics/
│   ├── dashboard.js          # Main class (AnalyticsDashboard)
│   ├── charts-init.js        # Chart.js setup
│   └── export.js             # Export PDF/Excel
└── css/analytics.css
```

---

## 📊 DASHBOARD SECTIONS (12 sections)

```
1. KPI Cards (4 cards) - Total, Revenue, Avg Alcohol, Safe Rate
2. Violation Levels Chart (Doughnut) - An toàn/Mức 1/2/3 distribution
3. Gender Distribution Chart (Pie) - Nam/Nữ ratio
4. Age Group Chart (Bar) - 18-25/25-35/35-50/50+
5. Vehicle Type Chart (Donut) - Ô tô/Xe máy/Xe tải
6. Time Series Chart (Line) - Daily/Weekly/Monthly trend
7. Peak Times Chart (Bar) - Morning/Afternoon/Evening/Night
8. Top Violators Table - Top 10 with ranking
9. Geographic Heatmap Table - Top 5 locations
10. Officer Performance Chart + Table
11. Recurrence Rate Chart + Insights
12. Comparison Metrics Cards - Week/Month/Year comparison
13. Risk Assessment Indicators - Safe/Low/Medium/High alerts
14. Predictive Forecast - 7-day forecast + recommendations
15. Demographic Insights - Age/Gender risk profiles
```

---

## 🚀 IMPLEMENTATION STEPS

### Backend (Tuần 1)
1. Update database schema (16 cột + 3 table mới)
2. Create `analytics.py` with 16 endpoints
3. Implement SQL queries cho mỗi endpoint
4. Add caching layer (optional Redis)
5. Test endpoints với Postman

### Frontend (Tuần 2)
1. Create `analytics/dashboard.html`
2. Create `js/analytics/dashboard.js` (AnalyticsDashboard class)
3. Initialize 15 charts với Chart.js
4. Render 9 tables động
5. Add export functionality (PDF/Excel/CSV)
6. Mobile responsive
7. Test & optimize

### Data Preparation (Tuần 3)
1. Migrate dữ liệu cũ (fill age_group, vehicle_type, etc.)
2. Create background job để update analytics cache
3. Populate repeat_count
4. Add risk_level logic

---

## 💻 CODE STRUCTURE

### analytics.py (Backend)

```python
from flask import Blueprint, request, jsonify
import sqlite3

analytics_bp = Blueprint('analytics', __name__)

def get_db():
    conn = sqlite3.connect('./database/violations.db')
    conn.row_factory = sqlite3.Row
    return conn

@analytics_bp.route('/api/analytics/summary', methods=['GET'])
def summary():
    range_type = request.args.get('range', 'this_month')
    # SQL queries here
    return jsonify({...})

@analytics_bp.route('/api/analytics/age-distribution', methods=['GET'])
def age_distribution():
    # GROUP BY age_group
    return jsonify({...})

# ... 14 more endpoints ...
```

### dashboard.js (Frontend)

```javascript
class AnalyticsDashboard {
    constructor() {
        this.apiBase = 'http://localhost:5000/api/analytics';
        this.charts = {};
    }

    async loadAllData() {
        const data = await Promise.all([
            fetch('/api/analytics/summary'),
            fetch('/api/analytics/age-distribution'),
            // ... 14 more endpoints ...
        ]);
        
        this.renderCharts(data);
    }

    renderCharts(data) {
        this.renderViolationLevelChart(data[0]);
        this.renderGenderChart(data[1]);
        // ... 13 more charts ...
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new AnalyticsDashboard().loadAllData();
});
```

---

## ⏱️ TIMELINE

| Phase | Duration | Focus |
|-------|----------|-------|
| Backend | 1 week | 16 endpoints + optimization |
| Frontend | 1 week | 12 charts + 9 tables |
| Data | Few days | Migration + populate fields |
| Testing | 2-3 days | QA + performance |
| **Total** | **~2.5 weeks** | **Full analytics system** |

---

## ✅ DELIVERY CHECKLIST

### Backend
- [ ] Database migrations completed
- [ ] 16 API endpoints working
- [ ] Caching implemented
- [ ] Error handling added
- [ ] Postman tests passed

### Frontend
- [ ] Dashboard HTML created
- [ ] 12 charts rendering correctly
- [ ] 9 tables populated
- [ ] Export (PDF/Excel/CSV) working
- [ ] Mobile responsive
- [ ] Performance optimized

### Data
- [ ] Migration script created
- [ ] age_group populated
- [ ] vehicle_type populated
- [ ] repeat_count calculated
- [ ] risk_level assigned

### Testing
- [ ] All endpoints tested
- [ ] All charts render correctly
- [ ] Export functions tested
- [ ] Performance benchmarked
- [ ] No console errors

---

## 🎯 QUICK REFERENCE

**Database:** SQLite + 3 new tables + 16 columns
**Backend:** 16 REST endpoints in analytics.py
**Frontend:** 1 HTML page + 12 charts + 9 tables
**UI:** Dashboard with filters, export, responsive design
**Performance:** Caching, indexed queries, pagination

---

Ready to implement? 🚀 Which do you prefer:
- [ ] Start with Backend
- [ ] Start with Frontend
- [ ] All at once (recommended)
