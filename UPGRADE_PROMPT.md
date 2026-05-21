# 🚀 PROMPT NÂNG CẤP HỆ THỐNG GIÁM SÁT NỒNG ĐỘ CỒN

## 📋 THÔNG TIN DỰ ÁN

**Tên dự án:** Hệ Thống Giám Sát Nồng Độ Cồn - IoT Alcohol Detection & Traffic Violation Recording

**Hiện trạng:**
- ✅ Backend Flask REST API (localhost:5000)
- ✅ Serial Port real-time (Proteus → COM2)
- ✅ SQLite Database (violations.db)
- ✅ Frontend HTML/JS/TailwindCSS
- ✅ Thống kê cơ bản + hình ảnh trực quan

**Vị trí dự án:** `d:\Nam_3\IOT\BaiTapLon\Alcohol-Detector-IoT`

**Cấu trúc hiện tại:**
```
Alcohol-Detector-IoT/
├── backend/
│   ├── app.py                 # Flask main server
│   ├── config.py              # Config + penalty rules
│   ├── serial_worker.py       # Serial port reading
│   ├── requirements.txt
│   └── database/violations.db
├── frontend/
│   ├── index.html
│   ├── history.html
│   ├── js/
│   │   ├── app.js
│   │   └── charts.js
│   └── css/style.css
└── README.md
```

---

## 🎯 MỤC TIÊU NÂNG CẤP

### **Phase 1: Database & Authentication (Tuần 1-2)**

#### 1.1 Database Schema Upgrade
```sql
-- Thêm bảng users
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,        -- Bcrypt hash
    email VARCHAR(100) UNIQUE,
    full_name VARCHAR(150),
    role VARCHAR(20) DEFAULT 'OFFICER',         -- ADMIN, OFFICER, VIEWER
    department VARCHAR(100),
    phone_number VARCHAR(20),
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Cập nhật bảng violations
ALTER TABLE violations ADD COLUMN:
    officer_id INTEGER,                         -- FK → users.id
    officer_name VARCHAR(150),
    gender VARCHAR(20),                         -- M, F, Other
    phone_number VARCHAR(20),
    address TEXT,
    status VARCHAR(50) DEFAULT 'recorded',      -- recorded, approved, paid
    image_path VARCHAR(255),                    -- Path to violation image
    created_at_timestamp TIMESTAMP,
    FOREIGN KEY(officer_id) REFERENCES users(id)
);

-- Thêm bảng logs (audit trail)
CREATE TABLE audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action VARCHAR(255),
    resource_type VARCHAR(100),
    resource_id INTEGER,
    details TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
);
```

#### 1.2 Backend Implementation
**Cần thêm:**
- `auth.py` - Authentication logic (Flask-Login + Bcrypt)
- `roles.py` - Role-based access control (RBAC)
- API endpoints:
  - `POST /api/auth/register` - Đăng ký user (admin only)
  - `POST /api/auth/login` - Đăng nhập
  - `POST /api/auth/logout` - Đăng xuất
  - `GET /api/auth/profile` - Lấy thông tin user
  - `PUT /api/auth/profile` - Cập nhật thông tin
  - `POST /api/auth/change-password` - Đổi mật khẩu

**Dependencies cần thêm:**
```txt
Flask-Login==0.6.2
Flask-JWT-Extended==4.4.4
Flask-Bcrypt==1.0.1
python-dotenv==1.0.0
```

**File config cần thêm:** `.env`
```env
SECRET_KEY=your_secret_key_here_change_in_production
JWT_SECRET_KEY=your_jwt_secret_key_here
DATABASE_URL=sqlite:///./database/violations.db
FLASK_ENV=development
DEBUG=True
```

#### 1.3 Session Management
- Dùng **Flask-Login** cho session-based auth
- JWT tokens cho mobile/API clients (optional)
- Session timeout: 24 giờ
- CSRF protection: Yes

---

### **Phase 2: Frontend UI/UX Enhancement (Tuần 2-3)**

