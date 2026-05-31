/**
 * charts.js - Logic cho trang Thống Kê (Stats)
 * Vẽ biểu đồ Chart.js dựa trên dữ liệu từ API
 */

// ============ KHỞI TẠO ============

// Page initialization is handled by `initChartsPage()` at the bottom.
// This avoids running duplicate DOMContentLoaded handlers on the same page.

// ============ EVENT LISTENERS ============

function setupStatsEventListeners() {
    // Logout button (guarded)
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            localStorage.removeItem('user_role');
            localStorage.removeItem('user_fullname');
            localStorage.removeItem('user_username');
            window.location.href = '/login';
        });
    }

    // Refresh button (guarded)
    const btnRefresh = document.getElementById('btn-refresh');
    if (btnRefresh) btnRefresh.addEventListener('click', loadStats);
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
    // Try both ID variants used across templates
    const elTotalFine = document.getElementById('total-fine') || document.getElementById('stats-total-fine');
    if (elTotalFine) elTotalFine.textContent = totalFine;
    else console.warn('[CHARTS] updateStatCards: #total-fine / #stats-total-fine not found');

    // Tổng ca vi phạm
    const elTotalCases = document.getElementById('total-cases') || document.getElementById('stats-total-cases');
    if (elTotalCases) elTotalCases.textContent = (data.total_cases != null) ? data.total_cases : 0;
    else console.warn('[CHARTS] updateStatCards: #total-cases / #stats-total-cases not found');

    // Tổng điểm trừ GPLX
    const elTotalPoints = document.getElementById('total-points') || document.getElementById('stats-total-points');
    if (elTotalPoints) elTotalPoints.textContent = (data.total_points != null) ? data.total_points : 0;
    else console.warn('[CHARTS] updateStatCards: #total-points / #stats-total-points not found');
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
    
// Note: stats loading is handled by `loadStats()` to keep a single source of truth.

/**
 * Vẽ biểu đồ đơn giản (không dùng thư viện ngoài)
 */
function renderSimpleChart(data, container) {
    container.innerHTML = '';
    if (!data || Object.keys(data).length === 0) {
        container.innerHTML = '<p class="text-gray-400">Chưa có dữ liệu</p>';
        return;
    }

    const counts = Object.values(data).map(d => d.count || 0);
    let maxCount = counts.length ? Math.max(...counts) : 0;
    if (!isFinite(maxCount) || maxCount <= 0) maxCount = 1;

    Object.entries(data).forEach(([level, stats]) => {
        const rawCount = stats.count || 0;
        let percentage = (rawCount / maxCount) * 100;
        if (!isFinite(percentage) || percentage < 0) percentage = 0;
        if (percentage > 100) percentage = 100;
        
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
 * Fetch recent violations from API
 */
async function fetchViolations(limit = 50) {
    try {
        const res = await fetch(`${API_URL}/violations?limit=${limit}`);
        const json = await res.json();
        if (!json) return [];
        // Support multiple possible response shapes
        if (Array.isArray(json)) return json;
        if (json.status === 'success') return json.violations || json.data || [];
        return json.violations || json.data || [];
    } catch (err) {
        console.error('[CHARTS] fetchViolations error:', err);
        return [];
    }
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
                <td class="text-center px-4 py-2">${violation.alcohol_level.toFixed(2)}</td>
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
    // Setup UI event handlers specific to the stats page
    setupStatsEventListeners();

    // Load the standard stats and tables
    loadStats();
    renderViolationTable();

    // Cập nhật mỗi 10 giây
    setInterval(() => {
        loadStats();
        renderViolationTable();
    }, 10000);
    
    console.log('[CHARTS] ✓ Khởi tạo thành công');
}

// Khởi tạo khi DOM ready
document.addEventListener('DOMContentLoaded', initChartsPage);
