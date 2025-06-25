// Vercel Serverless Function - 获取工资数据API

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

// 查询用户信息获取工号
async function getUserEmployeeId(token, username) {
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
      return data.data.items[0].fields['工号'];
    }
    return null;
  } catch (error) {
    console.error('查询用户工号失败:', error);
    return null;
  }
}

// 查询工资数据
async function querySalaries(token, employeeId, month) {
  try {
    const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${feishuConfig.APP_TOKEN}/tables/${feishuConfig.SALARY_TABLE_ID}/records/search`;
    
    const conditions = [{
      field_name: '工号',
      operator: 'is',
      value: [employeeId]
    }];
    
    // 如果指定了月份，添加月份过滤条件
    if (month) {
      conditions.push({
        field_name: '年月',
        operator: 'is',
        value: [month]
      });
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filter: {
          conjunction: 'and',
          conditions: conditions
        },
        sort: [{
          field_name: '年月',
          desc: true
        }]
      })
    });
    
    const data = await response.json();
    if (data.code === 0) {
      return data.data.items.map(item => ({
        month: item.fields['年月'],
        basicSalary: item.fields['基本工资'] || 0,
        performanceBonus: item.fields['绩效奖金'] || 0,
        allowance: item.fields['津贴补助'] || 0,
        deduction: item.fields['扣除项目'] || 0,
        netSalary: item.fields['实发工资'] || 0
      }));
    }
    return [];
  } catch (error) {
    console.error('查询工资数据失败:', error);
    return [];
  }
}

// 获取工资数据主函数
async function getSalaries(username, month, token) {
  try {
    // 先获取用户的工号
    const employeeId = await getUserEmployeeId(token, username);
    if (!employeeId) {
      return { success: false, error: '用户不存在或工号未找到' };
    }
    
    // 查询工资数据
    const salaries = await querySalaries(token, employeeId, month);
    
    return {
      success: true,
      data: salaries
    };
  } catch (error) {
    console.error('获取工资数据失败:', error);
    return { success: false, error: '获取工资数据失败' };
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
    const { username, month } = req.body;
    
    if (!username) {
      return res.status(400).json({ success: false, error: '用户名不能为空' });
    }
    
    // 获取飞书访问令牌
    const token = await getTenantAccessToken();
    if (!token) {
      return res.status(500).json({ success: false, error: '获取飞书凭证失败' });
    }
    
    // 获取工资数据
    const result = await getSalaries(username, month, token);
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('获取工资API错误:', error);
    return res.status(500).json({ success: false, error: '服务器内部错误' });
  }
}