from flask import Flask, jsonify, render_template
import serial
import threading
import time
import os

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
    
    while True:
        try:
            # Mở cổng COM với retry logic
            while serial_port is None:
                try:
                    print(f"Cố gắng kết nối {COM_PORT} (lần {retry_count + 1})...")
                    serial_port = serial.Serial(COM_PORT, baudrate=BAUD_RATE, timeout=1)
                    is_connected = True
                    print(f"✓ Kết nối {COM_PORT} thành công")
                    retry_count = 0
                
                except (serial.SerialException, PermissionError) as e:
                    retry_count += 1
                    print(f"✗ Lỗi kết nối {COM_PORT}: {e}")
                    print(f"  Sẽ thử lại sau {RETRY_INTERVAL} giây...")
                    is_connected = False
                    time.sleep(RETRY_INTERVAL)
            
            # Đọc dữ liệu từ serial
            while serial_port is not None:
                try:
                    if serial_port.in_waiting > 0:
                        data = serial_port.readline().decode('utf-8').strip()
                        
                        if data:  # Chỉ xử lý nếu có dữ liệu
                            try:
                                with data_lock:
                                    alcohol_value = float(data)
                                print(f"✓ Nồng độ cồn nhận từ mạch: {alcohol_value}")
                            except ValueError:
                                print(f"⚠ Lỗi: không thể chuyển '{data}' thành số")
                    
                    time.sleep(0.1)
                
                except (serial.SerialException, OSError) as e:
                    print(f"✗ Lỗi đọc dữ liệu: {e}")
                    if serial_port is not None:
                        try:
                            serial_port.close()
                        except:
                            pass
                        serial_port = None
                    is_connected = False
                    time.sleep(1)
                    break  # Thoát vòng while để tái kết nối
        
        except Exception as e:
            print(f"✗ Lỗi không mong muốn: {e}")
            if serial_port is not None:
                try:
                    serial_port.close()
                except:
                    pass
                serial_port = None
            is_connected = False
            time.sleep(RETRY_INTERVAL)


@app.route('/')
def index():
    """Trang chủ"""
    return render_template('index.html')


@app.route('/api/alcohol')
def get_alcohol():
    """API trả về giá trị nồng độ cồn"""
    with data_lock:
        return jsonify({
            'alcohol_level': alcohol_value,
            'unit': '%',
            'connected': is_connected
        })


if __name__ == '__main__':
    # Tạo và chạy thread đọc serial
    serial_thread = threading.Thread(target=read_serial_data, daemon=True)
    serial_thread.start()
    
    # Chạy Flask server - Đã sửa lỗi bằng cách tắt use_reloader
    print("Đang khởi động Web Server Flask tại http://localhost:5000")
    app.run(debug=True, use_reloader=False, host='0.0.0.0', port=5000)