/**
 * app.js - Dashboard Logic với Sidebar Navigation
 * Quản lý: Tab switching, Realtime alcohol, Violation recording, History
 */

const API_URL = 'http://localhost:5000/api';
let currentMeasureMode = 'auto';
let currentAlcoholLevel = 0;
let genderChart, vehicleChart;

// ============ KHỞI TẠO ============

document.addEventListener('DOMContentLoaded', async () => {
    const userRole = localStorage.getItem('user_role');
    const userFullname = localStorage.getItem('user_fullname');
    
    if (!userRole) {
        window.location.href = 'login.html';
        return;
    }
    
    // Hiển thị thông tin người dùng
    document.getElementById('user-fullname').textContent = userFullname || '-';
    
    // Nếu là admin, hiển thị tab Stats
    if (userRole === 'admin') {
        document.getElementById('btn-stats-tab').classList.remove('hidden');
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
        window.location.href = 'login.html';
    });
    
    // Tab navigation
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const tabName = btn.dataset.tab;
            switchTab(tabName);
        });
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
    
    // History controls
    document.getElementById('btn-refresh-history').addEventListener('click', loadViolationHistory);
    document.getElementById('btn-export-history').addEventListener('click', exportHistoryAsCSV);
}

// ============ TAB SWITCHING ============

function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.add('hidden');
    });
    
    // Remove active class from all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active', 'bg-blue-600', 'text-white');
        item.classList.add('text-gray-300', 'hover:bg-gray-700');
    });
    
    // Show selected tab
    document.getElementById(`tab-${tabName}`).classList.remove('hidden');
    
    // Highlight active nav item
    const activeNav = document.querySelector(`[data-tab="${tabName}"]`);
    activeNav.classList.remove('text-gray-300', 'hover:bg-gray-700');
    activeNav.classList.add('active', 'bg-blue-600', 'text-white');
    
    // Load tab-specific data
    if (tabName === 'history') {
        loadViolationHistory();
    } else if (tabName === 'stats') {
        loadStatistics();
    }
}

// ============ REALTIME UPDATE ============

