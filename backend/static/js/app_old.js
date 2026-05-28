/**
 * app.js - Logic chính cho Dashboard CSGT
 * Quản lý realtime alcohol update, form submission, và mode switching
 */

const API_URL = 'http://localhost:5000/api';
let currentMeasureMode = 'auto';
let currentAlcoholLevel = 0;

// ============ KHỞI TẠO ============

document.addEventListener('DOMContentLoaded', async () => {
    // Kiểm tra xem người dùng có đăng nhập hay không
    const userRole = localStorage.getItem('user_role');
    const userFullname = localStorage.getItem('user_fullname');
    
    if (!userRole) {
        window.location.href = '/login';
        return;
    }
    
    // Hiển thị thông tin người dùng
    document.getElementById('user-fullname').textContent = userFullname || '-';
    
    // Nếu là admin, hiển thị nút stats
    if (userRole === 'admin') {
        document.getElementById('btn-stats').classList.remove('hidden');
    }
    
    // Setup event listeners
    setupEventListeners();
    
    // Bắt đầu đọc dữ liệu realtime
    startRealtimeUpdate();
});

// ============ EVENT LISTENERS ============

function setupEventListeners() {
    // Logout button
    document.getElementById('btn-logout').addEventListener('click', () => {
        localStorage.removeItem('user_role');
        localStorage.removeItem('user_fullname');
        localStorage.removeItem('user_username');
        window.location.href = '/login';
    });
    
    // Mode toggle buttons
    document.getElementById('btn-auto-mode').addEventListener('click', () => toggleMode('auto'));
    document.getElementById('btn-manual-mode').addEventListener('click', () => toggleMode('manual'));
    
    // Manual measurement trigger
    document.getElementById('btn-trigger-manual').addEventListener('click', triggerManualMeasurement);
    
    // Violation form submit
    document.getElementById('violation-form').addEventListener('submit', submitViolation);
    
    // Update penalty calculation on alcohol level change
    const alcoholInput = document.querySelector('input[name="alcohol_level"]');
    if (alcoholInput) {
        alcoholInput.addEventListener('input', calculatePenalty);
    }
}

// ============ REALTIME UPDATE ============

function startRealtimeUpdate() {
    // Cập nhật dữ liệu mỗi 500ms
    setInterval(updateAlcoholDisplay, 500);
}

async function updateAlcoholDisplay() {
    try {
        const response = await fetch(`${API_URL}/alcohol`);
        const data = await response.json();
        
        currentAlcoholLevel = data.alcohol_level;
        currentMeasureMode = data.measure_mode;
        
        // Cập nhật hiển thị nồng độ cồn
        document.getElementById('alcohol-value').textContent = currentAlcoholLevel.toFixed(2);
        
        // Cập nhật thời gian cập nhật
        const now = new Date();
        document.getElementById('last-update').textContent = now.toLocaleTimeString('vi-VN');
        
        // Cập nhật chế độ đo
        document.getElementById('current-mode').textContent = currentMeasureMode === 'auto' ? 'Auto' : 'Manual';
        
        // Cập nhật trạng thái kết nối
        updateConnectionStatus(data.connected);
        
        // Cập nhật hiệu ứng display box
        updateDisplayBox(currentAlcoholLevel, data.vehicle_type);
        
    } catch (error) {
        console.error('Error updating alcohol display:', error);
        updateConnectionStatus(false);
    }
}

function updateConnectionStatus(connected) {
    const statusDiv = document.getElementById('connection-status');
    const statusText = document.getElementById('status-text');
    
    if (connected) {
        statusDiv.className = 'p-4 rounded-lg text-center font-semibold text-white bg-green-900 border border-green-700';
        statusText.textContent = '✓ Kết nối thành công (COM2 @ 9600 baud)';
    } else {
        statusDiv.className = 'p-4 rounded-lg text-center font-semibold text-white bg-red-900 border border-red-700';
        statusText.textContent = '✗ Mất kết nối. Kiểm tra cổng COM2...';
    }
}

