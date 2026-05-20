## 🔧 HƯỚNG DẪN KHẮC PHỤC SỰ CỐ - Nồng Độ Cồn Vẫn = 0.0

### ⚠️ VẤN ĐỀ:
- Giao diện web báo: "Connected" ✓
- Nhưng giá trị nồng độ cồn vẫn bị **kẹt ở 0.0 mg/L**
- Proteus đang gửi dữ liệu (338, 440, ...) nhưng Flask không nhận được

---

## 🔍 BƯỚC KHẮC PHỤC (Tuần Tự)

### **BƯỚC 1: Kiểm tra các cổng COM sẵn có**
```bash
python list_ports.py
```
**Kết quả mong đợi:**
- ✓ Nếu thấy COM1, COM2, COM3, ... → Hệ thống nhận diện được cổng
- ❌ Nếu không thấy gì hoặc chỉ thấy LPT1 → VSPE chưa khởi động hoặc cấu hình sai

**Nếu KHÔNG thấy cổng COM:**
1. Mở **VSPE (Virtual Serial Port Emulator)**
2. Tạo một cặp cổng ảo:
   - **COM1 (Server)** ← Kết nối từ Proteus
   - **COM2 (Client)** ← Kết nối từ Flask
3. Nhấn "Add Pair" rồi OK
4. Chạy lại `python list_ports.py` để xác nhận

---

### **BƯỚC 2: Kiểm tra Proteus đã gửi dữ liệu đến COM1 chưa**

**Trong Proteus:**
1. Kiểm tra Virtual Terminal (nếu có):
   - Baud Rate phải là **9600**
   - Port phải là **COM1** (hoặc port bạn gán)
2. Hoặc dùng **RealTerm** (công cụ monitor cổng COM):
   - Tải từ: http://realterm.sourceforge.net/
   - Mở **COM1** với Baud Rate **9600**
   - Chạy Proteus → Xem có dữ liệu hiện lên hay không?

**Nếu RealTerm thấy dữ liệu từ Proteus:**
- ✓ Proteus gửi OK
- ✓ Sang BƯỚC 3

**Nếu RealTerm KHÔNG thấy dữ liệu:**
- ❌ Lỗi ở Proteus, kiểm tra mạch và UART module

---

### **BƯỚC 3: Kiểm tra Flask có nhận dữ liệu từ COM2 không**

**Chạy Flask:**
```bash
python app.py
```

**Quan sát Terminal, tìm dòng log như này:**
```
[THREAD] Thread read_serial_data() đã khởi động
[THREAD] Cố gắng kết nối COM2 (lần 1)...
[THREAD] ✓ Kết nối COM2 THÀNH CÔNG - Đang đợi dữ liệu...
[THREAD] Vòng lặp #50 - in_waiting: 5 bytes, alcohol_value: 0.0
[SERIAL] Đã nhận số thô từ mạch: 338
[SERIAL] ✓ Cập nhật giá trị thành công: 338.0 mg/L
```

**Giải thích từng dòng:**
| Log | Ý nghĩa |
|-----|---------|
| `Thread read_serial_data() đã khởi động` | ✓ Thread đang chạy |
| `✓ Kết nối COM2 THÀNH CÔNG` | ✓ Cổng COM mở được |
| `in_waiting: 0 bytes` | ❌ Không nhận dữ liệu (kiểm tra VSPE hoặc Proteus) |
| `in_waiting: 5 bytes` | ✓ Có dữ liệu, Flask đang đọc |
| `Đã nhận số thô từ mạch: 338` | ✓ Nhận được dữ liệu thô |
| `✓ Cập nhật giá trị thành công: 338.0` | ✓ Ép kiểu thành công, giá trị lưu vào biến global |

---

## 🛠️ CÁC NGUYÊN NHÂN PHỔ BIẾN VÀ CÁCH SỬA

