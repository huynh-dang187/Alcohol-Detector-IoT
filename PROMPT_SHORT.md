# PROMPT RỮN GỌN DÙNG CHO AGENT KHÁC (Copy-Paste Ready)

Bạn là một expert developer Python/Flask. Tôi có một dự án **IoT Alcohol Detection System** (Hệ Thống Giám Sát Nồng Độ Cồn) hiện đang ở giai đoạn cơ bản. Dự án hiện có:

✅ Backend Flask REST API (localhost:5000)
✅ Serial Port real-time (đọc từ Proteus)
✅ SQLite Database
✅ Frontend HTML/JS/TailwindCSS đơn giản

**MỤC TIÊU:** Nâng cấp hệ thống theo 5 Phase (lộ trình 6-8 tuần):

---

## PHASE 1: DATABASE + AUTHENTICATION (Tuần 1-2)

### Database Schema Upgrade
Thêm:
```sql
-- Bảng users
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    username VARCHAR UNIQUE NOT NULL,
    password_hash VARCHAR NOT NULL,        -- Bcrypt
    email VARCHAR UNIQUE,
    full_name VARCHAR,
    role VARCHAR DEFAULT 'OFFICER',        -- ADMIN, OFFICER, VIEWER
    department VARCHAR,
    phone_number VARCHAR,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    last_login TIMESTAMP
);

-- Update violations table
ALTER TABLE violations ADD COLUMN:
    officer_id INTEGER,
    officer_name VARCHAR,
    gender VARCHAR,                        -- M, F, Other
    phone_number VARCHAR,
    address TEXT,
    status VARCHAR DEFAULT 'recorded',
    image_path VARCHAR,
    created_at_timestamp TIMESTAMP,
    FOREIGN KEY(officer_id) REFERENCES users(id)
);

-- Bảng audit logs
CREATE TABLE audit_logs (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    action VARCHAR,
    resource_type VARCHAR,
    resource_id INTEGER,
    details TEXT,
    ip_address VARCHAR,
    created_at TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
);
```

### Backend Requirements
Thêm dependencies:
```
Flask-Login==0.6.2
Flask-JWT-Extended==4.4.4
Flask-Bcrypt==1.0.1
```

Tạo files:
- `auth.py` - Xử lý login/logout
- `roles.py` - RBAC (Role-Based Access Control)
- `.env` - Environment variables

API endpoints cần tạo:
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/logout` - Đăng xuất
- `POST /api/auth/register` - Đăng ký (admin only)
- `GET /api/auth/profile` - Lấy info user
- `PUT /api/auth/profile` - Update info
- `POST /api/auth/change-password` - Đổi mật khẩu

Roles:
- **ADMIN**: Quản lý user, xem/edit/delete tất cả vi phạm
- **OFFICER**: Ghi nhận vi phạm, xem vi phạm của mình, xem thống kê
- **VIEWER**: Chỉ xem lịch sử, không edit

---

## PHASE 2: FRONTEND UI/UX ENHANCEMENT (Tuần 2-3)

### New Directory Structure
```
frontend/
├── pages/
│   ├── login.html
│   ├── dashboard.html
│   ├── violations/record.html
│   ├── violations/history.html
│   ├── violations/detail.html
│   ├── reports/statistics.html
│   ├── reports/export.html
│   └── users/management.html (ADMIN only)
├── components/
│   ├── navbar.html
│   ├── sidebar.html
│   └── footer.html
├── js/
│   ├── auth.js
│   ├── app.js
│   ├── api.js
│   ├── charts.js
│   └── utils.js
└── css/
    ├── style.css
    ├── sidebar.css
    └── responsive.css
