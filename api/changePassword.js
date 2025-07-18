/**
 * 修改密码API
 * 功能：处理用户密码修改请求，更新飞书多维表格中的用户密码
 */

const feishuConfig = {
  APP_ID: process.env.FEISHU_APP_ID || 'cli_a8d0a9945631d013',
  APP_SECRET: process.env.FEISHU_APP_SECRET || 'Y9Js8PdijoLrfNpmRGdFXfdM7BNWRkvd',
  APP_TOKEN: process.env.FEISHU_APP_TOKEN || 'KvyUbXEBpaQVcbsYQcIc3oDnnKc',
  USER_TABLE_ID: process.env.FEISHU_USER_TABLE_ID || 'tblUwpIiulO5QfS4'
};

// 获取飞书租户访问令牌
async function getTenantAccessToken() {
  try {
    const response = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        app_id: feishuConfig.APP_ID,
        app_secret: feishuConfig.APP_SECRET
      })
    });
    
    const data = await response.json();
    if (data.code === 0) {
      return data.tenant_access_token;
    }
    throw new Error(`获取访问令牌失败: ${data.msg}`);
  } catch (error) {
    console.error('获取飞书访问令牌失败:', error);
    return null;
  }
}

// 查询用户信息
async function queryUser(token, username) {
  try {
    const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${feishuConfig.APP_TOKEN}/tables/${feishuConfig.USER_TABLE_ID}/records/search`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filter: {
          conjunction: 'and',
          conditions: [{
            field_name: '用户名',
            operator: 'is',
            value: [username]
          }]
        }
      })
    });
    
    const data = await response.json();
    if (data.code === 0 && data.data.items.length > 0) {
      return data.data.items[0];
    }
    return null;
  } catch (error) {
    console.error('查询用户失败:', error);
    return null;
  }
}

// 更新用户密码
async function updateUserPassword(token, recordId, newPassword) {
  try {
    const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${feishuConfig.APP_TOKEN}/tables/${feishuConfig.USER_TABLE_ID}/records/${recordId}`;
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: {
          '密码': [{
            text: newPassword
          }]
        }
      })
    });
    
    const data = await response.json();
    return data.code === 0;
  } catch (error) {
    console.error('更新密码失败:', error);
    return false;
  }
}

// 验证密码强度
function validatePasswordStrength(password) {
  if (password.length < 6) {
    return { valid: false, message: '密码长度至少6位' };
  }
  
  if (password.length < 8) {
    return { valid: false, message: '建议密码长度至少8位' };
  }
  
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  if (!hasLetter || !hasNumber) {
    return { valid: false, message: '密码应包含字母和数字' };
  }
  
  return { valid: true, message: '密码强度良好' };
}

// 修改密码主函数
async function changePassword(username, currentPassword, newPassword, token) {
  try {
    // 查询用户信息
    const user = await queryUser(token, username);
    if (!user) {
      return { success: false, error: '用户不存在' };
    }
    
    // 验证当前密码
    const userPassword = user.fields['密码'][0]?.text;
    if (userPassword !== currentPassword) {
      return { success: false, error: '当前密码错误' };
    }
    
    // 验证新密码强度
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
      return { success: false, error: passwordValidation.message };
    }
    
    // 检查新密码是否与当前密码相同
    if (currentPassword === newPassword) {
      return { success: false, error: '新密码不能与当前密码相同' };
    }
    
    // 更新密码
    const updateSuccess = await updateUserPassword(token, user.record_id, newPassword);
    if (!updateSuccess) {
      return { success: false, error: '密码更新失败，请稍后重试' };
    }
    
    return { success: true, message: '密码修改成功' };
  } catch (error) {
    console.error('修改密码失败:', error);
    return { success: false, error: '修改密码失败' };
  }
}

// Vercel Serverless Function 主函数
async function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: '仅支持POST请求' });
  }
  
  try {
    const { username, currentPassword, newPassword } = req.body;
    
    if (!username || !currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: '用户名、当前密码和新密码不能为空' });
    }
    
    // 获取飞书访问令牌
    const token = await getTenantAccessToken();
    if (!token) {
      return res.status(500).json({ success: false, error: '获取飞书凭证失败' });
    }
    
    // 执行密码修改
    console.log('开始修改密码，用户:', username);
    const result = await changePassword(username, currentPassword, newPassword, token);
    console.log('密码修改结果:', result);
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('修改密码API错误:', error);
    return res.status(500).json({ success: false, error: '服务器内部错误' });
  }
}

module.exports = handler;