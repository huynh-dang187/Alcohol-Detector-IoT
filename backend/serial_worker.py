"""
serial_worker.py - Thread độc lập đọc dữ liệu từ Proteus qua cổng COM
"""

import serial
import threading
import time
from config import COM_PORT, BAUD_RATE, SERIAL_TIMEOUT, SERIAL_RETRY_INTERVAL, ALCOHOL_DATA_SCALE

# Biến toàn cục thread-safe
alcohol_value = 0.0
is_connected = False
data_lock = threading.Lock()
serial_port = None


def get_current_value():
    """Lấy giá trị nồng độ cồn hiện tại (thread-safe)"""
    with data_lock:
        return float(alcohol_value)


def get_connection_status():
    """Lấy trạng thái kết nối (thread-safe)"""
    with data_lock:
        return is_connected


def read_serial_data():
    """
    Thread chạy ngầm để đọc dữ liệu từ cổng COM
    Cập nhật alcohol_value và is_connected một cách an toàn
    """
    global alcohol_value, serial_port, is_connected
    
    retry_count = 0
    loop_count = 0
    
    print(f"\n[SERIAL_WORKER] Thread đã khởi động")
    
    while True:
        try:
            # Mở cổng COM với retry logic
            while serial_port is None:
                try:
                    print(f"[SERIAL_WORKER] Cố gắng kết nối {COM_PORT} (lần {retry_count + 1})...")
                    serial_port = serial.Serial(
                        COM_PORT, 
                        baudrate=BAUD_RATE, 
                        timeout=SERIAL_TIMEOUT
                    )
                    is_connected = True
                    print(f"[SERIAL_WORKER] ✓ Kết nối {COM_PORT} THÀNH CÔNG @ {BAUD_RATE} baud")
                    print(f"[SERIAL_WORKER] Đang đợi dữ liệu từ Proteus...")
                    retry_count = 0
                    loop_count = 0
                
                except (serial.SerialException, PermissionError, FileNotFoundError) as e:
                    retry_count += 1
                    print(f"[SERIAL_WORKER] ✗ Lỗi kết nối {COM_PORT}: {e}")
                    print(f"[SERIAL_WORKER] Sẽ thử lại sau {SERIAL_RETRY_INTERVAL}s...")
                    is_connected = False
                    time.sleep(SERIAL_RETRY_INTERVAL)
            
            # Đọc dữ liệu từ serial port
            while serial_port is not None:
                try:
                    loop_count += 1
                    
                    # In log mỗi 50 vòng (~ 5 giây)
                    if loop_count % 50 == 0:
                        in_waiting = serial_port.in_waiting if serial_port else 0
                        print(f"[SERIAL_WORKER] Loop #{loop_count} - Bytes chờ: {in_waiting}, Giá trị: {alcohol_value:.1f}")
                    
                    # Kiểm tra nếu có dữ liệu trong buffer
                    if serial_port.in_waiting > 0:
                        raw_data = serial_port.readline().decode('utf-8').strip()
                        print(f"[SERIAL_WORKER] Nhận dữ liệu thô: {raw_data}")
                        
                        if raw_data:
                            try:
                                # Ép kiểu an toàn
                                raw_value = float(raw_data)
                                # Convert từ thang 0-900 → 0-1 mg/L
                                converted_value = raw_value / ALCOHOL_DATA_SCALE
                                with data_lock:
                                    alcohol_value = converted_value
                                print(f"[SERIAL_WORKER] ✓ Cập nhật: {raw_value:.1f} → {alcohol_value:.2f} mg/L")
                            
                            except ValueError as e:
                                print(f"[SERIAL_WORKER] ⚠ Lỗi ép kiểu '{raw_data}': {e}")
                    
                    time.sleep(0.1)
                
                except (serial.SerialException, OSError) as e:
                    print(f"[SERIAL_WORKER] ✗ Lỗi đọc serial: {e}")
                    if serial_port is not None:
                        try:
                            serial_port.close()
                        except:
                            pass
                        serial_port = None
                    is_connected = False
                    loop_count = 0
                    time.sleep(1)
                    print(f"[SERIAL_WORKER] Đang thử kết nối lại...")
                    break
        
        except Exception as e:
            print(f"[SERIAL_WORKER] ✗ Lỗi không mong muốn: {e}")
            if serial_port is not None:
                try:
                    serial_port.close()
                except:
                    pass
                serial_port = None
            is_connected = False
            loop_count = 0
            time.sleep(SERIAL_RETRY_INTERVAL)


def start_serial_worker():
    """Khởi động thread đọc serial"""
    serial_thread = threading.Thread(target=read_serial_data, daemon=True)
    serial_thread.start()
    return serial_thread
