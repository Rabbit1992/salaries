// 配置Google Apps Script的Web应用URL
// 请将此URL替换为您部署的Google Apps Script Web应用URL
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxNJtLbL1fhYW4b2IzJuy1ejOXofyQraqc8ruTOLj0gdsi8fNljaFj2w4F9f1qgTBYc/exec';

// DOM元素
const userInfo = document.getElementById('userInfo');
const logoutBtn = document.getElementById('logoutBtn');
const monthSelect = document.getElementById('monthSelect');
const queryBtn = document.getElementById('queryBtn');
const salaryResult = document.getElementById('salaryResult');
const salaryTableBody = document.getElementById('salaryTableBody');
const noDataMessage = document.getElementById('noDataMessage');
const errorMessage = document.getElementById('errorMessage');

// 当前用户信息
let currentUser = null;

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    // 检查登录状态
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) {
        // 未登录，跳转到登录页面
        window.location.href = 'index.html';
        return;
    }
    
    try {
        currentUser = JSON.parse(userStr);
        initializePage();
    } catch (error) {
        console.error('解析用户信息失败:', error);
        logout();
    }
});

// 初始化页面
function initializePage() {
    // 显示用户信息
    userInfo.textContent = `欢迎，${currentUser.username} (${currentUser.department})`;
    
    // 初始化月份选择器
    initializeMonthSelect();
    
    // 绑定事件
    bindEvents();
}

// 初始化月份选择器
function initializeMonthSelect() {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    // 生成过去12个月的选项
    for (let i = 0; i < 12; i++) {
        let year = currentYear;
        let month = currentMonth - i;
        
        if (month <= 0) {
            month += 12;
            year -= 1;
        }
        
        const monthStr = month.toString().padStart(2, '0');
        const value = `${year}-${monthStr}`;
        const text = `${year}年${monthStr}月`;
        
        const option = document.createElement('option');
        option.value = value;
        option.textContent = text;
        monthSelect.appendChild(option);
    }
}

// 绑定事件
function bindEvents() {
    // 退出登录按钮
    logoutBtn.addEventListener('click', logout);
    
    // 查询按钮
    queryBtn.addEventListener('click', querySalary);
    
    // 月份选择变化时自动查询
    monthSelect.addEventListener('change', function() {
        if (monthSelect.value) {
            querySalary();
        }
    });
}

// 查询工资
async function querySalary() {
    const selectedMonth = monthSelect.value;
    
    if (!selectedMonth) {
        showError('请选择查询月份');
        return;
    }
    
    // 显示加载状态
    const originalText = queryBtn.textContent;
    queryBtn.innerHTML = '<span class="loading"></span>查询中...';
    queryBtn.disabled = true;
    
    // 隐藏之前的结果
    hideResults();
    
    try {
        // 调用查询API
        const result = await getSalaries(currentUser.username, selectedMonth);
        
        if (result.success && result.salaries && result.salaries.length > 0) {
            displaySalaryData(result.salaries);
        } else if (result.success && result.data && result.data.length > 0) {
            // 兼容旧的数据结构
            displaySalaryData(result.data);
        } else {
            showNoData();
        }
    } catch (error) {
        console.error('查询错误:', error);
        showError('查询失败，请检查网络连接或稍后重试');
    } finally {
        // 恢复按钮状态
        queryBtn.textContent = originalText;
        queryBtn.disabled = false;
    }
}

// 获取工资数据API调用
async function getSalaries(username, month) {
    // 如果没有配置SCRIPT_URL，使用模拟数据进行演示
    if (SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
        console.warn('请配置Google Apps Script URL');
        return simulateGetSalaries(username, month);
    }
    
    try {
        const url = `${SCRIPT_URL}?action=getSalaries&username=${encodeURIComponent(username)}&month=${encodeURIComponent(month)}`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.warn('Google Apps Script API调用失败，使用模拟数据:', error);
        // 如果API调用失败，回退到模拟数据
        return simulateGetSalaries(username, month);
    }
}