function updateDisplayBox(alcoholLevel, vehicleType = 'car') {
    const displayBox = document.getElementById('display-box');
    const statusLabel = document.getElementById('status-label');
    
    // Xác định mức phạt dựa trên nồng độ
    let level, color, message;
    
    if (vehicleType === 'car') {
        // Ô tô
        if (alcoholLevel <= 0.04) {
            level = 'An toàn'; color = 'green'; message = '✓ Không vi phạm';
        } else if (alcoholLevel <= 0.08) {
            level = 'Mức 1'; color = 'yellow'; message = '⚠️ Mức phạt 1';
        } else if (alcoholLevel <= 0.15) {
            level = 'Mức 2'; color = 'orange'; message = '⚠️ Mức phạt 2';
        } else if (alcoholLevel <= 0.25) {
            level = 'Mức 3'; color = 'red'; message = '🚨 Mức phạt 3';
        } else {
            level = 'Mức 4'; color = 'darkred'; message = '🚨 Mức phạt 4';
        }
    } else {
        // Xe máy
        if (alcoholLevel <= 0.03) {
            level = 'An toàn'; color = 'green'; message = '✓ Không vi phạm';
        } else if (alcoholLevel <= 0.05) {
            level = 'Mức 1'; color = 'yellow'; message = '⚠️ Mức phạt 1';
        } else if (alcoholLevel <= 0.08) {
            level = 'Mức 2'; color = 'orange'; message = '⚠️ Mức phạt 2';
        } else if (alcoholLevel <= 0.15) {
            level = 'Mức 3'; color = 'red'; message = '🚨 Mức phạt 3';
        } else {
            level = 'Mức 4'; color = 'darkred'; message = '🚨 Mức phạt 4';
        }
    }
    
    // Cập nhật màu display box
    const colorMap = {
        'green': 'from-green-500 to-green-600',
        'yellow': 'from-yellow-500 to-yellow-600',
        'orange': 'from-orange-500 to-orange-600',
        'red': 'from-red-500 to-red-600',
        'darkred': 'from-red-800 to-red-900'
    };
    
    displayBox.className = `bg-gradient-to-br ${colorMap[color]} rounded-lg p-12 mb-6`;
    statusLabel.textContent = message;
}

// ============ CHUYỂN CHẾ ĐỘ ĐO ============

async function toggleMode(mode) {
    try {
        const response = await fetch(`${API_URL}/toggle-mode`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mode })
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            currentMeasureMode = mode;
            
            // Cập nhật UI
            const autoBtn = document.getElementById('btn-auto-mode');
            const manualBtn = document.getElementById('btn-manual-mode');
            const triggerBtn = document.getElementById('btn-trigger-manual');
            
            if (mode === 'auto') {
                autoBtn.classList.remove('bg-gray-600', 'hover:bg-gray-700');
                autoBtn.classList.add('bg-blue-600', 'hover:bg-blue-700');
                manualBtn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
                manualBtn.classList.add('bg-gray-600', 'hover:bg-gray-700');
                triggerBtn.classList.add('hidden');
            } else {
                autoBtn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
                autoBtn.classList.add('bg-gray-600', 'hover:bg-gray-700');
                manualBtn.classList.remove('bg-gray-600', 'hover:bg-gray-700');
                manualBtn.classList.add('bg-blue-600', 'hover:bg-blue-700');
                triggerBtn.classList.remove('hidden');
            }
        }
    } catch (error) {
        console.error('Error toggling mode:', error);
    }
}

// ============ ĐO THỦ CÔNG ============

