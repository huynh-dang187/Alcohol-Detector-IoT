/**
 * js/app.js - Logic chính của Frontend
 * Xử lý: Fetch API realtime, tính tiền phạt, hiển thị giao diện
 */

// ============ CẤU HÌNH ============
const API_BASE_URL = 'http://localhost:5000';
const FETCH_INTERVAL = 500; // ms
let currentAlcoholLevel = 0;
let isConnected = false;
let currentLoaiXe = 'oto_va_xe_tuong_tu'; // Loại xe mặc định

// ============ HÀM TIỆN ÍCH ============

/**
 * Format tiền tệ VNĐ
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0
    }).format(amount);
}

/**
 * Format ngày giờ
 */
function formatDateTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString('vi-VN');
}

/**
 * Lấy thông tin mức phạt dựa trên nồng độ cồn (thang mới)
 * Dữ liệu từ Luật giao thông đường bộ
 */
function getPenaltyInfo(alcoholLevel, loaiXe = 'oto_va_xe_tuong_tu') {
    const level = parseFloat(alcoholLevel);
    
    // Xác định mức phạt dựa trên nồng độ cồn
    let penaltyConfig = {};
    
    if (level < 0.01) {
        // An toàn - không phát hiện cồn
        return {
            level: 'An toàn',
            color: 'bg-green-500',
            textColor: 'text-green-600',
            borderColor: 'border-green-500',
            icon: '✓',
            fine: 0,
            fineText: 'Không có vi phạm',
            points: 0,
            description: 'Hệ thống an toàn'
        };
    } else if (level <= 0.25) {
        // Mức 1: ≤ 0.25 mg/L
        penaltyConfig = loaiXe === 'xe_may_xe_gan_may' 
            ? { fine: 2500000, fineMin: 2000000, fineMax: 3000000, fineText: '2-3 triệu VNĐ', points: 4, description: 'Trừ 4 điểm', level: 'Mức 1' }
            : { fine: 7000000, fineMin: 6000000, fineMax: 8000000, fineText: '6-8 triệu VNĐ', points: 4, description: 'Tước GPLX 10-12 tháng', level: 'Mức 1' };
        
        return {
            ...penaltyConfig,
            color: 'bg-yellow-500',
            textColor: 'text-yellow-600',
            borderColor: 'border-yellow-500',
            icon: '⚠'
        };
    } else if (level <= 0.4) {
        // Mức 2: 0.25 < alcohol ≤ 0.4 mg/L
        penaltyConfig = loaiXe === 'xe_may_xe_gan_may'
            ? { fine: 7000000, fineMin: 6000000, fineMax: 8000000, fineText: '6-8 triệu VNĐ', points: 10, description: 'Tước GPLX 10-12 tháng', level: 'Mức 2' }
            : { fine: 19000000, fineMin: 18000000, fineMax: 20000000, fineText: '18-20 triệu VNĐ', points: 10, description: 'Tước GPLX 22-24 tháng', level: 'Mức 2' };
        
        return {
            ...penaltyConfig,
            color: 'bg-red-500',
            textColor: 'text-red-600',
            borderColor: 'border-red-500',
            icon: '🚨'
        };
    } else {
        // Mức 3: > 0.4 mg/L (Kịch khung)
        penaltyConfig = loaiXe === 'xe_may_xe_gan_may'
            ? { fine: 9000000, fineMin: 8000000, fineMax: 10000000, fineText: '8-10 triệu VNĐ', points: 10, description: 'Tước GPLX 22-24 tháng (Kịch khung)', level: 'Mức 3' }
            : { fine: 35000000, fineMin: 30000000, fineMax: 40000000, fineText: '30-40 triệu VNĐ', points: 10, description: 'Tước GPLX 22-24 tháng (Kịch khung)', level: 'Mức 3' };
        
        return {
            ...penaltyConfig,
            color: 'bg-red-900',
            textColor: 'text-red-700',
            borderColor: 'border-red-900',
            icon: '🚫'
        };
    }
}

// ============ FETCH API ============