// 模拟获取工资数据（用于演示）
function simulateGetSalaries(username, month) {
    // 模拟工资数据
    const mockSalaryData = {
        'admin': {
            '2024-01': { base_salary: 15000, bonus: 3000, deductions: 1500, net_salary: 16500 },
            '2024-02': { base_salary: 15000, bonus: 2500, deductions: 1500, net_salary: 16000 },
            '2024-03': { base_salary: 15000, bonus: 3500, deductions: 1500, net_salary: 17000 }
        },
        'zhang.san': {
            '2024-01': { base_salary: 12000, bonus: 2000, deductions: 1200, net_salary: 12800 },
            '2024-02': { base_salary: 12000, bonus: 1800, deductions: 1200, net_salary: 12600 },
            '2024-03': { base_salary: 12000, bonus: 2200, deductions: 1200, net_salary: 13000 }
        },
        'li.si': {
            '2024-01': { base_salary: 10000, bonus: 1500, deductions: 1000, net_salary: 10500 },
            '2024-02': { base_salary: 10000, bonus: 1200, deductions: 1000, net_salary: 10200 },
            '2024-03': { base_salary: 10000, bonus: 1800, deductions: 1000, net_salary: 10800 }
        },
        'wang.wu': {
            '2024-01': { base_salary: 11000, bonus: 1800, deductions: 1100, net_salary: 11700 },
            '2024-02': { base_salary: 11000, bonus: 1600, deductions: 1100, net_salary: 11500 },
            '2024-03': { base_salary: 11000, bonus: 2000, deductions: 1100, net_salary: 11900 }
        }
    };
    
    // 模拟网络延迟
    return new Promise((resolve) => {
        setTimeout(() => {
            const userData = mockSalaryData[username];
            const salaryData = userData ? userData[month] : null;
            
            if (salaryData) {
                resolve({
                    success: true,
                    salaries: [{
                        month: month,
                        base_salary: salaryData.base_salary,
                        bonus: salaryData.bonus,
                        deductions: salaryData.deductions,
                        net_salary: salaryData.net_salary
                    }]
                });
            } else {
                resolve({
                    success: false,
                    salaries: []
                });
            }
        }, 800); // 模拟800ms延迟
    });
}

// 显示工资数据
function displaySalaryData(data) {
    // 清空表格
    salaryTableBody.innerHTML = '';
    
    // 添加数据行
    data.forEach(salary => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatMonth(salary.month)}</td>
            <td>¥${formatCurrency(salary.base_salary)}</td>
            <td>¥${formatCurrency(salary.bonus)}</td>
            <td>¥${formatCurrency(salary.deductions || salary.deduction || 0)}</td>
            <td class="net-salary">¥${formatCurrency(salary.net_salary)}</td>
        `;
        salaryTableBody.appendChild(row);
    });
    
    // 显示结果表格
    salaryResult.style.display = 'block';
}

// 格式化月份显示
function formatMonth(monthStr) {
    const [year, month] = monthStr.split('-');
    return `${year}年${month}月`;
}

// 格式化货币显示
function formatCurrency(amount) {
    return new Intl.NumberFormat('zh-CN').format(amount);
}

// 显示无数据消息
function showNoData() {
    noDataMessage.style.display = 'block';
}

// 隐藏所有结果
function hideResults() {
    salaryResult.style.display = 'none';
    noDataMessage.style.display = 'none';
    errorMessage.style.display = 'none';
}

// 显示错误消息
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    
    // 5秒后自动隐藏错误消息
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 5000);
}

// 退出登录
function logout() {
    // 清除本地存储的用户信息
    localStorage.removeItem('currentUser');
    
    // 跳转到登录页面
    window.location.href = 'index.html';
}

// 添加样式到实发工资列
document.addEventListener('DOMContentLoaded', function() {
    const style = document.createElement('style');
    style.textContent = `
        .net-salary {
            font-weight: bold;
            color: #2d3748;
            background-color: #f0fff4;
        }
    `;
    document.head.appendChild(style);
});