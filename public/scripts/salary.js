// 配置Google Apps Script的Web应用URL
/**
 * 工资查询页面脚本文件
 * 功能：处理用户工资查询、显示工资详情、用户登出等操作
 * 依赖：需要用户已通过auth.js完成登录验证
 */

// Google Apps Script Web应用URL配置
// 注意：此URL需要替换为您实际部署的Google Apps Script Web应用地址
const SCRIPT_URL = '/api/proxy';

// 页面DOM元素引用
const userInfo = document.getElementById('userInfo');           // 用户信息显示区域
const logoutBtn = document.getElementById('logoutBtn');         // 登出按钮
const monthSelect = document.getElementById('monthSelect');     // 月份选择下拉框
const queryBtn = document.getElementById('queryBtn');           // 查询按钮
const salaryResult = document.getElementById('salaryResult');   // 工资结果显示区域
const salaryTableBody = document.getElementById('salaryTableBody'); // 工资表格主体
const noDataMessage = document.getElementById('noDataMessage'); // 无数据提示信息
const errorMessage = document.getElementById('errorMessage');   // 错误信息显示区域

// 全局变量：当前登录用户信息
let currentUser = null;

/**
 * 页面加载完成后的初始化处理
 * 功能：检查用户登录状态，验证用户信息，初始化页面
 * 安全性：未登录用户将被重定向到登录页面
 */
document.addEventListener('DOMContentLoaded', function() {
    // 从本地存储中获取当前登录用户信息
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) {
        // 用户未登录，重定向到登录页面
        window.location.href = 'index.html';
        return;
    }
    
    try {
        // 解析用户信息JSON字符串
        currentUser = JSON.parse(userStr);
        // 用户信息有效，初始化页面
        initializePage();
    } catch (error) {
        // 用户信息解析失败，可能数据损坏，强制登出
        console.error('解析用户信息失败:', error);
        logout();
    }
});

/**
 * 初始化页面函数
 * 功能：设置用户界面、初始化控件、绑定事件处理
 * 调用时机：用户登录验证成功后
 */
function initializePage() {
    // 在页面顶部显示当前登录用户的用户名和部门信息
    userInfo.textContent = `欢迎，${currentUser.username} (${currentUser.department})`;
    
    // 初始化月份下拉选择器，生成过去12个月的选项
    initializeMonthSelect();
    
    // 绑定各种UI元素的事件处理函数
    bindEvents();
}

/**
 * 初始化月份选择器函数
 * 功能：动态生成过去12个月的选项供用户选择查询
 * 逻辑：从当前月份开始，向前推算12个月，处理跨年情况
 */
function initializeMonthSelect() {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();   // 获取当前年份
    const currentMonth = currentDate.getMonth() + 1; // 获取当前月份（1-12）
    
    // 循环生成过去12个月的选项（包括当前月份）
    for (let i = 0; i < 12; i++) {
        let year = currentYear;
        let month = currentMonth - i; // 从当前月份开始递减
        
        // 处理跨年情况：如果月份小于等于0，则需要调整到上一年
        if (month <= 0) {
            month += 12; // 转换为上一年的对应月份
            year -= 1;   // 年份减1
        }
        
        // 格式化月份为两位数字符串（如：01, 02, ..., 12）
        const monthStr = month.toString().padStart(2, '0');
        const value = `${year}-${monthStr}`;     // option的值：YYYY-MM格式
        const text = `${year}年${monthStr}月`;    // 显示文本：中文格式
        
        // 创建并添加option元素到select中
        const option = document.createElement('option');
        option.value = value;
        option.textContent = text;
        monthSelect.appendChild(option);
    }
}

/**
 * 绑定事件处理函数
 * 功能：为页面上的各个交互元素绑定事件处理函数
 * 包括：登出按钮、查询按钮、月份选择器变化事件
 */
function bindEvents() {
    // 为登出按钮绑定点击事件，点击后执行logout函数
    logoutBtn.addEventListener('click', logout);
    
    // 为查询按钮绑定点击事件，点击后执行querySalary函数
    queryBtn.addEventListener('click', querySalary);
    
    // 为月份选择器绑定变化事件，选择不同月份时自动触发查询
    // 这提供了更好的用户体验，无需每次都点击查询按钮
    monthSelect.addEventListener('change', function() {
        // 确保选择了有效的月份值才执行查询
        if (monthSelect.value) {
            querySalary();
        }
    });
}

/**
 * 工资查询主函数
 * 功能：根据选择的月份查询当前用户的工资信息
 * 流程：验证输入 -> 显示加载状态 -> 调用API -> 处理结果 -> 恢复界面
 * 错误处理：网络错误、数据格式错误等
 */
async function querySalary() {
    const selectedMonth = monthSelect.value;
    
    // 验证用户是否选择了查询月份
    if (!selectedMonth) {
        showError('请选择查询月份');
        return;
    }
    
    // 保存按钮原始文本，并显示加载状态
    const originalText = queryBtn.textContent;
    queryBtn.innerHTML = '<span class="loading"></span>查询中...';
    queryBtn.disabled = true; // 防止重复点击
    
    // 清除之前的查询结果显示
    hideResults();
    
    try {
        // 调用后端API获取工资数据
        const result = await getSalaries(currentUser.username, selectedMonth);
        
        // 处理API返回的数据，支持多种数据结构格式
        if (result.success && result.salaries && result.salaries.length > 0) {
            // 标准数据结构：result.salaries
            displaySalaryData(result.salaries);
        } else if (result.success && result.data && result.data.length > 0) {
            // 兼容旧版本数据结构：result.data
            displaySalaryData(result.data);
        } else {
            // 查询成功但无数据
            showNoData();
        }
    } catch (error) {
        // 捕获并处理查询过程中的错误
        console.error('查询错误:', error);
        showError('查询失败，请检查网络连接或稍后重试');
    } finally {
        // 无论成功失败，都要恢复按钮的原始状态
        queryBtn.textContent = originalText;
        queryBtn.disabled = false;
    }
}

/**
 * 获取工资数据API调用函数
 * 功能：向Google Apps Script后端发送工资查询请求
 * 参数：
 *   - username: 用户名，用于查询特定用户的工资信息
 *   - month: 查询月份，格式为YYYY-MM
 * 返回：Promise对象，包含工资查询结果
 * 容错：如果API调用失败，会自动回退到模拟数据
 */
async function getSalaries(username, month) {
    // 检查是否配置了有效的Google Apps Script URL
    // 如果未配置，则使用模拟数据进行演示，便于开发和测试
    if (SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
        console.warn('请配置Google Apps Script URL');
        return simulateGetSalaries(username, month);
    }
    
    try {
        const url = SCRIPT_URL;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action: 'getSalaries', username: username, month: month })
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