#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
list_ports.py - Liệt kê tất cả các cổng COM sẵn có
Chạy: python list_ports.py
"""

import serial.tools.list_ports
import platform

def list_serial_ports():
    """Liệt kê tất cả các cổng COM"""
    
    print("\n" + "=" * 80)
    print("🔍 DANH SÁCH CÁC CỔNG SERIAL SẴN CÓ TRÊN HỆ THỐNG")
    print("=" * 80)
    print(f"Hệ điều hành: {platform.system()} {platform.release()}")
    print("=" * 80 + "\n")
    
    ports = serial.tools.list_ports.comports()
    
    if not ports:
        print("❌ KHÔNG TÌM THẤY CÁC CỔNG SERIAL")
        print("\n💡 HƯỚNG DẪN KHẮC PHỤC:")
        print("   1. Kiểm tra xem VSPE đã khởi động chưa")
        print("   2. Kiểm tra xem Proteus đã kết nối đến COM1 của VSPE chưa")
        print("   3. Thử cấu hình lại VSPE: Add Pair COM1 ↔ COM2")
        print("   4. Nếu vẫn không thấy, device driver có thể chưa được cài\n")
        return []
    
    found_ports = []
    for i, port in enumerate(ports, 1):
        print(f"[{i}] Cổng: {port.device}")
        print(f"    Mô tả: {port.description}")
        if port.manufacturer:
            print(f"    Nhà sản xuất: {port.manufacturer}")
        print()
        found_ports.append(port.device)
    
    print("=" * 80)
    print(f"✓ Tổng cộng: {len(found_ports)} cổng COM sẵn có\n")
    
    return found_ports

if __name__ == '__main__':
    ports = list_serial_ports()
    
    if ports:
        print("💡 CÁCH SỬ DỤNG:")
        print("   1. Chạy Backend:")
        print("      python app.py")
        print()
        print("   2. Nếu muốn dùng cổng khác (ví dụ COM3):")
        print("      COM_PORT=COM3 python app.py  (Linux/macOS)")
        print("      set COM_PORT=COM3 && python app.py  (Windows CMD)")
        print()
        print("   3. Mở Frontend:")
        print("      start frontend/index.html  (Windows)")
        print("      open frontend/index.html   (macOS)")
        print("      xdg-open frontend/index.html  (Linux)")
        print()