#### 2.1 New Frontend Structure
```
frontend/
├── pages/
│   ├── login.html               # Login page
│   ├── dashboard.html           # Main dashboard
│   ├── violations/
│   │   ├── record.html         # Ghi nhận vi phạm
│   │   ├── history.html        # Lịch sử vi phạm
│   │   └── detail.html         # Chi tiết vi phạm
│   ├── reports/
│   │   ├── statistics.html     # Thống kê
│   │   └── export.html         # Export báo cáo
│   └── users/
│       ├── management.html     # Quản lý user (ADMIN)
│       └── profile.html        # Hồ sơ cá nhân
├── components/
│   ├── navbar.html             # Top navigation
│   ├── sidebar.html            # Side navigation
│   └── footer.html
├── js/
│   ├── auth.js                 # Login/logout logic
│   ├── app.js                  # Main app logic
│   ├── api.js                  # API client
│   ├── charts.js               # Chart rendering
│   ├── utils.js                # Utility functions
│   └── measurement.js          # Measurement control
├── css/
│   ├── style.css
│   ├── responsive.css
│   ├── sidebar.css
│   └── forms.css
└── assets/
    ├── icons/
    └── images/
```

#### 2.2 Multi-Page Layout
- **Navbar:** Logo + User profile dropdown + Logout
- **Sidebar:** Navigation menu (Dashboard, Violations, Reports, Users)
- **Content Area:** Dynamic page loading
- **Footer:** Version + Support info

#### 2.3 Form Enhancement
Thêm các field mới:
- Giới Tính (Gender): Radio button (Nam/Nữ/Khác)
- Địa Chỉ (Address): Text area
- SĐT Liên Hệ (Phone): Input
- Hình Ảnh (Image): File upload
- Ghi Chú (Notes): Textarea

---

### **Phase 3: Dashboard & Statistics (Tuần 3-4)**

#### 3.1 Dashboard Widgets
```
┌────────────────────────────────────────────────────┐
│ 📊 DASHBOARD                                       │
├────────────────────────────────────────────────────┤
│                                                    │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐              │
│ │ Tổng │ │ Hôm  │ │ Tuần │ │ Tháng│              │
│ │ Vi P │ │ Nay  │ │ Này  │ │ Này  │              │
│ │  500 │ │  12  │ │  45  │ │ 180  │              │
│ └──────┘ └──────┘ └──────┘ └──────┘              │
│                                                    │
│ ┌─────────────────────────────────────────────┐  │
│ │ 📈 Vi Phạm Theo Mức (Bar Chart)             │  │
│ │ Mức 1: ████░░░░░░ 30%                       │  │
│ │ Mức 2: ███░░░░░░░ 45%                       │  │
│ │ Mức 3: █░░░░░░░░░ 25%                       │  │
│ └─────────────────────────────────────────────┘  │
│                                                    │
│ ┌─────────────────────────────────────────────┐  │
│ │ 👥 Thống Kê Giới Tính                       │  │
│ │ Nam: ███████░░ 65%                          │  │
│ │ Nữ:  ██░░░░░░ 35%                           │  │
│ └─────────────────────────────────────────────┘  │
│                                                    │
│ ┌─────────────────────────────────────────────┐  │
│ │ 💰 Doanh Thu Vi Phạm                        │  │
│ │ Tổng: 2,540,000,000 VNĐ                    │  │
│ │ Tuần Này: 125,000,000 VNĐ                  │  │
│ └─────────────────────────────────────────────┘  │
│                                                    │
│ ┌─────────────────────────────────────────────┐  │
│ │ 📍 Top 5 Địa Điểm Vi Phạm                  │  │
│ │ 1. Đường Nguyễn Huệ, HCM: 25 vụ            │  │
│ │ 2. Quốc lộ 1, HCM: 18 vụ                   │  │
│ │ 3. Đường Lê Lợi, HCM: 15 vụ                │  │
│ │ ...                                         │  │
│ └─────────────────────────────────────────────┘  │
│                                                    │
└────────────────────────────────────────────────────┘
```

#### 3.2 Statistics Endpoints (Backend)
```python
# GET /api/statistics/summary
# - Total violations count
# - Today/Week/Month violations
# - Total fine amount
# - By level distribution
# - By gender distribution

# GET /api/statistics/timeline?range=day|week|month|year
# - Daily/Weekly/Monthly trend

# GET /api/statistics/top-locations?limit=5
# - Most violations by location

# GET /api/statistics/export?format=json|csv|excel
# - Export full dataset
```

#### 3.3 Charts Library
Dùng **Chart.js** (nhẹ, không cần build):
```html
<script src="https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js"></script>
```

---

### **Phase 4: Measurement Control (Tuần 4-5)**

