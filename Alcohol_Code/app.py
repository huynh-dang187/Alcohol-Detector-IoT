from flask import Flask, jsonify, render_template
import serial
import threading
import time
import os
import platform

app = Flask(__name__)

# Biến toàn cục lưu trữ giá trị nồng độ cồn
alcohol_value = 0.0
data_lock = threading.Lock()
serial_port = None
is_connected = False

# Cấu hình
COM_PORT = os.getenv('COM_PORT', 'COM2')
BAUD_RATE = 9600
RETRY_INTERVAL = 5  # Thử kết nối lại sau 5 giây


def read_serial_data():
    """Thread chạy ngầm để đọc dữ liệu từ cổng COM2"""
    global alcohol_value, serial_port, is_connected
    
    retry_count = 0
    loop_count = 0
    
    print(f"\n[THREAD] Thread read_serial_data() đã khởi động")
    
    while True:
        try:
            # Mở cổng COM với retry logic
            while serial_port is None:
                try:
                    print(f"\n[THREAD] Cố gắng kết nối {COM_PORT} (lần {retry_count + 1})...")
                    serial_port = serial.Serial(COM_PORT, baudrate=BAUD_RATE, timeout=1)
                    is_connected = True
                    print(f"[THREAD] ✓ Kết nối {COM_PORT} THÀNH CÔNG - Đang đợi dữ liệu...")
                    retry_count = 0
                    loop_count = 0
                
                except (serial.SerialException, PermissionError) as e:
                    retry_count += 1
                    print(f"[THREAD] ✗ Lỗi kết nối {COM_PORT}: {e}")
                    print(f"[THREAD]   Sẽ thử lại sau {RETRY_INTERVAL} giây...")
                    is_connected = False
                    time.sleep(RETRY_INTERVAL)
            
            # Đọc dữ liệu từ serial
            while serial_port is not None:
                try:
                    loop_count += 1
                    
                    # DEBUG: In log mỗi 50 lần vòng lặp (khoảng 5 giây)
                    if loop_count % 50 == 0:
                        print(f"[THREAD] Vòng lặp #{loop_count} - in_waiting: {serial_port.in_waiting} bytes, alcohol_value: {alcohol_value}")
                    
                    # Kiểm tra nếu có dữ liệu
                    if serial_port.in_waiting > 0:
                        raw_data = serial_port.readline().decode('utf-8').strip()
                        print(f"[SERIAL] Đã nhận số thô từ mạch: {raw_data}")
                        
                        if raw_data:  # Chỉ xử lý nếu có dữ liệu
                            try:
                                # Ép kiểu dữ liệu an toàn
                                alcohol_level = float(raw_data)
                                with data_lock:
                                    alcohol_value = alcohol_level
                                print(f"[SERIAL] ✓ Cập nhật giá trị thành công: {alcohol_value} mg/L")
                            except ValueError as e:
                                print(f"[SERIAL] ⚠ Lỗi ép kiểu: không thể chuyển '{raw_data}' thành float - {e}")
                    
                    time.sleep(0.1)
                
                except (serial.SerialException, OSError) as e:
                    print(f"[THREAD] ✗ Lỗi đọc dữ liệu từ serial: {e}")
                    if serial_port is not None:
                        try:
                            serial_port.close()
                        except:
                            pass
                        serial_port = None
                    is_connected = False
                    loop_count = 0
                    time.sleep(1)
                    print(f"[THREAD] Đang thử kết nối lại...")
                    break  # Thoát vòng while để tái kết nối
        
        except Exception as e:
            print(f"[THREAD] ✗ Lỗi không mong muốn: {e}")
            if serial_port is not None:
                try:
                    serial_port.close()
                except:
                    pass
                serial_port = None
            is_connected = False
            loop_count = 0
            time.sleep(RETRY_INTERVAL)


@app.route('/')
def index():
    """Trang chủ"""
    return render_template('index.html')


@app.route('/api/status')
def get_status():
    """API trả về trạng thái kết nối và diagnostic info"""
    with data_lock:
        current_value = alcohol_value
    
    return jsonify({
        'connected': is_connected,
        'com_port': COM_PORT,
        'baud_rate': BAUD_RATE,
        'alcohol_level': float(current_value),
        'platform': platform.system()
    })


@app.route('/api/alcohol')
def get_alcohol():
    """API trả về giá trị nồng độ cồn"""
    global alcohol_value, serial_port
    
    # Ép Flask đọc trực tiếp giá trị thực tế từ luồng ngầm
    with data_lock:
        current_val = alcohol_value
        
    status_check = True if serial_port is not None else False
    
    return jsonify({
        'alcohol_level': float(current_val), # Ép hẳn về số thực khi xuất dữ liệu
        'unit': 'mg/L',
        'connected': status_check
    })


if __name__ == '__main__':
    # Tạo và chạy thread đọc serial
    print("\n" + "=" * 70)
    print("🔧 KHỞI ĐỘNG HỆ THỐNG GIÁM SÁT NỒNG ĐỘ CỒN")
    print("=" * 70)
    
    serial_thread = threading.Thread(target=read_serial_data, daemon=True)
    serial_thread.start()
    print("[MAIN] ✓ Thread read_serial_data đã được khởi động")
    
    time.sleep(2)  # Chờ thread kết nối serial
    
    # Chạy Flask server - Cấu hình tối ưu cho Windows
    print("\n" + "=" * 70)
    print("🚀 KHỞI ĐỘNG WEB SERVER FLASK")
    print("=" * 70)
    print(f"📍 Địa chỉ: http://localhost:5000")
    print(f"📡 Cổng COM: {COM_PORT} @ {BAUD_RATE} baud")
    print(f"🔗 Trạng thái: Đang kết nối... (xem log trên)")
    print("=" * 70 + "\n")
    
    app.run(
        debug=True,           # Bật debug mode
        use_reloader=False,   # TẮT reloader để tránh xung đột tiến trình con trên Windows
        host='0.0.0.0',       # Lắng nghe trên tất cả interfaces
        port=5000,
        threaded=True         # Cho phép xử lý đa luồng
    )