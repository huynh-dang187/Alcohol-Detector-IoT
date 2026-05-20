/**
 * js/charts.js - Logic vẽ biểu đồ thống kê vi phạm
 */

const API_BASE_URL = 'http://localhost:5000';

/**
 * Lấy dữ liệu thống kê từ Backend
 */
async function fetchStatistics() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/vi-pham/thong-ke`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        return data;
        
    } catch (error) {
        console.error('[CHARTS] Lỗi fetch thống kê:', error);
        return null;
    }
}

/**
 * Lấy danh sách vi phạm
 */
async function fetchViolations(limit = 100) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/vi-pham/lich-su?limit=${limit}`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        return data.data || [];
        
    } catch (error) {
        console.error('[CHARTS] Lỗi fetch lịch sử vi phạm:', error);
        return [];
    }
}

/**
 * Render biểu đồ thống kê
 */
async function renderStatisticsChart() {
    const stats = await fetchStatistics();
    if (!stats) return;
    
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