```

### UI Components
- **Navbar**: Logo + User dropdown + Logout
- **Sidebar**: Navigation menu (Dashboard, Violations, Reports, Users)
- **Form Enhancement**: Thêm Gender (radio), Address (textarea), Phone, Image upload
- **Responsive**: Mobile-first design

---

## PHASE 3: DASHBOARD & STATISTICS (Tuần 3-4)

### Dashboard Widgets
1. **KPI Cards** (4 cards): Total violations, Today, This week, This month
2. **Bar Chart**: Violations by level (Mức 1, 2, 3)
3. **Pie Chart**: Gender distribution (Nam/Nữ)
4. **Line Chart**: Daily trend
5. **Top 5 Widget**: Most common violation locations
6. **Revenue Widget**: Total fines collected

### Backend Endpoints
```
GET /api/statistics/summary - KPI data
GET /api/statistics/timeline?range=day|week|month - Trend data
GET /api/statistics/by-level - Distribution by penalty level
GET /api/statistics/by-gender - Distribution by gender
GET /api/statistics/top-locations?limit=5 - Top violation locations
GET /api/statistics/export?format=csv|json|excel - Export
```

### Use Chart.js
```html
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
```

---

## PHASE 4: MEASUREMENT CONTROL (Tuần 4-5)

### UI Components
- **Mode Selection**: Radio buttons (Manual / Auto continuous)
- **Control Buttons**: Start / Stop
- **Display**: Current value, Max value, Duration
- **Real-time Chart**: Show measurement values over time

### Backend Endpoints
```
POST /api/measurement/start?mode=manual|auto
POST /api/measurement/stop
GET /api/measurement/status
GET /api/measurement/values
DELETE /api/measurement/reset
```

### Measurement Logic
- **Manual Mode**: User nhấn Start, đợi 3s, nhấn Stop → lấy giá trị
- **Auto Mode**: Liên tục đo 5 giây/lần, lưu max value, show chart realtime

---

## PHASE 5: POLISH & OPTIMIZATION (Tuần 5-6)

### Security
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CSRF token
- [ ] Password hashing (Bcrypt)
- [ ] Input validation
- [ ] Error sanitization

### Performance
- [ ] Database indexes
- [ ] Query optimization
- [ ] Pagination for large datasets
- [ ] CSS/JS minification (optional)
- [ ] Lazy loading

### Code Quality
- [ ] Logging throughout
- [ ] Error handling
- [ ] Code comments
- [ ] API documentation
- [ ] Unit tests (optional)

---

## TECH STACK

**Backend**:
- Python 3.8+
- Flask 2.3.3
- Flask-Login + Flask-JWT + Flask-Bcrypt
- SQLite (dev) or PostgreSQL (prod)

**Frontend**:
- HTML5 + CSS3 + Vanilla JS
- TailwindCSS (CDN)
- Chart.js (biểu đồ)
- SweetAlert2 (thông báo)

---

## TIMELINE

| Phase | Duration | Focus |
|-------|----------|-------|
| Phase 1 | 2 weeks | Auth + Database |
| Phase 2 | 1 week | UI/UX + Multi-page |
| Phase 3 | 1.5 weeks | Dashboard + Charts |
| Phase 4 | 1 week | Measurement Control |
| Phase 5 | 1 week | Security + Optimize |
| **Total** | **~6-8 weeks** | **Full Upgrade** |

---

## IMPLEMENTATION NOTES

1. **Start with Phase 1** - Database + Auth là nền tảng
2. **Backup database** trước khi migration
3. **Test từng endpoint** với Postman
4. **Mobile-first** design approach
5. **Security first** - không skip validation
6. **Document everything** - API, Database schema, deployment steps

---

## DEBUGGING TIPS

```bash
# Check backend
python -c "import flask; print(flask.__version__)"

# Test API
curl http://localhost:5000/api/status

# Check database
sqlite3 database/violations.db ".schema"

# View logs
tail -f app.log
```

---

Hãy bắt đầu từ Phase 1 (Database + Authentication). Khi nào hoàn thành Phase 1, báo lại để qua Phase 2.

**Ready to start?** 🚀