#### 4.1 Measurement Modes
```
┌─────────────────────────────────────────┐
│ 🎯 ĐIỀU KHIỂN ĐO NỒNG ĐỘ CỒN           │
├─────────────────────────────────────────┤
│                                         │
│ Chế độ đo:                              │
│ [✓] Tự động (Liên tục)  [ ] Bộ sách    │
│                                         │
│ [▶ Bắt Đầu] [⏹ Dừng]                  │
│                                         │
│ Giá trị hiện tại: 0.28 mg/L            │
│ Giá trị cao nhất: 0.35 mg/L            │
│ Thời gian: 00:15 (15 giây)             │
│                                         │
│ ━━━━━━━━━━━━━━━━━━━━━━━                │
│ Nồng độ theo thời gian:                │
│ [Biểu đồ line chart]                   │
│                                         │
└─────────────────────────────────────────┘
```

#### 4.2 Backend Implementation
```python
# Thêm global state:
measurement_session = {
    'is_running': False,
    'mode': 'manual',  # manual, auto
    'start_time': None,
    'values': [],      # List các giá trị
    'max_value': 0
}

# API Endpoints:
# POST /api/measurement/start?mode=manual|auto
# POST /api/measurement/stop
# GET /api/measurement/status
# GET /api/measurement/values
# DELETE /api/measurement/reset
```

#### 4.3 WebSocket Real-time (Optional)
Nếu muốn real-time update mà không fetch liên tục:
```python
# Dùng Flask-SocketIO
# Event: measurement_update
# Data: { value: 0.28, timestamp: "2026-05-21T14:30:00" }
```

---

### **Phase 5: Polish & Optimization (Tuần 5-6)**

#### 5.1 Security Checklist
- [ ] SQL Injection prevention (use prepared statements)
- [ ] XSS prevention (sanitize inputs)
- [ ] CSRF token protection
- [ ] Password hashing (Bcrypt)
- [ ] HTTPS in production
- [ ] Rate limiting on API
- [ ] Input validation
- [ ] Error message sanitization

#### 5.2 Performance Optimization
- [ ] Database indexes on frequently queried columns
- [ ] Pagination for large datasets
- [ ] Lazy loading for images
- [ ] CSS/JS minification
- [ ] Database query optimization
- [ ] Caching strategy (Redis optional)

#### 5.3 Code Quality
- [ ] Remove hardcoded values
- [ ] Add logging throughout
- [ ] Unit tests for critical functions
- [ ] API documentation (Swagger optional)
- [ ] Code comments
- [ ] Error handling

---

## 📦 TECH STACK CUỐI CÙNG

### **Backend**
```
Python 3.8+
├─ Flask 2.3.3
├─ Flask-Login 0.6.2
├─ Flask-JWT-Extended 4.4.4
├─ Flask-CORS 4.0.0
├─ Flask-Bcrypt 1.0.1
├─ PySerial 3.5
├─ python-dotenv 1.0.0
└─ SQLite 3 (hoặc PostgreSQL)
```

### **Frontend**
```
HTML5 + CSS3 + Vanilla JavaScript
├─ TailwindCSS (CDN)
├─ Chart.js 3.9.1 (biểu đồ)
├─ SweetAlert2 (thông báo)
└─ moment.js (xử lý thời gian)
```

### **Database**
```
SQLite (dev) hoặc PostgreSQL (prod)
├─ 3 bảng: users, violations, audit_logs
└─ Relationships + constraints
```

---

## 🔄 LỘ TRÌNH CHI TIẾT

### **TUẦN 1-2: PHASE 1 (Database + Auth)**

**Ngày 1-2:**
- [ ] Backup database hiện tại
- [ ] Create `auth.py` (login logic)
- [ ] Create `roles.py` (RBAC)
- [ ] Update `config.py` (JWT + Bcrypt)
- [ ] Update database schema

**Ngày 3-4:**
- [ ] Implement `/api/auth/login` endpoint
- [ ] Implement `/api/auth/logout` endpoint
- [ ] Implement `/api/auth/register` endpoint
- [ ] Add session middleware
- [ ] Test authentication flow

**Ngày 5-6:**
- [ ] Add role-based authorization to existing endpoints
- [ ] Create audit logging
- [ ] Test RBAC permissions
- [ ] Add password change endpoint
- [ ] Create admin user

**Ngày 7-8:**
- [ ] Add email validation (optional)
- [ ] Add token refresh logic
- [ ] Create password reset flow (optional)
- [ ] Security audit
- [ ] Documentation

---

### **TUẦN 2-3: PHASE 2 (Frontend UI)**

**Ngày 1-2:**
- [ ] Create login.html page
- [ ] Create navbar.html component
- [ ] Create sidebar.html component
- [ ] Implement responsive CSS

