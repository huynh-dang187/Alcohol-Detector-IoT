/**
 * charts.js - Logic cho trang Thống Kê (Stats)
 * Vẽ biểu đồ Chart.js dựa trên dữ liệu từ API
 */

// ============ KHỞI TẠO ============

document.addEventListener('DOMContentLoaded', async () => {
    // Kiểm tra quyền admin
    const userRole = localStorage.getItem('user_role');
    const userFullname = localStorage.getItem('user_fullname');
    
    if (!userRole || userRole !== 'admin') {
        // Nếu không phải admin, redirect về dashboard
        window.location.href = '/login';
        return;
    }
    
    // Hiển thị thông tin người dùng
    document.getElementById('user-fullname').textContent = userFullname || '-';
    
    // Setup event listeners
    setupEventListeners();
    
    // Tải dữ liệu thống kê
    await loadStats();
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
    
    // Refresh button
    document.getElementById('btn-refresh').addEventListener('click', loadStats);
}

// ============ TẢI DỮ LIỆU ============

async function loadStats() {
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

// ============ CẬP NHẬT THẺ THỐNG KÊ ============

function updateStatCards(data) {
    // Tổng tiền phạt
    const totalFine = new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0
    }).format(data.total_fine);
    document.getElementById('total-fine').textContent = totalFine;
    
    // Tổng ca vi phạm
    document.getElementById('total-cases').textContent = data.total_cases;
    
    // Tổng điểm trừ GPLX
    document.getElementById('total-points').textContent = data.total_points;
}

// ============ BIỂU ĐỒ GIỚI TÍNH ============

function updateGenderChart(genderData) {
    const ctx = document.getElementById('gender-chart').getContext('2d');
    
    // Chuẩn bị dữ liệu
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
    
    // Nếu không có dữ liệu, hiển thị placeholder
    if (values.length === 0) {
        labels.push('Chưa có dữ liệu');
        values.push(1);
        colors[0] = '#d1d5db';
    }
    
    // Xóa chart cũ nếu có
    if (genderChart) {
        genderChart.destroy();
    }
    
    // Tạo chart mới
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
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percent = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value} (${percent}%)`;
                        }
                    },
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff'
                }
            }
        }
    });
}

// ============ BIỂU ĐỒ LOẠI XE ============

function updateVehicleChart(vehicleData) {
    const ctx = document.getElementById('vehicle-chart').getContext('2d');
    
    const carCount = vehicleData.car || 0;
    const motorCount = vehicleData.motor || 0;
    
    // Xóa chart cũ nếu có
    if (vehicleChart) {
        vehicleChart.destroy();
    }
    
    // Tạo chart mới
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
                        font: { size: 14 },
                        padding: 15
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    callbacks: {
                        label: function(context) {
                            return `Số ca: ${context.parsed.y}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#9ca3af',
                        stepSize: 1,
                        callback: function(value) {
                            return Math.floor(value);
                        }
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
    
    const totalContainer = document.getElementById('total-violations');
    const totalFineContainer = document.getElementById('total-fine');
    const chartContainer = document.getElementById('chart-container');
    
    if (totalContainer) {
        totalContainer.textContent = stats.total_violations;
    }
    
    if (totalFineContainer) {
        totalFineContainer.textContent = formatCurrency(stats.total_fine || 0);
    }
    
    if (chartContainer && stats.by_level && Object.keys(stats.by_level).length > 0) {
        renderSimpleChart(stats.by_level, chartContainer);
    }
}

/**
 * Vẽ biểu đồ đơn giản (không dùng thư viện ngoài)
 */
function renderSimpleChart(data, container) {
    container.innerHTML = '';
    
    const maxCount = Math.max(...Object.values(data).map(d => d.count || 0));
    
    Object.entries(data).forEach(([level, stats]) => {
        const percentage = (stats.count / maxCount) * 100;
        
        const chartItem = document.createElement('div');
        chartItem.className = 'mb-4';
        chartItem.innerHTML = `
            <div class="flex justify-between items-center mb-1">
                <span class="font-semibold text-sm">${level}</span>
                <span class="text-sm text-gray-600">${stats.count} case</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
                <div class="bg-red-500 h-2 rounded-full transition-all duration-500" 
                     style="width: ${percentage}%"></div>
            </div>
            <div class="text-xs text-gray-500 mt-1">
                Phạt: ${formatCurrency(stats.total_fine || 0)}
            </div>
        `;
        
        container.appendChild(chartItem);
    });
}

/**
 * Render bảng lịch sử vi phạm
 */
async function renderViolationTable() {
    const violations = await fetchViolations(50);
    const tableContainer = document.getElementById('violations-table');
    
    if (!tableContainer) return;
    
    if (violations.length === 0) {
        tableContainer.innerHTML = '<p class="text-center text-gray-500 py-4">Chưa có dữ liệu vi phạm</p>';
        return;
    }
    
    let html = `
        <table class="w-full border-collapse">
            <thead>
                <tr class="border-b bg-gray-50">
                    <th class="text-left px-4 py-2 font-semibold">Họ tên</th>
                    <th class="text-left px-4 py-2 font-semibold">CCCD</th>
                    <th class="text-left px-4 py-2 font-semibold">Biển số</th>
                    <th class="text-center px-4 py-2 font-semibold">Nồng độ</th>
                    <th class="text-center px-4 py-2 font-semibold">Mức phạt</th>
                    <th class="text-right px-4 py-2 font-semibold">Tiền phạt</th>
                    <th class="text-center px-4 py-2 font-semibold">Thời gian</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    violations.forEach((violation) => {
        const levelColor = violation.muc_phat === 'An toàn' ? 'text-green-600' :
                          violation.muc_phat.includes('Mức 1') ? 'text-yellow-600' :
                          violation.muc_phat.includes('Mức 2') ? 'text-red-600' : 'text-red-900';
        
        html += `
            <tr class="border-b hover:bg-gray-50">
                <td class="px-4 py-2">${violation.ho_ten}</td>
                <td class="px-4 py-2 font-mono text-sm">${violation.cccd}</td>
                <td class="px-4 py-2 font-mono text-sm">${violation.bien_so}</td>
                <td class="text-center px-4 py-2">${violation.alcohol_level.toFixed(1)}</td>
                <td class="text-center px-4 py-2">
                    <span class="px-2 py-1 rounded-full bg-opacity-20 ${levelColor}">
                        ${violation.muc_phat}
                    </span>
                </td>
                <td class="text-right px-4 py-2">${formatCurrency(violation.tien_phat)}</td>
                <td class="text-center px-4 py-2 text-sm text-gray-600">
                    ${new Date(violation.timestamp).toLocaleString('vi-VN')}
                </td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    tableContainer.innerHTML = html;
}

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
 * Khởi tạo page thống kê
 */
function initChartsPage() {
    console.log('[CHARTS] Khởi tạo page thống kê...');
    
    renderStatisticsChart();
    renderViolationTable();
    
    // Cập nhật mỗi 10 giây
    setInterval(() => {
        renderStatisticsChart();
        renderViolationTable();
    }, 10000);
    
    console.log('[CHARTS] ✓ Khởi tạo thành công');
}

// Khởi tạo khi DOM ready
document.addEventListener('DOMContentLoaded', initChartsPage);