function startRealtimeUpdate() {
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
        // Cập nhật thời gian cập nhật (ĐÃ SỬA LỖI MÚI GIỜ)
        const now = new Date();
        document.getElementById('last-update').textContent = now.toLocaleTimeString('vi-VN', {
            timeZone: 'Asia/Ho_Chi_Minh'
        });
        
        // Cập nhật chế độ đo
        document.getElementById('current-mode').textContent = currentMeasureMode === 'auto' ? 'Auto' : 'Manual';
        
        // Cập nhật trạng thái kết nối
        updateConnectionStatus(data.connected);
        
        // Cập nhật hiệu ứng display box
        updateDisplayBox(currentAlcoholLevel);
        
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

function updateDisplayBox(alcoholLevel) {
    const displayBox = document.getElementById('display-box');
    const statusLabel = document.getElementById('status-label');
    
    let level, color, message;
    
    // Kiểm tra loại xe (mặc định car)
    const vehicleType = document.querySelector('select[name="vehicle_type"]').value || 'car';
    
    if (vehicleType === 'car') {
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
    
    const colorMap = {
        'green': 'from-green-500 to-green-600',
        'yellow': 'from-yellow-500 to-yellow-600',
        'orange': 'from-orange-500 to-orange-600',
        'red': 'from-red-500 to-red-600',
        'darkred': 'from-red-800 to-red-900'
    };
    
    displayBox.className = `bg-gradient-to-br ${colorMap[color]} rounded-lg p-8 mb-6`;
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
            const alcoholInput = document.querySelector('input[name="alcohol_level"]');
            if (alcoholInput) {
                alcoholInput.value = peakValue.toFixed(2);
                alcoholInput.dispatchEvent(new Event('input'));
            }
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
    
    if (!data.name || !data.cccd || !data.age || !data.gender || !data.license_plate || !data.vehicle_type || !data.alcohol_level) {
        showNotification('❌ Vui lòng điền đầy đủ thông tin (*)', 'error');
        return;
    }
    
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

// ============ LỊCH SỬ VI PHẠM ============

async function loadViolationHistory() {
    try {
        const response = await fetch(`${API_URL}/violations?limit=100`);
        const result = await response.json();
        
        if (result.status === 'success' && result.violations) {
            displayViolationHistory(result.violations);
        }
    } catch (error) {
        console.error('Error loading violation history:', error);
        showNotification('❌ Lỗi tải lịch sử vi phạm', 'error');
    }
}

function displayViolationHistory(violations) {
    const tbody = document.getElementById('history-table-body');
    const emptyMsg = document.getElementById('history-empty');
    
    if (violations.length === 0) {
        tbody.innerHTML = '';
        emptyMsg.classList.remove('hidden');
        return;
    }
    
    emptyMsg.classList.add('hidden');
    
    tbody.innerHTML = violations.map((v, index) => {
        // Ép cộng thêm 7 tiếng trước khi hiển thị nếu backend trả về giờ UTC thô không có ký tự múi giờ 'Z'
const rawDate = new Date(v.created_at);
const localDate = new Date(rawDate.getTime() + (7 * 60 * 60 * 1000)); 
const createdAt = localDate.toLocaleString('vi-VN');
        const vehicleType = v.vehicle_type === 'car' ? 'Ô tô' : 'Xe máy';
        
        return `
            <tr class="border-b border-gray-700 hover:bg-gray-700 transition">
                <td class="px-4 py-3">${index + 1}</td>
                <td class="px-4 py-3">${v.name}</td>
                <td class="px-4 py-3">${v.cccd}</td>
                <td class="px-4 py-3 font-semibold text-blue-400">${v.license_plate}</td>
                <td class="px-4 py-3">${vehicleType}</td>
                <td class="px-4 py-3 font-semibold">${v.alcohol_level.toFixed(2)}</td>
                <td class="px-4 py-3 text-yellow-500 font-semibold">${v.fine_amount}</td>
                <td class="px-4 py-3 text-red-400">${v.points_deducted}</td>
                <td class="px-4 py-3 text-gray-400">${createdAt}</td>
            </tr>
        `;
    }).join('');
}

function exportHistoryAsCSV() {
    try {
        const table = document.getElementById('history-table-body');
        const rows = table.querySelectorAll('tr');
        
        if (rows.length === 0) {
            showNotification('❌ Không có dữ liệu để xuất', 'error');
            return;
        }
        
        let csv = 'STT,Họ Tên,CCCD,Biển Số,Loại Xe,Nồng Độ,Tiền Phạt,Điểm Trừ,Ngày Ghi Nhận\n';
        
        rows.forEach((row, index) => {
            const cells = row.querySelectorAll('td');
            const rowData = Array.from(cells).map(cell => {
                let text = cell.textContent.trim();
                if (text.includes(',')) text = `"${text}"`;
                return text;
            }).join(',');
            csv += rowData + '\n';
        });
        
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `violation_history_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        
        showNotification('✅ Xuất CSV thành công', 'success');
    } catch (error) {
        console.error('Error exporting CSV:', error);
        showNotification('❌ Lỗi xuất CSV', 'error');
    }
}

// ============ THỐNG KÊ (ADMIN ONLY) ============

async function loadStatistics() {
    try {
        const response = await fetch(`${API_URL}/stats`);
        const data = await response.json();
        
        if (data.status === 'success') {
            updateStatCards(data);
            updateGenderChart(data.by_gender);
            updateVehicleChart(data.by_vehicle);
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

function updateStatCards(data) {
    const totalFine = new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0
    }).format(data.total_fine);
    document.getElementById('stats-total-fine').textContent = totalFine;
    document.getElementById('stats-total-cases').textContent = data.total_cases;
    document.getElementById('stats-total-points').textContent = data.total_points;
}

function updateGenderChart(genderData) {
    const ctx = document.getElementById('gender-chart').getContext('2d');
    
    const labels = [];
    const values = [];
    const colors = ['#ef4444', '#f97316', '#6b7280'];
    
    if (genderData['Nam']) {
        labels.push('Nam');
        values.push(genderData['Nam']);
    }
    if (genderData['Nữ']) {
        labels.push('Nữ');
        values.push(genderData['Nữ']);
    }
    if (genderData['Khác']) {
        labels.push('Khác');
        values.push(genderData['Khác']);
    }
    
    if (values.length === 0) {
        labels.push('Chưa có dữ liệu');
        values.push(1);
        colors[0] = '#d1d5db';
    }
    
    if (genderChart) {
        genderChart.destroy();
    }
    
    genderChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors.slice(0, values.length),
                borderColor: '#111827',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#d1d5db',
                        font: { size: 14 },
                        padding: 15
                    }
                }
            }
        }
    });
}

function updateVehicleChart(vehicleData) {
    const ctx = document.getElementById('vehicle-chart').getContext('2d');
    
    const carCount = vehicleData.car || 0;
    const motorCount = vehicleData.motor || 0;
    
    if (vehicleChart) {
        vehicleChart.destroy();
    }
    
    vehicleChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Ô tô', 'Xe máy'],
            datasets: [{
                label: 'Số ca vi phạm',
                data: [carCount, motorCount],
                backgroundColor: ['#3b82f6', '#f97316'],
                borderColor: ['#1e40af', '#c2410c'],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'x',
            plugins: {
                legend: {
                    labels: {
                        color: '#d1d5db',
                        font: { size: 14 }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#9ca3af',
                        stepSize: 1
                    },
                    grid: {
                        color: 'rgba(75, 85, 99, 0.2)'
                    }
                },
                x: {
                    ticks: {
                        color: '#9ca3af',
                        font: { size: 12 }
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// ============ HIỆU ỨNG THÔNG BÁO ============

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    
    let bgColor = 'bg-blue-900 border-blue-700';
    if (type === 'success') bgColor = 'bg-green-900 border-green-700';
    if (type === 'error') bgColor = 'bg-red-900 border-red-700';
    
    notification.className = `p-4 rounded-lg ${bgColor} border text-white mb-4 animate-fadeIn`;
    notification.textContent = message;
    
    const form = document.getElementById('violation-form');
    form.parentElement.insertBefore(notification, form);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}
