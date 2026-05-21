"""
serial_worker.py - Thread ngầm đọc dữ liệu từ cổng Serial COM
Sử dụng threading.Lock() để đảm bảo an toàn dữ liệu
"""

import threading
import serial
import time
import os

# Biến toàn cục lưu trữ giá trị cồn
alcohol_value = 0.0
is_connected = False
measure_mode = 'auto'  # 'auto' hoặc 'manual'
locked_manual_value = None
data_lock = threading.Lock()

# Cấu hình COM Port
COM_PORT = os.getenv('COM_PORT', 'COM2')
BAUD_RATE = 9600

# Biến để tìm Peak Value khi ở chế độ Manual
peak_value = 0.0
collecting_peak = False


def get_current_value():
    """Lấy giá trị cồn hiện tại (an toàn với Lock)"""
    with data_lock:
        if measure_mode == 'manual' and locked_manual_value is not None:
            return locked_manual_value
        return alcohol_value


def get_connection_status():
    """Lấy trạng thái kết nối"""
    with data_lock:
        return is_connected


def get_measure_mode():
    """Lấy chế độ đo hiện tại"""
    with data_lock:
        return measure_mode


def set_measure_mode(mode):
    """Đặt chế độ đo (auto/manual)"""
    global measure_mode
    with data_lock:
        measure_mode = mode
        print(f"[SERIAL] Chế độ đo được đặt thành: {mode}")


def trigger_manual_measurement():
    """
    Kích hoạt đo thủ công - lấy Peak Value cao nhất trong 2 giây
    Return: giá trị peak được đo được
    """
    global peak_value, locked_manual_value, collecting_peak
    
    with data_lock:
        peak_value = 0.0
        collecting_peak = True
        locked_manual_value = None
    
    print("[SERIAL] Đang ghi nhận Peak Value trong 2 giây...")
    time.sleep(2)
    
    with data_lock:
        collecting_peak = False
        locked_manual_value = peak_value
        print(f"[SERIAL] ✓ Peak Value được khóa: {locked_manual_value:.2f}")
    
    return locked_manual_value


def serial_read_thread():
    """
    Thread ngầm đọc dữ liệu từ cổng Serial
    Sử dụng Lock để cập nhật biến toàn cục an toàn
    """
    global alcohol_value, is_connected, peak_value
    
    serial_port = None
    retry_count = 0
    max_retries = 5
    
    while True:
        try:
            if serial_port is None or not serial_port.is_open:
                try:
                    serial_port = serial.Serial(
                        port=COM_PORT,
                        baudrate=BAUD_RATE,
                        timeout=1
                    )
                    with data_lock:
                        is_connected = True
                    print(f"[SERIAL] ✓ Kết nối {COM_PORT} @ {BAUD_RATE} baud thành công")
                    retry_count = 0
                
                except serial.SerialException as e:
                    with data_lock:
                        is_connected = False
                    retry_count += 1
                    if retry_count <= max_retries:
                        print(f"[SERIAL] ✗ Không kết nối được {COM_PORT}. Thử lại trong 3 giây... ({retry_count}/{max_retries})")
                        time.sleep(3)
                    else:
                        print(f"[SERIAL] ✗ Vượt quá số lần thử. Chờ 5 giây...")
                        time.sleep(5)
                        retry_count = 0
                    continue
            
            # Đọc dữ liệu từ Serial
            if serial_port.in_waiting > 0:
                try:
                    line = serial_port.readline().decode('utf-8').strip()
                    
                    if line:
                        try:
                            value = float(line)
                            
                            # Cập nhật giá trị toàn cục với Lock
                            with data_lock:
                                alcohol_value = value
                                
                                # Nếu đang thu thập Peak Value, lưu giá trị cao nhất
                                if collecting_peak and value > peak_value:
                                    peak_value = value
                            
                            print(f"[SERIAL] Alcohol: {value:.2f} mg/L | Mode: {measure_mode} | Peak: {peak_value:.2f}")
                        
                        except ValueError:
                            print(f"[SERIAL] ! Dữ liệu không hợp lệ: {line}")
                
                except UnicodeDecodeError:
                    print("[SERIAL] ! Lỗi decode dữ liệu")
            
            # Giữ thread chạy nhẹ nhàng
            time.sleep(0.05)
        
        except Exception as e:
            print(f"[SERIAL] ✗ Lỗi trong thread: {e}")
            if serial_port:
                try:
                    serial_port.close()
                except:
                    pass
            serial_port = None
            with data_lock:
                is_connected = False
            time.sleep(2)


def start_serial_worker():
    """Khởi động thread đọc Serial"""
    thread = threading.Thread(target=serial_read_thread, daemon=True)
    thread.start()
    print("[SERIAL] ✓ Thread Serial Worker đã khởi động")
    return thread
