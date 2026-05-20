#!/bin/bash
# ============ STARTUP SCRIPT FOR LINUX/macOS ============
# Chạy Backend và mở Frontend

echo ""
echo "========================================"
echo " ALCOHOL DETECTOR IoT - STARTUP SCRIPT"
echo "========================================"
echo ""

# Kiểm tra Python
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python3 chưa được cài đặt"
    echo "Hãy cài Python: brew install python3 (macOS) hoặc apt install python3 (Linux)"
    exit 1
fi

echo "[1/3] Kiểm tra dependencies..."
cd backend
pip install -r requirements.txt > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "[ERROR] Lỗi cài đặt dependencies"
    exit 1
fi
cd ..

echo "[2/3] Khởi động Backend server..."
echo "Chạy: python3 backend/app.py"
echo ""
echo "Backend sẽ chạy tại: http://localhost:5000"
echo "Bấm Ctrl+C để dừng"
echo ""
python3 backend/app.py &
BACKEND_PID=$!

echo "[3/3] Chờ server khởi động..."
sleep 3

echo ""
echo "Mở giao diện Frontend..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open frontend/index.html
else
    # Linux
    xdg-open frontend/index.html
fi

echo ""
echo "========================================"
echo "✓ HỆ THỐNG ĐÃ KHỞI ĐỘNG THÀNH CÔNG"
echo "========================================"
echo ""
echo "🌐 Dashboard: http://localhost:5000 hoặc frontend/index.html"
echo "📊 Backend API: http://localhost:5000/api"
echo ""
echo "Backend PID: $BACKEND_PID"
echo "Bấn Ctrl+C để dừng server"
echo ""

# Chờ Backend process
wait $BACKEND_PID
