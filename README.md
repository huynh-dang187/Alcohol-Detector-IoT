# 🍷 Alcohol Detector IoT - Hệ Thống Giám Sát Nồng Độ Cồn Realtime

**Một hệ thống IoT hoàn chỉnh để giám sát nồng độ cồn realtime và ghi nhận vi phạm giao thông.**

---

## 📋 Cấu Trúc Dự Án

```
Alcohol-Detector-IoT/
├── backend/                          # Backend Flask API
│   ├── app.py                        # Entry point - Flask server
│   ├── config.py                     # Cấu hình toàn bộ hệ thống
│   ├── serial_worker.py              # Thread đọc dữ liệu serial
│   ├── requirements.txt              # Dependencies Python
│   ├── .env.example                  # Template biến môi trường
│   └── database/                     # Thư mục SQLite
│       └── violations.db             # Database vi phạm
│
└── frontend/                         # Frontend HTML/JS/CSS
    ├── index.html                    # Dashboard chính
    ├── history.html                  # Trang lịch sử vi phạm
    ├── js/
    │   ├── app.js                    # Logic realtime + ghi nhận
    │   └── charts.js                 # Biểu đồ thống kê
    └── css/
        └── style.css                 # Tùy chỉnh giao diện
```

---

## 🚀 Cài Đặt & Chạy

### **Bước 1: Cài Đặt Dependencies Backend**

```bash
cd backend
pip install -r requirements.txt
```

**Requirements:**
- Flask 2.3.3 - Web framework
- Flask-CORS 4.0.0 - Cross-Origin Resource Sharing
- pyserial 3.5 - Đọc cổng COM
- python-dotenv 1.0.0 - Quản lý environment variables

### **Bước 2: Cấu Hình (Optional)**

Nếu cổng COM không phải COM2, tạo file `.env`:

```bash
cp .env.example .env
```

Sửa file `.env`:
```env
COM_PORT=COM3
```

### **Bước 3: Chạy Backend Server**

```bash
cd backend
python app.py
```

**Kết quả mong đợi:**
```
================================================== ====
🔧 KHỞI ĐỘNG HỆ THỐNG GIÁM SÁT NỒNG ĐỘ CỒN
====================================================
[SERIAL_WORKER] Thread đã khởi động
[SERIAL_WORKER] Cố gắng kết nối COM2 (lần 1)...
[SERIAL_WORKER] ✓ Kết nối COM2 THÀNH CÔNG @ 9600 baud

====================================================
🚀 KHỞI ĐỘNG WEB SERVER FLASK
====================================================
📍 API Server: http://localhost:5000
🔗 CORS cho phép: 7 origins
💾 Database: ./database/violations.db
====================================================

 * Running on http://127.0.0.1:5000
 * Running on http://10.x.x.x:5000
```

### **Bước 4: Mở Frontend**

**Option A: Trực tiếp từ file**
```bash
# Windows
start frontend/index.html

# macOS
open frontend/index.html

# Linux
xdg-open frontend/index.html
```

**Option B: Dùng Live Server (VS Code Extension)**
```
Chuột phải vào index.html → Open with Live Server
```

**Option C: Dùng Python HTTP Server**
```bash
cd frontend
python -m http.server 8000
# Truy cập: http://localhost:8000
```

---

## 📡 API Endpoints

### **1. GET /api/alcohol**
Lấy giá trị nồng độ cồn realtime

```bash
curl http://localhost:5000/api/alcohol
```

**Response:**
```json
{
  "alcohol_level": 338.5,
  "unit": "mg/L",
  "connected": true,
  "timestamp": "2026-05-20T15:30:45.123456",
  "penalty": {
    "level": "Mức 2",
    "fine": 17000000,
    "color": "#ef4444",
    "description": "Tước GPLX 16-18 tháng"
  }
}
```

### **2. POST /api/vi-pham**
Ghi nhận vi phạm (gọi từ Frontend)

```bash
curl -X POST http://localhost:5000/api/vi-pham \
  -H "Content-Type: application/json" \
  -d '{
    "ho_ten": "Nguyễn Văn A",
    "cccd": "123456789",
    "bien_so": "30A-12345",
    "alcohol_level": 338.5,
    "muc_phat": "Mức 2",
    "tien_phat": 17000000,
    "diem_tru": 6,
    "ghi_chu": "Khu vực trung tâm"
  }'
```

**Response:**
```json
{
  "status": "ok",
  "violation_id": 1,
  "message": "Vi phạm đã được ghi nhận",
  "timestamp": "2026-05-20T15:30:50.123456"
}
```

### **3. GET /api/vi-pham/lich-su?limit=100**
Lấy danh sách lịch sử vi phạm

```bash
curl http://localhost:5000/api/vi-pham/lich-su?limit=50
```

### **4. GET /api/vi-pham/thong-ke**
Lấy thống kê vi phạm

