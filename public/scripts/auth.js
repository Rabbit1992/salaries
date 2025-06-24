// 配置Google Apps Script的Web应用URL
// 请将此URL替换为您部署的Google Apps Script Web应用URL
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxNJtLbL1fhYW4b2IzJuy1ejOXofyQraqc8ruTOLj0gdsi8fNljaFj2w4F9f1qgTBYc/exec';

// DOM元素
const loginForm = document.getElementById('loginForm');
const errorMessage = document.getElementById('errorMessage');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');

// 页面加载时检查是否已登录
document.addEventListener('DOMContentLoaded', function() {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        // 如果已登录，跳转到工资查询页面
        window.location.href = 'salary.html';
    }
});

// 登录表单提交事件
loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    
    // 基本验证
    if (!username || !password) {
        showError('请输入用户名和密码');
        return;
    }
    
    // 显示加载状态
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.innerHTML = '<span class="loading"></span>登录中...';
    submitBtn.disabled = true;
    
    try {
        // 调用登录API
        const result = await login(username, password);
        
        if (result.success) {
            // 登录成功，保存用户信息到localStorage
            localStorage.setItem('currentUser', JSON.stringify(result.user));
            
            // 跳转到工资查询页面
            window.location.href = 'salary.html';
        } else {
            showError('用户名或密码错误');
        }
    } catch (error) {
        console.error('登录错误:', error);
        showError('登录失败，请检查网络连接或稍后重试');
    } finally {
        // 恢复按钮状态
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});

// 登录API调用
async function login(username, password) {
    // 如果没有配置SCRIPT_URL，使用模拟数据进行演示
    if (SCRIPT_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
        console.warn('请配置Google Apps Script URL');
        return simulateLogin(username, password);
    }
    
    try {
        const url = `${SCRIPT_URL}?action=login&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
        
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
        console.warn('Google Apps Script API调用失败，使用模拟登录:', error);
        // 如果API调用失败，回退到模拟登录
        return simulateLogin(username, password);
    }
}

// 模拟登录（用于演示）
function simulateLogin(username, password) {
    // 模拟用户数据
    const mockUsers = [
        { username: 'admin', password: '123456', department: '管理部', employee_id: 1001 },
        { username: 'zhang.san', password: '123456', department: '技术部', employee_id: 1002 },
        { username: 'li.si', password: '123456', department: '销售部', employee_id: 1003 },
        { username: 'wang.wu', password: '123456', department: '财务部', employee_id: 1004 }
    ];
    
    // 模拟网络延迟
    return new Promise((resolve) => {
        setTimeout(() => {
            const user = mockUsers.find(u => u.username === username && u.password === password);
            
            if (user) {
                resolve({
                    success: true,
                    user: {
                        username: user.username,
                        department: user.department,
                        employee_id: user.employee_id
                    }
                });
            } else {
                resolve({
                    success: false,
                    message: '用户名或密码错误'
                });
            }
        }, 1000); // 模拟1秒延迟
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