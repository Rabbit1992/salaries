// 配置后端API的Web应用URL
/**
 * 工资查询页面脚本文件
 * 功能：处理用户工资查询、显示工资详情、用户登出等操作
 * 依赖：需要用户已通过auth.js完成登录验证
 */

// 配置 - 使用Vercel API端点
const API_BASE = '/api';

// 页面DOM元素引用
const userInfo = document.getElementById('userInfo');           // 用户信息显示区域
const logoutBtn = document.getElementById('logoutBtn');         // 登出按钮
const monthSelect = document.getElementById('monthSelect');     // 月份选择下拉框
const queryBtn = document.getElementById('queryBtn');           // 查询按钮
const yearSummaryBtn = document.getElementById('yearSummaryBtn'); // 年度汇总按钮
const yearSummary = document.getElementById('yearSummary');     // 年度汇总显示区域
const salaryResult = document.getElementById('salaryResult');   // 工资结果显示区域
const salaryTableBody = document.getElementById('salaryTableBody'); // 工资表格主体
const noDataMessage = document.getElementById('noDataMessage'); // 无数据提示信息
const errorMessage = document.getElementById('errorMessage');   // 错误信息显示区域
const refreshOverview = document.getElementById('refreshOverview');

// 工资发放情况模块元素
const recentMonthTitle = document.getElementById('recentMonthTitle');
const recentGross = document.getElementById('recentGross');
const recentDeduction = document.getElementById('recentDeduction');
const recentNet = document.getElementById('recentNet');
const recentFund = document.getElementById('recentFund');
const yearGross = document.getElementById('yearGross');
const yearDeduction = document.getElementById('yearDeduction');
const yearNet = document.getElementById('yearNet');
const yearFund = document.getElementById('yearFund');
const loadingOverlay = document.getElementById('loadingOverlay');

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
    
    initializeResponsive();
});

// 移动端菜单切换
function toggleMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('mobile-open');
}

// 初始化响应式功能
function initializeResponsive() {
    // 监听窗口大小变化
    window.addEventListener('resize', function() {
        const sidebar = document.querySelector('.sidebar');
        if (window.innerWidth > 768) {
            // 桌面端时移除移动端类
            sidebar.classList.remove('mobile-open');
        }
    });
    
    // 点击遮罩层关闭菜单
    document.addEventListener('click', function(e) {
        const sidebar = document.querySelector('.sidebar');
        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        
        if (sidebar.classList.contains('mobile-open') && 
            !sidebar.contains(e.target) && 
            !mobileMenuBtn.contains(e.target)) {
            sidebar.classList.remove('mobile-open');
        }
    });
    
    console.log('响应式功能已初始化');
}

/**
 * 初始化页面函数
 * 功能：设置用户界面、初始化控件、绑定事件处理、加载概览数据
 * 调用时机：用户登录验证成功后
 */
function initializePage() {
    // 在页面顶部显示当前登录用户的用户名和部门信息
    userInfo.textContent = `欢迎，${currentUser.username} (${currentUser.department})`;
    
    // 初始化月份下拉选择器，生成过去12个月的选项
    initializeMonthSelect();
    
    // 绑定各种UI元素的事件处理函数
    bindEvents();
    
    // 加载工资发放情况概览
    loadSalaryOverview();
}

/**
 * 初始化月份选择器函数
 * 功能：生成从2025年1月开始的月份选项供用户选择查询
 * 逻辑：从2025年1月开始，生成到当前月份的所有选项
 */
function initializeMonthSelect() {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    // 从2025年1月开始生成选项
    const startYear = 2025;
    const startMonth = 1;
    
    // 计算需要生成的月份数量
    let year = startYear;
    let month = startMonth;
    
    while (year < currentYear || (year === currentYear && month <= currentMonth)) {
        // 格式化月份为两位数字符串（如：01, 02, ..., 12）
        const monthStr = month.toString().padStart(2, '0');
        const value = `${year}-${monthStr}`;     // option的值：YYYY-MM格式
        const text = `${year}年${monthStr}月`;    // 显示文本：中文格式
        
        // 创建并添加option元素到select中
        const option = document.createElement('option');
        option.value = value;
        option.textContent = text;
        monthSelect.appendChild(option);
        
        // 递增月份
        month++;
        if (month > 12) {
            month = 1;
            year++;
        }
    }
}

/**
 * 绑定事件处理函数
 * 功能：为页面上的各个交互元素绑定事件处理函数
 * 包括：登出按钮、查询按钮、年度汇总按钮、月份选择器变化事件、刷新概览按钮
 */