async function triggerManualMeasurement() {
    const btn = document.getElementById('btn-trigger-manual');
    const originalText = btn.textContent;
    
    // Disable button and show loading
    btn.disabled = true;
    btn.textContent = '⏳ Đang ghi nhận...';
    
    try {
        const response = await fetch(`${API_URL}/trigger-manual`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            const peakValue = data.peak_value;
            
            // Điền giá trị vào form
            const alcoholInput = document.querySelector('input[name="alcohol_level"]');
            if (alcoholInput) {
                alcoholInput.value = peakValue.toFixed(2);
                
                // Trigger change event để tính mức phạt
                alcoholInput.dispatchEvent(new Event('input'));
            }
            
            // Hiển thị notification
            showNotification(`✅ Đo thủ công: ${peakValue.toFixed(2)} mg/L`, 'success');
        }
    } catch (error) {
        console.error('Error triggering manual measurement:', error);
        showNotification('❌ Lỗi kích hoạt đo thủ công', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
}

// ============ TÍNH TOÁN MỨC PHạT ============

function calculatePenalty() {
    const alcoholLevel = parseFloat(document.querySelector('input[name="alcohol_level"]').value) || 0;
    const vehicleType = document.querySelector('select[name="vehicle_type"]').value;
    const penaltyInfo = document.getElementById('penalty-info');
    
    if (!vehicleType) {
        penaltyInfo.classList.add('hidden');
        return;
    }
    
    let penalty;
    
    if (vehicleType === 'car') {
        // Ô tô
        if (alcoholLevel <= 0.04) {
            penalty = { level: 'An toàn', fine: '0đ', points: 0 };
        } else if (alcoholLevel <= 0.08) {
            penalty = { level: 'Mức 1', fine: '2.000.000đ', points: 2 };
        } else if (alcoholLevel <= 0.15) {
            penalty = { level: 'Mức 2', fine: '4.000.000đ', points: 4 };
        } else if (alcoholLevel <= 0.25) {
            penalty = { level: 'Mức 3', fine: '8.000.000đ', points: 6 };
        } else {
            penalty = { level: 'Mức 4', fine: '16.000.000đ', points: 10 };
        }
    } else {
        // Xe máy
        if (alcoholLevel <= 0.03) {
            penalty = { level: 'An toàn', fine: '0đ', points: 0 };
        } else if (alcoholLevel <= 0.05) {
            penalty = { level: 'Mức 1', fine: '500.000đ', points: 2 };
        } else if (alcoholLevel <= 0.08) {
            penalty = { level: 'Mức 2', fine: '1.000.000đ', points: 4 };
        } else if (alcoholLevel <= 0.15) {
            penalty = { level: 'Mức 3', fine: '2.500.000đ', points: 6 };
        } else {
            penalty = { level: 'Mức 4', fine: '5.000.000đ', points: 10 };
        }
    }
    
    // Cập nhật UI
    document.getElementById('penalty-level').textContent = penalty.level;
    document.getElementById('penalty-fine').textContent = penalty.fine;
    document.getElementById('penalty-points').textContent = penalty.points + ' điểm';
    
    if (penalty.level !== 'An toàn') {
        penaltyInfo.classList.remove('hidden');
    } else {
        penaltyInfo.classList.add('hidden');
    }
}

// ============ GỬI BIÊN BẢN ============

async function submitViolation(e) {
    e.preventDefault();
    
    // Lấy dữ liệu form
    const formData = new FormData(document.getElementById('violation-form'));
    const data = {
        name: formData.get('name'),
        cccd: formData.get('cccd'),
        age: formData.get('age'),
        gender: formData.get('gender'),
        license_plate: formData.get('license_plate'),
        vehicle_type: formData.get('vehicle_type'),
        alcohol_level: formData.get('alcohol_level'),
        gplx_status: formData.get('gplx_status')
    };
    
    // Validate
    if (!data.name || !data.cccd || !data.age || !data.gender || !data.license_plate || !data.vehicle_type || !data.alcohol_level) {
        showNotification('❌ Vui lòng điền đầy đủ thông tin (*)', 'error');
        return;
    }
    
    // Disable submit button
    const submitBtn = document.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Đang ghi nhận...';
    
    try {
        const response = await fetch(`${API_URL}/violation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            showNotification(
                `✅ Ghi nhận thành công! Mức phạt: ${result.penalty_level} | Tiền phạt: ${result.fine_amount}`,
                'success'
            );
            
            // Reset form
            document.getElementById('violation-form').reset();
            document.getElementById('penalty-info').classList.add('hidden');
        } else {
            showNotification(`❌ ${result.message || 'Lỗi ghi nhận'}`, 'error');
        }
    } catch (error) {
        console.error('Error submitting violation:', error);
        showNotification('❌ Lỗi kết nối server', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// ============ HIỆU ỨNG THÔNG BÁO ============

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    
    let bgColor = 'bg-blue-900 border-blue-700';
    if (type === 'success') bgColor = 'bg-green-900 border-green-700';
    if (type === 'error') bgColor = 'bg-red-900 border-red-700';
    
    notification.className = `p-4 rounded-lg ${bgColor} border text-white mb-4 animate-fadeIn`;
    notification.textContent = message;
    
    // Chèn vào form
    const form = document.getElementById('violation-form');
    form.parentElement.insertBefore(notification, form);
    
    // Tự động xóa sau 5 giây
    setTimeout(() => {
        notification.remove();
    }, 5000);
}