**Ngày 3-4:**
- [ ] Refactor index.html → dashboard.html
- [ ] Create violations/record.html
- [ ] Create violations/history.html
- [ ] Update form with new fields (gender, address, phone)

**Ngày 5-6:**
- [ ] Create reports/statistics.html
- [ ] Create users/management.html (ADMIN)
- [ ] Create users/profile.html
- [ ] Add navigation logic

**Ngày 7-8:**
- [ ] Add image upload to violation form
- [ ] Add form validation
- [ ] Test mobile responsiveness
- [ ] Add loading states

---

### **TUẦN 3-4: PHASE 3 (Dashboard)**

**Ngày 1-2:**
- [ ] Add Chart.js library
- [ ] Create dashboard widgets (HTML)
- [ ] Implement statistics API endpoints

**Ngày 3-4:**
- [ ] Create violation level bar chart
- [ ] Create gender distribution pie chart
- [ ] Create daily trend line chart
- [ ] Create top locations widget

**Ngày 5-6:**
- [ ] Add date range filter
- [ ] Add data export (CSV/JSON)
- [ ] Optimize chart rendering
- [ ] Add real-time refresh

**Ngày 7-8:**
- [ ] Test all charts
- [ ] Add print functionality
- [ ] Performance optimization
- [ ] User acceptance testing

---

### **TUẦN 4-5: PHASE 4 (Measurement)**

**Ngày 1-2:**
- [ ] Create measurement control UI
- [ ] Create `/api/measurement/start` endpoint
- [ ] Create `/api/measurement/stop` endpoint
- [ ] Add measurement state management

**Ngày 3-4:**
- [ ] Implement auto-measurement mode
- [ ] Implement manual measurement mode
- [ ] Add real-time value updates (WebSocket optional)
- [ ] Add max value tracking

**Ngày 5-6:**
- [ ] Create measurement history log
- [ ] Add measurement export
- [ ] Test both modes
- [ ] Add error handling

**Ngày 7-8:**
- [ ] Optimize measurement collection
- [ ] Add data persistence
- [ ] Performance testing
- [ ] User documentation

---

### **TUẦN 5-6: PHASE 5 (Polish)**

**Ngày 1-2:**
- [ ] Security code review
- [ ] SQL injection tests
- [ ] XSS vulnerability tests
- [ ] Fix identified issues

**Ngày 3-4:**
- [ ] Performance profiling
- [ ] Database indexing
- [ ] Query optimization
- [ ] Caching implementation

**Ngày 5-6:**
- [ ] Write API documentation
- [ ] Create user manual
- [ ] Add comprehensive logging
- [ ] Code cleanup

**Ngày 7-8:**
- [ ] Full system testing
- [ ] Load testing
- [ ] Production deployment prep
- [ ] Final review

---

## 🎯 CHECKLIST HOÀN THÀNH

### **Must-Have (Bắt buộc)**
- [ ] User authentication (Login/Logout)
- [ ] Role-based access control
- [ ] Gender field in violations
- [ ] Dashboard with statistics
- [ ] Measurement control buttons
- [ ] Export reports
- [ ] Security hardening

### **Nice-to-Have (Tùy chọn)**
- [ ] Email notifications
- [ ] SMS alerts
- [ ] Mobile app
- [ ] Advanced analytics
- [ ] Custom reports
- [ ] API rate limiting
- [ ] Webhook integration

---

## 📞 CONTACT & SUPPORT

**Khi gặp vấn đề:**
1. Kiểm tra logs (backend console + browser console)
2. Verify database schema migrations
3. Test API endpoints với Postman
4. Check environment variables (.env)
5. Reset database nếu cần

**Debugging tips:**
```bash
# Backend logs
cd backend
python app.py  # Watch console output

# Database check
sqlite3 database/violations.db
.schema
SELECT * FROM users;
SELECT * FROM violations;

# API testing
curl -X GET http://localhost:5000/api/status
curl -X POST http://localhost:5000/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"password"}'
```

---

## 📚 REFERENCES

- Flask Documentation: https://flask.palletsprojects.com/
- Flask-Login: https://flask-login.readthedocs.io/
- Flask-JWT-Extended: https://flask-jwt-extended.readthedocs.io/
- Chart.js: https://www.chartjs.org/
- TailwindCSS: https://tailwindcss.com/
- SQLite: https://www.sqlite.org/

---

**Generated on:** May 21, 2026
**Version:** 1.0
**Status:** Ready for Implementation
