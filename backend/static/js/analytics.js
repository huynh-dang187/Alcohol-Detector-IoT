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
            await renderTopOffenders();
            // Đảm bảo tiêu đề hiển thị đúng ngay cả khi template cũ chưa được cập nhật
            try {
                const canvas = document.getElementById('gender-analytics-chart');
                if (canvas) {
                    const card = canvas.closest('.card-dark');
                    if (card) {
                        const h3 = card.querySelector('h3');
                        if (h3) h3.textContent = 'Top 5 vi phạm (theo tổng tiền phạt)';
                    }
                }
            } catch (e) {
                console.warn('[Analytics] Could not update analytics chart title', e);
            }
            // Ensure controls exist (in case template variant doesn't include them)
            try {
                const canvas = document.getElementById('gender-analytics-chart');
                if (canvas) {
                    const card = canvas.closest('.card-dark') || canvas.parentElement;
                    if (card) {
                        let ctrl = card.querySelector('#top-offenders-controls');
                        if (!ctrl) {
                            ctrl = document.createElement('div');
                            ctrl.id = 'top-offenders-controls';
                            ctrl.className = 'flex gap-2';
                            // create buttons
                            const bFine = document.createElement('button'); bFine.dataset.mode = 'fine'; bFine.textContent='Theo Tiền'; bFine.className='px-3 py-1 rounded bg-blue-600 text-white text-sm';
                            const bCount = document.createElement('button'); bCount.dataset.mode='count'; bCount.textContent='Theo Số Vụ'; bCount.className='px-3 py-1 rounded bg-gray-700 text-white text-sm';
                            const b5 = document.createElement('button'); b5.dataset.top='5'; b5.textContent='Top 5'; b5.className='px-3 py-1 rounded bg-blue-600 text-white text-sm';
                            const b10 = document.createElement('button'); b10.dataset.top='10'; b10.textContent='Top 10'; b10.className='px-3 py-1 rounded bg-gray-700 text-white text-sm';
                            ctrl.appendChild(bFine); ctrl.appendChild(bCount); ctrl.appendChild(b5); ctrl.appendChild(b10);
                            // insert before canvas container
                            const wrapper = canvas.parentElement;
                            wrapper.parentElement.insertBefore(ctrl, wrapper);
                            // wire events
                            setupTopOffendersControls();
                        }
                    }
                }
            } catch (err) { console.warn('[Analytics] create controls failed', err); }
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

async function renderTopOffenders(mode = 'fine', topN = 5) {
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
        let labels, values, datasetLabel;
        if (mode === 'count') {
            const sortedByCount = Object.entries(counts).map(([k,v])=>({key:k,count:v})).sort((a,b)=>b.count-a.count);
            const top = sortedByCount.slice(0, topN);
            labels = top.map(s=>s.key);
            values = top.map(s=>s.count);
            datasetLabel = 'Số vụ vi phạm';
        } else {
            let sorted = Object.entries(totals).map(([k, v]) => ({ key: k, total: v })).sort((a,b)=>b.total-a.total);
            const totalSum = sorted.reduce((s,i)=>s+i.total,0);
            if (totalSum <= 0) {
                // fallback to counts
                const sortedByCount = Object.entries(counts).map(([k,v])=>({key:k,count:v})).sort((a,b)=>b.count-a.count);
                const top = sortedByCount.slice(0, topN);
                labels = top.map(s=>s.key);
                values = top.map(s=>s.count);
                datasetLabel = 'Số vụ vi phạm';
            } else {
                const top = sorted.slice(0, topN);
                labels = top.map(s=>s.key);
                values = top.map(s=>s.total);
                datasetLabel = 'Tổng tiền phạt (VND)';
            }
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
                    label: datasetLabel,
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
                        callbacks: {
                            label: function(context) {
                                if (datasetLabel.includes('Tiền')) {
                                    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(context.parsed.y);
                                }
                                return `${context.parsed.y} vụ`;
                            }
                        }
                    },
                    legend: { display: false }
                }
            }
        });

    } catch (err) {
        console.error('[Analytics] renderTopOffenders error:', err);
    }
}

// UI control handler
function setupTopOffendersControls() {
    let container = document.getElementById('top-offenders-controls');
    if (!container) {
        // tạo động nếu template không có
        const canvas = document.getElementById('gender-analytics-chart');
        if (canvas) {
            const card = canvas.closest('.card-dark');
            if (card) {
                const header = card.querySelector('h3');
                container = document.createElement('div');
                container.id = 'top-offenders-controls';
                container.className = 'flex gap-2';
                // thêm vào sau header
                if (header && header.parentElement) header.parentElement.appendChild(container);
            }
        }
    }
    if (!container) return;
    let btn5 = container.querySelector('[data-top="5"]');
    let btn10 = container.querySelector('[data-top="10"]');
    // if buttons missing create them
    if (!btn5) {
        btn5 = document.createElement('button');
        btn5.setAttribute('data-top','5');
        btn5.className = 'px-3 py-1 rounded bg-blue-600 text-white text-sm';
        btn5.textContent = 'Top 5';
        container.appendChild(btn5);
    }
    if (!btn10) {
        btn10 = document.createElement('button');
        btn10.setAttribute('data-top','10');
        btn10.className = 'px-3 py-1 rounded bg-gray-700 text-white text-sm';
        btn10.textContent = 'Top 10';
        container.appendChild(btn10);
    }
    let btnFine = container.querySelector('[data-mode="fine"]');
    let btnCount = container.querySelector('[data-mode="count"]');
    if (!btnFine) {
        btnFine = document.createElement('button');
        btnFine.setAttribute('data-mode','fine');
        btnFine.className = 'px-3 py-1 rounded bg-blue-600 text-white text-sm';
        btnFine.textContent = 'Theo Tiền';
        container.insertBefore(btnFine, container.firstChild);
    }
    if (!btnCount) {
        btnCount = document.createElement('button');
        btnCount.setAttribute('data-mode','count');
        btnCount.className = 'px-3 py-1 rounded bg-gray-700 text-white text-sm';
        btnCount.textContent = 'Theo Số Vụ';
        container.insertBefore(btnCount, container.firstChild.nextSibling);
    }

    let currentMode = 'fine';
    let currentTop = 5;

    const setActiveMode = (mode) => {
        currentMode = mode;
        if (btnFine) btnFine.classList.toggle('bg-blue-600', mode==='fine');
        if (btnCount) btnCount.classList.toggle('bg-blue-600', mode==='count');
    };
    const setActiveTop = (top) => {
        currentTop = top;
        if (btn5) btn5.classList.toggle('bg-blue-600', top===5);
        if (btn10) btn10.classList.toggle('bg-blue-600', top===10);
    };

    if (btnFine) btnFine.addEventListener('click', async () => { setActiveMode('fine'); await renderTopOffenders(currentMode, currentTop); });
    if (btnCount) btnCount.addEventListener('click', async () => { setActiveMode('count'); await renderTopOffenders(currentMode, currentTop); });
    if (btn5) btn5.addEventListener('click', async () => { setActiveTop(5); await renderTopOffenders(currentMode, currentTop); });
    if (btn10) btn10.addEventListener('click', async () => { setActiveTop(10); await renderTopOffenders(currentMode, currentTop); });

    // Initialize
    setActiveMode(currentMode);
    setActiveTop(currentTop);
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