/**
 * Lấy dữ liệu nồng độ cồn realtime
 */
async function fetchAlcoholData() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/alcohol`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        // Ép kiểu ngay lập tức
        const alcoholLevel = parseFloat(data.alcohol_level);
        isConnected = data.connected === true;
        
        // Cập nhật giá trị
        if (!isNaN(alcoholLevel) && isFinite(alcoholLevel)) {
            currentAlcoholLevel = alcoholLevel;
            updateDisplay(alcoholLevel);
        }
        
        // Cập nhật trạng thái kết nối
        updateConnectionStatus();
        
        console.log(`[APP] Alcohol: ${alcoholLevel.toFixed(2)} mg/L, Connected: ${isConnected}`);
        
    } catch (error) {
        console.error('[APP] Lỗi fetch dữ liệu:', error);
        updateConnectionStatus();
    }
}

/**
 * Cập nhật giao diện hiển thị số và mức phạt
 */
function updateDisplay(alcoholLevel) {
    // Ép kiểu an toàn
    const level = parseFloat(alcoholLevel);
    
    // Cập nhật số hiển thị
    const displayElement = document.getElementById('alcohol-value');
    if (displayElement) {
        displayElement.textContent = level.toFixed(2);
    }
    
    // Lấy thông tin mức phạt
    const penaltyInfo = getPenaltyInfo(level, currentLoaiXe);
    
    // Cập nhật màu background chính
    const displayBox = document.getElementById('display-box');
    if (displayBox) {
        displayBox.className = `p-8 rounded-lg text-white text-center transition-all duration-500 ${penaltyInfo.color}`;
    }
    
    // Cập nhật nhãn trạng thái
    const labelElement = document.getElementById('status-label');
    if (labelElement) {
        labelElement.textContent = penaltyInfo.icon + ' ' + penaltyInfo.description;
    }
    
    // Cập nhật mức phạt
    const penaltyLevel = document.getElementById('penalty-level');
    if (penaltyLevel) {
        penaltyLevel.textContent = penaltyInfo.level;
        penaltyLevel.className = `text-2xl font-bold mb-2 ${penaltyInfo.textColor}`;
    }
    
    // Cập nhật tiền phạt
    const penaltyMoney = document.getElementById('penalty-money');
    if (penaltyMoney) {
        penaltyMoney.textContent = penaltyInfo.fineText || 'Không có';
    }
    
    // Cập nhật điểm trừ
    const penaltyPoints = document.getElementById('penalty-points');
    if (penaltyPoints) {
        penaltyPoints.textContent = penaltyInfo.points;
    }
    
    // Hiển thị/ẩn panel vi phạm
    const violationPanel = document.getElementById('violation-panel');
    if (violationPanel) {
        if (level > 0.25) {
            violationPanel.classList.remove('hidden');
        } else {
            violationPanel.classList.add('hidden');
        }
    }
}

/**
 * Cập nhật trạng thái kết nối
 */
function updateConnectionStatus() {
    const statusElement = document.getElementById('connection-status');
    if (!statusElement) return;
    
    if (isConnected) {
        statusElement.innerHTML = `
            <div class="flex items-center justify-center gap-2">
                <span class="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                <span>✓ Kết nối thành công</span>
            </div>
        `;
        statusElement.className = 'text-sm p-3 rounded-lg bg-green-50 text-green-700 border border-green-300';
    } else {
        statusElement.innerHTML = `
            <div class="flex items-center justify-center gap-2">
                <span class="w-3 h-3 bg-red-500"></span>
                <span>✗ Mất kết nối COM port</span>
            </div>
        `;
        statusElement.className = 'text-sm p-3 rounded-lg bg-red-50 text-red-700 border border-red-300';
    }
}

// ============ XỬ LÝ FORM VI PHẠM ============

/**
 * Ghi nhận vi phạm - Gửi dữ liệu lên Backend
 */
async function recordViolation() {
    // Lấy dữ liệu từ form
    const hoTen = document.getElementById('input-ho-ten').value.trim();
    const cccd = document.getElementById('input-cccd').value.trim();
    const bienSo = document.getElementById('input-bien-so').value.trim();
    const loaiXe = document.getElementById('input-loai-xe').value;
    const ghiChu = document.getElementById('input-ghi-chu').value.trim();
    
    // Validate
    if (!hoTen || !cccd || !bienSo) {
        alert('Vui lòng điền đầy đủ thông tin: Họ tên, CCCD, Biển số');
        return;
    }
    
    // Lấy thông tin mức phạt
    const penaltyInfo = getPenaltyInfo(currentAlcoholLevel, loaiXe);
    
    // Chuẩn bị dữ liệu gửi lên
    const violationData = {
        ho_ten: hoTen,
        cccd: cccd,
        bien_so: bienSo,
        alcohol_level: currentAlcoholLevel,
        muc_phat: penaltyInfo.level,
        tien_phat: penaltyInfo.fine || penaltyInfo.fineMin || 0,
        diem_tru: penaltyInfo.points,
        loai_xe: loaiXe,
        ghi_chu: ghiChu
    };
    
    try {
        // Gửi POST request
        const response = await fetch(`${API_BASE_URL}/api/vi-pham`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(violationData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const result = await response.json();
        
        console.log('[APP] Vi phạm đã ghi nhận:', result);
        
        // Hiển thị thông báo thành công
        showNotification('success', `✓ Vi phạm đã ghi nhận (ID: ${result.violation_id})`);
        
        // Xóa form
        clearViolationForm();
        
    } catch (error) {
        console.error('[APP] Lỗi ghi nhận vi phạm:', error);
        showNotification('error', '✗ Lỗi ghi nhận vi phạm. Kiểm tra kết nối backend.');
    }
}

/**
 * Xóa dữ liệu form
 */
function clearViolationForm() {
    document.getElementById('input-ho-ten').value = '';
    document.getElementById('input-cccd').value = '';
    document.getElementById('input-bien-so').value = '';
    document.getElementById('input-ghi-chu').value = '';
}

/**
 * Hiển thị thông báo
 */
function showNotification(type, message) {
    const notificationContainer = document.getElementById('notification-container');
    if (!notificationContainer) return;
    
    const notification = document.createElement('div');
    notification.className = `p-4 rounded-lg mb-3 animate-pulse ${
        type === 'success' 
            ? 'bg-green-100 text-green-800 border border-green-300' 
            : 'bg-red-100 text-red-800 border border-red-300'
    }`;
    notification.textContent = message;
    
    notificationContainer.appendChild(notification);
    
    // Xóa thông báo sau 5 giây
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// ============ KHỞI TẠO ============

/**
 * Khởi tạo ứng dụng
 */
function initApp() {
    console.log('[APP] Khởi tạo ứng dụng...');
    
    // Gắn sự kiện cho nút ghi nhận vi phạm
    const recordBtn = document.getElementById('btn-record-violation');
    if (recordBtn) {
        recordBtn.addEventListener('click', recordViolation);
    }
    
    // Gắn sự kiện cho select loại xe
    const loaiXeSelect = document.getElementById('input-loai-xe');
    if (loaiXeSelect) {
        loaiXeSelect.addEventListener('change', (e) => {
            currentLoaiXe = e.target.value;
            console.log(`[APP] Đổi loại xe: ${currentLoaiXe}`);
            // Cập nhật display ngay lập tức
            updateDisplay(currentAlcoholLevel);
        });
    }
    
    // Gắn sự kiện cho nút xem lịch sử
    const historyBtn = document.getElementById('btn-view-history');
    if (historyBtn) {
        historyBtn.addEventListener('click', () => {
            window.location.href = 'history.html';
        });
    }
    
    // Lần đầu fetch dữ liệu
    fetchAlcoholData();
    
    // Fetch dữ liệu realtime mỗi 500ms
    setInterval(fetchAlcoholData, FETCH_INTERVAL);
    
    console.log('[APP] ✓ Khởi tạo thành công');
}

// Khởi tạo khi DOM ready
document.addEventListener('DOMContentLoaded', initApp);
