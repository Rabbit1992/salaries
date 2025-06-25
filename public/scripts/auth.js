/**
 * 员工工资查询系统 - 用户认证模块
 * 功能：处理用户登录、身份验证、会话管理
 * 作者：系统开发团队
 * 创建时间：2024年
 */

// Google Apps Script Web应用的部署URL
// 注意：每次重新部署Google Apps Script时，此URL可能会发生变化
const SCRIPT_URL = '/api/proxy';

// 获取页面DOM元素引用
// 这些元素在index.html中定义
const loginForm = document.getElementById('loginForm');           // 登录表单
const errorMessage = document.getElementById('errorMessage');     // 错误信息显示区域
const usernameInput = document.getElementById('username');         // 用户名输入框
const passwordInput = document.getElementById('password');         // 密码输入框

/**
 * 页面加载完成后的初始化处理
 * 功能：检查用户是否已经登录，如果已登录则直接跳转到工资查询页面
 * 这样可以避免已登录用户重复登录
 */
document.addEventListener('DOMContentLoaded', function() {
    // 从浏览器本地存储中获取当前用户信息
    const currentUser = localStorage.getItem('currentUser');
    
    if (currentUser) {
        // 如果存在用户信息，说明用户已登录，直接跳转到工资查询页面
        window.location.href = 'salary.html';
    }
    // 如果没有用户信息，则停留在登录页面
});

/**
 * 登录表单提交事件处理器
 * 功能：处理用户登录请求，包括表单验证、API调用、状态管理等
 * 流程：表单验证 -> 显示加载状态 -> 调用登录API -> 处理结果 -> 恢复界面状态
 */
loginForm.addEventListener('submit', async function(e) {
    // 阻止表单的默认提交行为（避免页面刷新）
    e.preventDefault();
    
    // 获取用户输入的用户名和密码，并去除首尾空格
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    
    // 前端基本验证：检查用户名和密码是否为空
    if (!username || !password) {
        showError('请输入用户名和密码');
        return;
    }
    
    // 获取提交按钮并设置加载状态
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;  // 保存按钮原始文本
    submitBtn.innerHTML = '<span class="loading"></span>登录中...';  // 显示加载动画
    submitBtn.disabled = true;  // 禁用按钮防止重复提交
    
    try {
        // 调用登录API进行身份验证
        const result = await login(username, password);
        
        if (result.success) {
            // 登录成功：将用户信息保存到浏览器本地存储
            localStorage.setItem('currentUser', JSON.stringify(result.user));
            
            // 跳转到工资查询页面
            window.location.href = 'salary.html';
        } else {
            // 登录失败：显示错误信息
            showError('用户名或密码错误');
        }
    } catch (error) {
        // 网络错误或其他异常：记录错误并显示友好提示
        console.error('登录错误:', error);
        showError('登录失败，请检查网络连接或稍后重试');
    } finally {
        // 无论成功失败，都要恢复按钮的原始状态
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});

/**
 * 用户登录API调用函数
 * 功能：向Google Apps Script后端发送登录请求进行身份验证
 * 参数：username - 用户名, password - 密码
 * 返回：Promise对象，包含登录结果
 * 容错：如果API调用失败，会自动回退到模拟登录模式
 */
async function login(username, password) {
    // 检查是否配置了有效的Google Apps Script URL
    if (SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
        console.warn('请配置Google Apps Script URL');
        return simulateLogin(username, password);
    }
    
    try {
        // 构建API请求URL
        const url = SCRIPT_URL;
        
        // 发送HTTP请求到Google Apps Script
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action: 'login', username, password })
        });
        
        // 检查HTTP响应状态
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // 解析JSON响应数据
        const result = await response.json();
        return result;
    } catch (error) {
        // API调用失败时的容错处理
        console.warn('Google Apps Script API调用失败，使用模拟登录:', error);
        // 自动回退到模拟登录模式，确保系统基本功能可用
        return simulateLogin(username, password);
    }
}

/**
 * 模拟登录函数（用于演示和容错）
 * 功能：当Google Apps Script不可用时，使用本地模拟数据进行登录验证
 * 参数：username - 用户名, password - 密码
 * 返回：Promise对象，模拟异步登录过程
 * 用途：开发测试、API故障时的备用方案
 */
function simulateLogin(username, password) {
    // 预定义的模拟用户数据，用于演示和测试
    const mockUsers = [
        { username: 'admin', password: '123456', department: '管理部', employee_id: 1001 },
        { username: 'zhang.san', password: '123456', department: '技术部', employee_id: 1002 },
        { username: 'li.si', password: '123456', department: '销售部', employee_id: 1003 },
        { username: 'wang.wu', password: '123456', department: '财务部', employee_id: 1004 }
    ];
    
    // 使用Promise和setTimeout模拟真实的网络请求延迟
    return new Promise((resolve) => {
        setTimeout(() => {
            // 在模拟用户数据中查找匹配的用户名和密码
            const user = mockUsers.find(u => u.username === username && u.password === password);
            
            // 根据查找结果返回相应的登录响应
            if (user) {
                // 登录成功，返回用户信息
                resolve({
                    success: true,
                    user: {
                        username: user.username,
                        department: user.department,
                        employee_id: user.employee_id
                    }
                });
            } else {
                // 登录失败，返回错误信息
                resolve({
                    success: false,
                    message: '用户名或密码错误'
                });
            }
        }, 1000); // 模拟1秒网络延迟，使体验更接近真实API调用
    });
}

// 显示错误消息
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    
    // 3秒后自动隐藏错误消息
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 3000);
}

// 清除错误消息
function clearError() {
    errorMessage.style.display = 'none';
}

// 输入框获得焦点时清除错误消息
usernameInput.addEventListener('focus', clearError);
passwordInput.addEventListener('focus', clearError);