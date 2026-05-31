/**
 * analytics.js - Xử lý Analytics Dashboard với 4 biểu đồ
 * Chart 1: Bar Chart - Nồng độ TB theo nhóm tuổi
 * Chart 2: Doughnut Chart - Phân bố mức vi phạm
 * Chart 3: Pie Chart - Phân bố giới tính
 * Chart 4: Line Chart - Xu hướng theo khung giờ
 */

// ============ HÀM LOAD & RENDER CHARTS ============

async function loadAnalyticsData() {
    try {
        console.log("[Analytics] Đang tải dữ liệu thống kê...");
        const response = await fetch(`${API_URL}/statistics`);
        
        if (!response.ok) {
            throw new Error(`API trả về lỗi: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.status === 'success') {
            console.log("[Analytics] Dữ liệu nhận được:", data);
            
            // Render 4 biểu đồ
            renderAgeChart(data.by_age);
            renderPenaltyChart(data.by_penalty_level);
            // Thay thế biểu đồ giới tính trùng lặp bằng Top 5 offenders theo tiền phạt
            renderTopOffenders();
            renderTimeChart(data.by_time);
            
            showNotification('✅ Dữ liệu thống kê đã tải thành công', 'success');
        } else {
            showNotification('❌ Lỗi: ' + data.message, 'error');
        }
    } catch (error) {
        console.error('[Analytics] Lỗi tải dữ liệu:', error);
        showNotification('❌ Lỗi kết nối server thống kê', 'error');
    }
}

// ============ CHART 1: NỒNG ĐỘ TB THEO NHÓM TUỔI (Bar Chart - Horizontal) ============

function renderAgeChart(ageData) {
    const ctx = document.getElementById('age-chart');
    if (!ctx) return;
    
    const ctx2d = ctx.getContext('2d');
    
    // Chuẩn bị dữ liệu
    const labels = ageData.map(item => item.label);
    const values = ageData.map(item => item.avg_alcohol);
    
    // Màu sắc gradient (xanh → đỏ)
    const colors = [
        '#10b981', // Xanh lá (Dưới 25)
        '#f59e0b', // Cam (25-35)
        '#f97316', // Cam đậm (36-50)
        '#ef4444'  // Đỏ (Trên 50)
    ];
    
    // Destroy chart cũ nếu có
    if (ageChart) {
        ageChart.destroy();
    }
    
    ageChart = new Chart(ctx2d, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Nồng độ trung bình (mg/L)',
                data: values,
                backgroundColor: colors.slice(0, values.length),
                borderColor: '#111827',
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            indexAxis: 'y', // Horizontal bar
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: '#d1d5db',
                        font: { size: 13 },
                        padding: 15
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    callbacks: {
                        label: function(context) {
                            return `${context.parsed.x.toFixed(2)} mg/L`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        color: '#9ca3af',
                        stepSize: 0.05
                    },
                    grid: {
                        color: 'rgba(75, 85, 99, 0.2)'
                    }
                },
                y: {
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

// ============ CHART 2: PHÂN BỐ MỨC VI PHẠM (Doughnut Chart) ============

function renderPenaltyChart(penaltyData) {
    const ctx = document.getElementById('penalty-chart');
    if (!ctx) return;
    
    const ctx2d = ctx.getContext('2d');
    
    // Chuẩn bị dữ liệu theo thứ tự
    const labels = ['An toàn', 'Mức 1', 'Mức 2', 'Mức 3', 'Mức 4'];
    const values = labels.map(label => penaltyData[label] || 0);
    
    // Màu sắc theo mức độ
    const colors = [
        '#10b981', // Xanh lá - An toàn
        '#fbbf24', // Vàng - Mức 1
        '#f97316', // Cam - Mức 2
        '#ef4444', // Đỏ - Mức 3
        '#7f1d1d'  // Đỏ tối - Mức 4
    ];
    
    // Destroy chart cũ nếu có
    if (penaltyChart) {
        penaltyChart.destroy();
    }
    
    penaltyChart = new Chart(ctx2d, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors,
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
                        font: { size: 12 },
                        padding: 15
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percent = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                            return `${label}: ${value} (${percent}%)`;
                        }
                    }
                }
            }
        }
    });
}

// ============ CHART 3: PHÂN BỐ GIỚI TÍNH (Pie Chart) ============
// ============ CHART 3: TOP 5 OFFENDERS BY FINE (Bar Chart) ============

async function renderTopOffenders() {
    const canvas = document.getElementById('gender-analytics-chart');
    if (!canvas) return;

    try {
        // Lấy danh sách vi phạm nhiều nhất (tăng limit nếu cần)
        const res = await fetch(`${API_URL}/violations?limit=1000`);
        const json = await res.json();
        const violations = Array.isArray(json) ? json : (json.violations || json.data || []);

        // Tổng tiền phạt theo biển số/ tên/ cccd
        const totals = {};
        const counts = {};
        violations.forEach(v => {
            const key = (v.license_plate && String(v.license_plate).trim()) || (v.bien_so && String(v.bien_so).trim()) || (v.name && String(v.name).trim()) || (v.ho_ten && String(v.ho_ten).trim()) || (v.cccd && String(v.cccd).trim()) || 'Unknown';

            // Các field tiền phạt có thể là: fine_amount, tien_phat, tien, fine
            let raw = v.fine_amount || v.tien_phat || v.tien || v.fine || v.fine_amount || '';
            raw = String(raw || '');
            let fine = Number(raw);
            if (!isFinite(fine)) {
                // Loại bỏ mọi ký tự không phải chữ số (ví dụ: '4.000.000đ' -> '4000000')
                const digits = raw.replace(/\D+/g, '');
                fine = Number(digits) || 0;
            }

            if (!totals[key]) totals[key] = 0;
            totals[key] += fine;

            if (!counts[key]) counts[key] = 0;
            counts[key] += 1;
        });

        // Convert to array and sort desc
        let sorted = Object.entries(totals).map(([k, v]) => ({ key: k, total: v })).sort((a,b)=>b.total-a.total);
        const totalSum = sorted.reduce((s,i)=>s+i.total,0);

        // Nếu tổng tiền phạt = 0 (dữ liệu chưa có giá trị tiền hợp lệ), sử dụng counts thay vì tổng tiền
        let labels, values, datasetLabel;
        if (totalSum <= 0) {
            sorted = Object.entries(counts).map(([k,v])=>({key:k,count:v})).sort((a,b)=>b.count-a.count);
            const top = sorted.slice(0,5);
            labels = top.map(s=>s.key);
            values = top.map(s=>s.count);
            datasetLabel = 'Số vụ vi phạm';
        } else {
            const top = sorted.slice(0,5);
            labels = top.map(s=>s.key);
            values = top.map(s=>s.total);
            datasetLabel = 'Tổng tiền phạt (VND)';
        }

        // Create bar chart
        const ctx = canvas.getContext('2d');
        const colors = ['#ef4444', '#f97316', '#f59e0b', '#3b82f6', '#6ee7b7'];

        if (window.topOffendersChart) window.topOffendersChart.destroy();

        window.topOffendersChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Tổng tiền phạt (VND)',
                    data: values,
                    backgroundColor: colors.slice(0, values.length),
                    borderColor: '#111827',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#9ca3af', callback: val => new Intl.NumberFormat('vi-VN').format(val) },
                        grid: { color: 'rgba(75,85,99,0.2)' }
                    },
                    x: { ticks: { color: '#d1d5db' }, grid: { display: false } }
                },
                plugins: {
                    tooltip: {
                        callbacks: { label: ctx => `${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(ctx.parsed.y)}` }
                    },
                    legend: { display: false }
                }
            }
        });

    } catch (err) {
        console.error('[Analytics] renderTopOffenders error:', err);
    }
}

// ============ CHART 4: XU HƯỚNG THEO KHUNG GIỜ (Line Chart với Gradient Fill) ============

function renderTimeChart(timeData) {
    const ctx = document.getElementById('time-chart');
    if (!ctx) return;
    
    const ctx2d = ctx.getContext('2d');
    
    // Chuẩn bị dữ liệu theo thứ tự khung giờ
    const timeSlots = ['00h-06h', '06h-12h', '12h-18h', '18h-24h'];
    const values = timeSlots.map(slot => timeData[slot] || 0);
    
    // Tạo gradient fill
    const gradient = ctx2d.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)');   // Blue xanh
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.01)');  // Transparent
    
    // Destroy chart cũ nếu có
    if (timeChart) {
        timeChart.destroy();
    }
    
    timeChart = new Chart(ctx2d, {
        type: 'line',
        data: {
            labels: timeSlots,
            datasets: [{
                label: 'Số lượt vi phạm',
                data: values,
                borderColor: '#3b82f6',
                backgroundColor: gradient,
                fill: true,
                tension: 0.4,
                pointRadius: 6,
                pointBackgroundColor: '#3b82f6',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#d1d5db',
                        font: { size: 13 },
                        padding: 15
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    callbacks: {
                        label: function(context) {
                            return `${context.parsed.y} ca vi phạm`;
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

// ============ UTILITY FUNCTION: SHOW NOTIFICATION ============

function showNotification(message, type = 'info') {
    // Nếu có hàm showNotification trong app.js, dùng nó
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, type);
    } else {
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
}

// ============ KHỞI TẠO KHI PAGE LOAD ============

document.addEventListener('DOMContentLoaded', () => {
    // Chỉ load nếu ta vào tab analytics
    const analyticsTab = document.getElementById('tab-analytics');
    if (analyticsTab) {
        // Lắng nghe sự kiện switch tab
        const analyticsBtn = document.querySelector('[data-tab="analytics"]');
        if (analyticsBtn) {
            analyticsBtn.addEventListener('click', () => {
                console.log("[Analytics] Tab Analytics được chọn, tải dữ liệu...");
                // Thêm delay nhỏ để DOM render xong
                setTimeout(loadAnalyticsData, 100);
            });
        }
    }
});
