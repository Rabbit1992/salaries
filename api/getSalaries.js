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
      // 飞书字段值是对象数组格式，需要提取text属性
      return data.data.items[0].fields['工号'][0]?.text;
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
      return data.data.items.map(item => {
        // 处理不同字段的数据格式
        const getFieldValue = (field) => {
          if (Array.isArray(field) && field.length > 0) {
            return field[0]?.text || field[0];
          }
          return field;
        };
        
        return {
          month: getFieldValue(item.fields['年月']),
          // 基础工资部分
          baseSalary: parseFloat(getFieldValue(item.fields['底薪'])) || 0,
          positionSalary: parseFloat(getFieldValue(item.fields['岗位工资'])) || 0,
          subtotal: parseFloat(getFieldValue(item.fields['小计'])) || 0,
          
          // 绩效部分
          basicPerformance: parseFloat(getFieldValue(item.fields['基础性绩效'])) || 0,
          rewardPerformance: parseFloat(getFieldValue(item.fields['奖励性绩效'])) || 0,
          totalAmount: parseFloat(getFieldValue(item.fields['总额'])) || 0,
          performancePenalty: parseFloat(getFieldValue(item.fields['绩效奖惩'])) || 0,
          
          // 协管员津贴部分
          assistantAttendanceBonus: parseFloat(getFieldValue(item.fields['协管员全勤奖'])) || 0,
          assistantPositionAllowance: parseFloat(getFieldValue(item.fields['协管员岗位津贴'])) || 0,
          assistantSkillAllowance: parseFloat(getFieldValue(item.fields['协管员职务（技能）津贴'])) || 0,
          assistantRetentionSubsidy: parseFloat(getFieldValue(item.fields['协管员保留补贴'])) || 0,
          
          // 其他项目
          other: parseFloat(getFieldValue(item.fields['其他'])) || 0,
          deduction: parseFloat(getFieldValue(item.fields['扣款'])) || 0,
          grossTotal: parseFloat(getFieldValue(item.fields['应发合计'])) || 0,
          
          // 社保公积金基数
          socialInsuranceBase: parseFloat(getFieldValue(item.fields['社保缴费基数'])) || 0,
          housingFundBase: parseFloat(getFieldValue(item.fields['公积金缴费基数'])) || 0,
          
          // 个人缴费
          personalSocialInsurance: parseFloat(getFieldValue(item.fields['个人社保'])) || 0,
          personalHousingFund: parseFloat(getFieldValue(item.fields['个人公积金'])) || 0,
          
          // 税务相关
          pretaxSubtotal: parseFloat(getFieldValue(item.fields['税前小计'])) || 0,
          personalIncomeTax: parseFloat(getFieldValue(item.fields['个人所得税'])) || 0,
          supplementaryTax: parseFloat(getFieldValue(item.fields['补扣个税'])) || 0,
          
          // 最终实发
          netSalary: parseFloat(getFieldValue(item.fields['个人实发合计'])) || 0
        };
      });
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
      salaries: salaries
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