```bash
curl http://localhost:5000/api/vi-pham/thong-ke
```

### **5. GET /api/status**
Kiểm tra trạng thái hệ thống

```bash
curl http://localhost:5000/api/status
```

---

## 🎨 Các Mức Phạt

| Mức | Nồng Độ | Tiền Phạt | Tước GPLX | Điểm Trừ |
|-----|---------|----------|----------|---------|
| ✓ An toàn | ≤ 20 | 0 | - | 0 |
| ⚠ Mức 1 | 21-250 | 6-8M | 10-12 tháng | 3 |
| 🚨 Mức 2 | 251-400 | 16-18M | 16-18 tháng | 6 |
| 🚫 Mức 3 | > 400 | 30-40M | 22-24 tháng | 12 |

---

## 🔧 Các Tính Năng Chính

### **Backend**
- ✅ Đọc dữ liệu serial realtime từ Proteus
- ✅ API RESTful với CORS support
- ✅ Thread-safe data handling (Lock)
- ✅ SQLite database lưu trữ vi phạm
- ✅ Thông tin mức phạt theo luật giao thông VN
- ✅ Log chi tiết cho debugging

### **Frontend**
- ✅ Dashboard realtime với fetch API 500ms
- ✅ Hiển thị số thực tế và phân loại mức phạt
- ✅ Form ghi nhận vi phạm (Họ tên, CCCD, Biển số)
- ✅ Trang lịch sử vi phạm với bảng chi tiết
- ✅ Biểu đồ thống kê (không cần thư viện ngoài)
- ✅ Xuất báo cáo CSV
- ✅ In ấn trang web (Print)
- ✅ Responsive design (Mobile/Desktop)
- ✅ Giao diện Tailwind + Custom CSS

---

## 🐛 Troubleshooting

### **Vấn đề: Nồng độ cồn vẫn = 0.0**

**Nguyên nhân & Cách sửa:**

1. **VSPE chưa cấu hình**
   ```
   Mở VSPE → Add Pair → COM1 (từ Proteus) & COM2 (Flask)
   ```

2. **Proteus không gửi dữ liệu**
   - Kiểm tra Virtual Terminal trong Proteus
   - Xem có dữ liệu hiển thị không? (338, 440, ...)
   - Nếu không: Kiểm tra mạch và code UART

3. **Cổng COM sai**
   ```bash
   python backend/list_ports.py  # Liệt kê cổng sẵn có
   COM_PORT=COM3 python app.py   # Thay đổi port
   ```

### **Vấn đề: Backend không kết nối Frontend**

- ✅ Chắc chắn Backend chạy: http://localhost:5000
- ✅ Kiểm tra CORS: File `config.py` - `CORS_ORIGINS`
- ✅ Mở Console (F12) xem có CORS error không
- ✅ Firewall có cho phép port 5000 không?

### **Vấn đề: Database không lưu**

- ✅ Kiểm tra thư mục `backend/database/` có tạo được không
- ✅ Check quyền ghi trong Windows
- ✅ Kiểm tra file `violations.db` có tồn tại không

---

## 📊 Ví Dụ Sử Dụng

### **Scenario 1: Kiểm tra người vi phạm mức 2**

1. **Proteus gửi:** 350 mg/L
2. **Dashboard hiển thị:**
   - Số: 350.0 mg/L
   - Màu: Đỏ (Mức 2)
   - Phạt: 16-18 triệu VNĐ
   - Tước GPLX: 16-18 tháng
   - Điểm trừ: 6

3. **Ghi nhận:**
   - Nhập: Nguyễn Văn B, CCCD: 987654321, Biển: 30B-54321
   - Bấm "GHI NHẬN VI PHẠM"
   - Hệ thống lưu vào DB

4. **Xem lịch sử:**
   - Bấm "XEM LỊCH SỬ"
   - Thấy bản ghi mới trong bảng
   - Có thể xuất CSV hoặc in

---

## 🔐 Bảo Mật

- ✅ CORS riêng cho từng origin
- ✅ Input validation trên Frontend & Backend
- ✅ SQLite database (có thể upgrade MySQL)
- ✅ Thread-safe operations
- ✅ Error handling toàn bộ

---

## 📝 License

Phát triển cho Bộ Công An - Hệ thống Giám Sát Nồng Độ Cồn Realtime

---

## 👨‍💻 Hỗ Trợ

Nếu gặp lỗi:

1. Kiểm tra Terminal Backend - xem log
2. Mở Console Frontend (F12) - xem Network/Console
3. Chạy `python backend/list_ports.py` - kiểm tra cổng COM
4. Kiểm tra cấu hình VSPE

---

**Version:** 2.0  
**Last Updated:** May 20, 2026  
**Backend:** Python Flask + PySerial  
**Frontend:** HTML5 + TailwindCSS + Vanilla JS