### **Trường hợp 1: `Lỗi kết nối COM2: [Errno 2] The specified port was not found`**
```
[THREAD] ✗ Lỗi kết nối COM2: [Errno 2] The specified port was not found
```
**Nguyên nhân:** Cổng COM2 không tồn tại hoặc VSPE chưa khởi động

**Cách sửa:**
```bash
# 1. Liệt kê các port có sẵn
python list_ports.py

# 2. Dùng port khác (ví dụ COM3)
COM_PORT=COM3 python app.py
```

---

### **Trường hợp 2: `Vòng lặp #50 - in_waiting: 0 bytes`**
```
[THREAD] Vòng lặp #50 - in_waiting: 0 bytes, alcohol_value: 0.0
[THREAD] Vòng lặp #100 - in_waiting: 0 bytes, alcohol_value: 0.0
```
**Nguyên nhân:** Dữ liệu không gửi tới COM2

**Cách sửa:**
1. **Kiểm tra VSPE:**
   - Cặp COM1 ↔ COM2 đã được thiết lập đúng chưa?
   - Cấu hình: Bridging Mode hay Pair Mode?
   - Nên chọn **Pair Mode** (mặc định)

2. **Kiểm tra Proteus:**
   - UART module đang gửi tới **COM1** chứ không phải COM2?
   - Virtual Terminal của Proteus có hiển thị dữ liệu không?

3. **Dùng RealTerm để monitor:**
   - Nếu RealTerm mở COM1 thấy dữ liệu → Proteus OK
   - Nếu RealTerm mở COM2 không thấy → VSPE cấu hình sai

---

### **Trường hợp 3: `Lỗi ép kiểu: không thể chuyển '...' thành float`**
```
[SERIAL] ⚠ Lỗi ép kiểu: không thể chuyển 'hello' thành float
```
**Nguyên nhân:** Dữ liệu gửi từ Proteus không phải là số

**Cách sửa:**
1. Kiểm tra Proteus có gửi đúng định dạng không (phải là số như `338`)
2. Thêm ký tự newline (`\n`) sau mỗi số trong Proteus

---

## 🧪 TEST MANUAL

### **Nếu Flask chạy nhưng vẫn không nhận dữ liệu, thử test manual:**

**1. Dùng Python terminal test COM port:**
```python
import serial
port = serial.Serial('COM2', 9600, timeout=1)
port.write(b'338\n')  # Gửi test dữ liệu
data = port.readline()
print(data.decode().strip())  # In ra: 338
```

**2. Mở giao diện web:**
- http://localhost:5000
- Quan sát Terminal Flask → Có log mới không?

---

## 📋 CHECKLIST KIỂM TRA TOÀN BỘ

- [ ] VSPE đã khởi động và tạo cặp COM1 ↔ COM2
- [ ] Proteus đã kết nối UART tới COM1 của VSPE
- [ ] RealTerm (hoặc công cụ tương tự) thấy dữ liệu từ Proteus trên COM1
- [ ] Flask chạy: `python app.py`
- [ ] Terminal Flask hiển thị: `✓ Kết nối COM2 THÀNH CÔNG`
- [ ] Terminal Flask hiển thị: `in_waiting: X bytes` (X > 0)
- [ ] Terminal Flask hiển thị: `[SERIAL] Đã nhận số thô từ mạch: ...`
- [ ] Terminal Flask hiển thị: `[SERIAL] ✓ Cập nhật giá trị thành công: ...`
- [ ] Giao diện web http://localhost:5000 hiển thị số không phải 0.0
- [ ] Nếu số > 20, giao diện chuyển sang màu đỏ (danger-alert)

---

## 📞 NẾUVẪN KHÔNG ĐƯỢC

Chạy câu lệnh này để lấy log chi tiết:
```bash
python app.py > debug_log.txt 2>&1
```
Rồi gửi file `debug_log.txt` để tôi xem chi tiết hơn.

---

**Last Updated:** May 20, 2026
