#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Script liệt kê tất cả các cổng COM sẵn có trên hệ thống
Chạy: python list_ports.py
"""

import serial.tools.list_ports
import platform

def list_serial_ports():
    """Liệt kê tất cả các cổng COM sẵn có"""
    
    print("\n" + "=" * 70)
    print("🔍 DANH SÁCH CÁC CỔNG SERIAL SẴN CÓ TRÊN HỆ THỐNG")
    print("=" * 70)
    print(f"Hệ điều hành: {platform.system()} {platform.release()}")
    print("=" * 70 + "\n")
    
    ports = serial.tools.list_ports.comports()
    
    if not ports:
        print("❌ KHÔNG TÌM THẤY CÁC CỔNG SERIAL")
        print("\n💡 HƯỚNG DẪN KHẮC PHỤC:")
        print("   1. Kiểm tra xem VSPE (Virtual Serial Port Emulator) đã khởi động chưa")
        print("   2. Kiểm tra xem Proteus đã kết nối đến COM1 của VSPE chưa")
        print("   3. Kiểm tra Device Manager để xem các port COM khả dụng")
        print("   4. Thử cấu hình lại VSPE hoặc chạy Flask server với COM port khác")
        print("\n")
        return []
    
    found_ports = []
    for i, port in enumerate(ports, 1):
        print(f"[{i}] Cổng: {port.device}")
        print(f"    Mô tả: {port.description}")
        print(f"    Nhà sản xuất: {port.manufacturer}")
        print()
        found_ports.append(port.device)
    
    print("=" * 70)
    print(f"✓ Tổng cộng: {len(found_ports)} cổng COM sẵn có\n")
    
    return found_ports

if __name__ == '__main__':
    ports = list_serial_ports()
    
    if ports:
        print("💡 CÁCH SỬ DỤNG:")
        print("   Mở terminal và chạy: python app.py")
        print(f"   Hoặc: COM_PORT=COM3 python app.py (nếu bạn muốn dùng cổng khác)")
        print()
        print("   Ví dụ trên Windows VSPE:")
        print("   - COM1: Kết nối từ Proteus (theo VSPE)")
        print("   - COM2: Kết nối Flask Server (COM_PORT mặc định)")
        print()
