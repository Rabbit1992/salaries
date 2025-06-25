// 测试登录功能的脚本
// 运行命令: node test-login.js

const feishuConfig = {
  APP_ID: 'cli_a8d0a9945631d013',
  APP_SECRET: 'Y9Js8PdijoLrfNpmRGdFXfdM7BNWRkvd',
  APP_TOKEN: 'KvyUbXEBpaQVcbsYQcIc3oDnnKc',
  USER_TABLE_ID: 'tblUwpIiulO5QfS4'
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

// 用户登录验证
async function loginUser(username, password, token) {
  try {
    const user = await queryUser(token, username);
    if (!user) {
      return { success: false, error: '用户不存在' };
    }
    
    console.log('🔍 找到用户:', user.fields);
    
    // 飞书字段值是对象数组格式，需要提取text属性
    const userPassword = user.fields['密码'][0]?.text;
    console.log(`🔐 数据库密码: ${userPassword}, 输入密码: ${password}`);
    
    if (userPassword !== password) {
      return { success: false, error: '密码错误' };
    }
    
    return {
      success: true,
      user: {
        username: user.fields['用户名'][0]?.text,
        name: user.fields['部门'][0]?.text, // 实际存储姓名的字段
        employeeId: user.fields['工号'][0]?.text,
        department: user.fields['部门'][0]?.text // 暂时使用同一字段
      }
    };
  } catch (error) {
    console.error('登录验证失败:', error);
    return { success: false, error: '登录验证失败' };
  }
}

// 测试登录功能
async function testLogin() {
  console.log('🧪 开始测试登录功能...');
  
  const token = await getTenantAccessToken();
  if (!token) {
    console.log('❌ 无法获取访问令牌');
    return;
  }
  
  // 使用从用户表中看到的实际数据进行测试
  const testUsername = 'lijing';
  const testPassword = '123456';
  
  console.log(`\n🔑 测试登录: 用户名=${testUsername}, 密码=${testPassword}`);
  
  const result = await loginUser(testUsername, testPassword, token);
  
  if (result.success) {
    console.log('✅ 登录成功!');
    console.log('👤 用户信息:', result.user);
  } else {
    console.log('❌ 登录失败:', result.error);
  }
}

// 运行测试
testLogin();