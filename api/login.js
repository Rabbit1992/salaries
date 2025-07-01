// Vercel Serverless Function - 用户登录API

const feishuConfig = {
  APP_ID: process.env.FEISHU_APP_ID || 'cli_a8d0a9945631d013',
  APP_SECRET: process.env.FEISHU_APP_SECRET || 'Y9Js8PdijoLrfNpmRGdFXfdM7BNWRkvd',
  APP_TOKEN: process.env.FEISHU_APP_TOKEN || 'KvyUbXEBpaQVcbsYQcIc3oDnnKc',
  USER_TABLE_ID: process.env.FEISHU_USER_TABLE_ID || 'tblUwpIiulO5QfS4',
  SALARY_TABLE_ID: process.env.FEISHU_SALARY_TABLE_ID || 'tblhjBxxfDbEx1Kt'
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
    
    // 飞书字段值是对象数组格式，需要提取text属性
    const userPassword = user.fields['密码'][0]?.text;
    if (userPassword !== password) {
      return { success: false, error: '密码错误' };
    }
    
    return {
      success: true,
      user: {
        username: user.fields['用户名'][0]?.text,
        name: user.fields['姓名'][0]?.text,
        employeeId: user.fields['工号'][0]?.text,
        department: user.fields['姓名'][0]?.text // 使用姓名作为显示名称
      }
    };
  } catch (error) {
    console.error('登录验证失败:', error);
    return { success: false, error: '登录验证失败' };
  }
}

// Vercel Serverless Function 主函数
export default async function handler(req, res) {
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
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ success: false, error: '用户名和密码不能为空' });
    }
    
    // 获取飞书访问令牌
    const token = await getTenantAccessToken();
    if (!token) {
      return res.status(500).json({ success: false, error: '获取飞书凭证失败' });
    }
    
    // 执行登录验证
    const result = await loginUser(username, password, token);
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('登录API错误:', error);
    return res.status(500).json({ success: false, error: '服务器内部错误' });
  }
}