function bindEvents() {
    // 为登出按钮绑定点击事件，点击后执行logout函数
    logoutBtn.addEventListener('click', logout);
    
    // 为查询按钮绑定点击事件，点击后执行querySalary函数
    queryBtn.addEventListener('click', querySalary);
    
    // 为年度汇总按钮绑定点击事件，点击后执行showYearSummary函数
    yearSummaryBtn.addEventListener('click', showYearSummary);
    
    // 为月份选择器绑定变化事件，选择不同月份时自动触发查询
    // 这提供了更好的用户体验，无需每次都点击查询按钮
    monthSelect.addEventListener('change', function() {
        // 确保选择了有效的月份值才执行查询
        if (monthSelect.value) {
            querySalary();
        }
    });
    
    // 刷新概览按钮点击事件
    refreshOverview.addEventListener('click', loadSalaryOverview);
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
        
        if (result.success && result.salaries) {
            if (result.salaries.length > 0) {
                displaySalaryData(result.salaries);
            } else {
                showNoData();
            }
        } else {
            showError(result.error || '查询失败');
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
 * 工资查询API调用函数
 * 功能：向Vercel API端点发送工资查询请求
 * 参数：
 *   - username: 用户名，用于查询特定用户的工资信息
 *   - month: 查询月份，格式为YYYY-MM
 * 返回：Promise对象，包含工资查询结果
 * 容错：如果API调用失败，会自动回退到模拟数据
 */
async function getSalaries(username, month) {
    try {
        const response = await fetch(`${API_BASE}/getSalaries`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: username,
                month: month
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('API调用失败:', error);
        throw error; // 将错误向上抛出，由调用者处理
    }
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
            <td>¥${formatCurrency(salary.basicSalary || 0)}</td>
            <td>¥${formatCurrency((salary.performanceBonus || 0) + (salary.allowance || 0))}</td>
            <td>¥${formatCurrency(salary.deduction || 0)}</td>
            <td class="net-salary">¥${formatCurrency(salary.netSalary || 0)}</td>
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
    // 确保amount是有效数值
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) {
        return '0';
    }
    return new Intl.NumberFormat('zh-CN').format(numAmount);
}

// 显示无数据消息
function showNoData() {
    noDataMessage.style.display = 'block';
}

/**
 * 功能：隐藏结果显示区域
 * 包括：工资结果表格、无数据消息、错误消息、年度汇总看板
 */
function hideResults() {
    salaryResult.style.display = 'none';
    noDataMessage.style.display = 'none';
    errorMessage.style.display = 'none';
    yearSummary.style.display = 'none';
}

/**
 * 功能：隐藏年度汇总面板
 */
function hideYearSummary() {
    yearSummary.style.display = 'none';
}

/**
 * 功能：格式化货币显示
 * 参数：amount - 金额数值
 * 返回：格式化后的货币字符串
 */
function formatCurrency(amount) {
    return `¥${parseFloat(amount || 0).toLocaleString('zh-CN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}

/**
 * 功能：格式化月份显示
 * 参数：month - 月份字符串（如 "2025-06"）
 * 返回：格式化后的月份字符串（如 "2025年06月"）
 */
function formatMonth(month) {
    if (!month) return '未知月份';
    const [year, monthNum] = month.split('-');
    return `${year}年${monthNum}月`;
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

/**
 * 显示年度工资汇总
 * 功能：查询2025年全年的工资数据并计算汇总信息
 */
async function showYearSummary() {
    // 保存按钮原始文本，并显示加载状态
    const originalText = yearSummaryBtn.textContent;
    yearSummaryBtn.innerHTML = '<span class="loading"></span>计算中...';
    yearSummaryBtn.disabled = true;
    
    // 清除之前的显示结果
    hideResults();
    
    try {
        // 查询2025年全年的工资数据
        const response = await fetch(`${API_BASE}/getSalaries`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: currentUser.username,
                month: '' // 空字符串表示查询所有月份
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.data && data.data.length > 0) {
            // 过滤出2025年的数据
            const year2025Data = data.data.filter(record => {
                const month = getFieldValue(record.month);
                return month && month.startsWith('2025');
            });
            
            if (year2025Data.length > 0) {
                calculateAndDisplayYearSummary(year2025Data);
            } else {
                showError('未找到2025年的工资记录');
            }
        } else {
            showError('未找到工资记录');
        }
    } catch (error) {
        console.error('年度汇总查询失败:', error);
        showError('年度汇总查询失败，请稍后重试');
    } finally {
        // 恢复按钮状态
        yearSummaryBtn.textContent = originalText;
        yearSummaryBtn.disabled = false;
    }
}

/**
 * 计算并显示年度汇总数据
 * @param {Array} salaryData - 2025年的工资数据数组
 */
function calculateAndDisplayYearSummary(salaryData) {
    let totalBasic = 0;
    let totalBonus = 0;
    let totalDeduction = 0;
    let totalIncome = 0;
    
    // 遍历所有工资记录进行累加
    salaryData.forEach(record => {
        const basicSalary = parseFloat(getFieldValue(record.basicSalary)) || 0;
        const performanceBonus = parseFloat(getFieldValue(record.performanceBonus)) || 0;
        const allowance = parseFloat(getFieldValue(record.allowance)) || 0;
        const deduction = parseFloat(getFieldValue(record.deduction)) || 0;
        const netSalary = parseFloat(getFieldValue(record.netSalary)) || 0;
        
        totalBasic += basicSalary;
        totalBonus += (performanceBonus + allowance);
        totalDeduction += deduction;
        totalIncome += netSalary;
    });
    
    // 更新页面显示
    document.getElementById('totalIncome').textContent = formatCurrency(totalIncome);
    document.getElementById('totalBasic').textContent = formatCurrency(totalBasic);
    document.getElementById('totalBonus').textContent = formatCurrency(totalBonus);
    document.getElementById('totalDeduction').textContent = formatCurrency(totalDeduction);
    
    // 显示年度汇总区域
    yearSummary.style.display = 'block';
}

/**
 * 功能：加载工资发放情况概览数据
 * 包括最近一个月的工资数据和当年合计数据
 */
async function loadSalaryOverview() {
    try {
        showLoading();
        
        // 获取2025年全年工资数据
        const response = await fetch('/api/getSalaries', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: currentUser.username,
                year: 2025
            })
        });
        
        const data = await response.json();
        
        if (data.success && data.salaries && data.salaries.length > 0) {
            // 按月份排序，获取最新月份数据
            const sortedSalaries = data.salaries.sort((a, b) => {
                const monthA = parseInt(a.month.split('-')[1]);
                const monthB = parseInt(b.month.split('-')[1]);
                return monthB - monthA;
            });
            
            const latestSalary = sortedSalaries[0];
            
            // 更新最近月份数据
            updateRecentMonthData(latestSalary);
            
            // 计算并更新年度汇总数据
            updateYearSummaryData(data.salaries);
        } else {
            // 如果没有数据，显示默认值
            resetOverviewData();
        }
    } catch (error) {
        console.error('加载工资概览数据失败:', error);
        resetOverviewData();
    } finally {
        hideLoading();
    }
}

/**
 * 功能：更新最近月份工资数据显示
 * 参数：salaryData - 最新月份的工资数据
 */
function updateRecentMonthData(salaryData) {
    const basic = parseFloat(salaryData.basicSalary) || 0;
    const bonus = parseFloat(salaryData.performanceBonus) || 0;
    const allowance = parseFloat(salaryData.allowance) || 0;
    const deduction = parseFloat(salaryData.deduction) || 0;
    const net = parseFloat(salaryData.netSalary) || 0;
    
    // 假设公积金为基础工资的12%（可根据实际情况调整）
    const fund = basic * 0.12;
    const gross = basic + bonus + allowance;
    
    // 更新显示
    recentMonthTitle.textContent = `${formatMonth(salaryData.month)} 工资`;
    recentGross.textContent = formatCurrency(gross);
    recentDeduction.textContent = formatCurrency(deduction);
    recentNet.textContent = formatCurrency(net);
    recentFund.textContent = formatCurrency(fund);
}

/**
 * 功能：更新年度汇总数据显示
 * 参数：salariesData - 全年工资数据数组
 */
function updateYearSummaryData(salariesData) {
    let totalBasic = 0;
    let totalBonus = 0;
    let totalAllowance = 0;
    let totalDeduction = 0;
    let totalNet = 0;
    
    // 计算年度总计
    salariesData.forEach(salary => {
        totalBasic += parseFloat(salary.basicSalary) || 0;
        totalBonus += parseFloat(salary.performanceBonus) || 0;
        totalAllowance += parseFloat(salary.allowance) || 0;
        totalDeduction += parseFloat(salary.deduction) || 0;
        totalNet += parseFloat(salary.netSalary) || 0;
    });
    
    const totalGross = totalBasic + totalBonus + totalAllowance;
    const totalFund = totalBasic * 0.12; // 假设公积金为基础工资的12%
    
    // 更新显示
    yearGross.textContent = formatCurrency(totalGross);
    yearDeduction.textContent = formatCurrency(totalDeduction);
    yearNet.textContent = formatCurrency(totalNet);
    yearFund.textContent = formatCurrency(totalFund);
}

/**
 * 功能：重置概览数据为默认值
 */
function resetOverviewData() {
    recentMonthTitle.textContent = '暂无数据';
    recentGross.textContent = '¥0';
    recentDeduction.textContent = '¥0';
    recentNet.textContent = '¥0';
    recentFund.textContent = '¥0';
    
    yearGross.textContent = '¥0';
    yearDeduction.textContent = '¥0';
    yearNet.textContent = '¥0';
    yearFund.textContent = '¥0';
}

/**
 * 功能：显示加载动画
 */
function showLoading() {
    if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
    }
}

/**
 * 功能：隐藏加载动画
 */
function hideLoading() {
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
}

/**
 * 功能：获取字段值的辅助函数
 * 参数：field - 字段对象或字符串值
 * 返回：字段的实际值
 */
function getFieldValue(field) {
    if (typeof field === 'object' && field !== null) {
        return field.stringValue || field.doubleValue || field.integerValue || '';
    }
    return field || '';
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