@echo off
REM ============ STARTUP SCRIPT FOR WINDOWS ============
REM Chạy Backend và mở Frontend

echo.
echo ========================================
echo  ALCOHOL DETECTOR IoT - STARTUP SCRIPT
echo ========================================
echo.

REM Kiểm tra Python
python --version > nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python chưa được cài đặt hoặc không có trong PATH
    echo Hãy cài Python từ https://www.python.org
    pause
    exit /b 1
)

echo [1/3] Kiểm tra dependencies...
cd backend
pip install -r requirements.txt > nul 2>&1
if errorlevel 1 (
    echo [ERROR] Lỗi cài đặt dependencies
    pause
    exit /b 1
)
cd ..

echo [2/3] Khởi động Backend server...
echo Chạy: python backend/app.py
echo.
echo Backend sẽ chạy tại: http://localhost:5000
echo Bấm Ctrl+C để dừng
echo.
start python backend/app.py

echo [3/3] Chờ server khởi động...
timeout /t 3 /nobreak

echo.
echo Mở giao diện Frontend...
start "" "frontend/index.html"

echo.
echo ========================================
echo ✓ HỆ THỐNG ĐÃ KHỞI ĐỘNG THÀNH CÔNG
echo ========================================
echo.
echo 🌐 Dashboard: http://localhost:5000 hoặc frontend/index.html
echo 📊 Backend API: http://localhost:5000/api
echo.
echo Bấn bất kỳ phím để đóng cửa sổ này...
pause
