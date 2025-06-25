// 测试工资查询功能的脚本
// 运行命令: node test-salary-query.js

const feishuConfig = {
  APP_ID: 'cli_a8d0a9945631d013',
  APP_SECRET: 'Y9Js8PdijoLrfNpmRGdFXfdM7BNWRkvd',
  APP_TOKEN: 'KvyUbXEBpaQVcbsYQcIc3oDnnKc',
  USER_TABLE_ID: 'tblUwpIiulO5QfS4',
  SALARY_TABLE_ID: 'tblhjBxxfDbEx1Kt'
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
    console.log('🔍 工资查询响应:', data);
    
    if (data.code === 0) {
      const salaries = data.data.items.map(item => {
        // 处理不同字段的数据格式
        const getFieldValue = (field) => {
          if (Array.isArray(field) && field.length > 0) {
            return field[0]?.text || field[0];
          }
          return field;
        };
        
        return {
          month: getFieldValue(item.fields['年月']),
          basicSalary: parseFloat(getFieldValue(item.fields['基本工资'])) || 0,
          performanceBonus: parseFloat(getFieldValue(item.fields['绩效奖金'])) || 0,
          allowance: parseFloat(getFieldValue(item.fields['津贴补助'])) || 0,
          deduction: parseFloat(getFieldValue(item.fields['扣除项目'])) || 0,
          netSalary: parseFloat(getFieldValue(item.fields['实发工资'])) || 0
        };
      });
      
      console.log('📊 处理后的工资数据:', salaries);
      return salaries;
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
    
    console.log(`👤 用户 ${username} 的工号: ${employeeId}`);
    
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

// 测试工资查询功能
async function testSalaryQuery() {
  console.log('🧪 开始测试工资查询功能...');
  
  const token = await getTenantAccessToken();
  if (!token) {
    console.log('❌ 无法获取访问令牌');
    return;
  }
  
  const testUsername = 'lijing';
  
  // 测试1: 查询所有月份的工资
  console.log('\n📅 测试1: 查询所有月份的工资');
  const allResult = await getSalaries(testUsername, null, token);
  if (allResult.success) {
    console.log('✅ 查询成功!');
    console.log(`📊 找到 ${allResult.salaries.length} 条工资记录`);
    allResult.salaries.forEach(salary => {
      console.log(`  ${salary.month}: 基本工资¥${salary.basicSalary}, 实发工资¥${salary.netSalary}`);
    });
  } else {
    console.log('❌ 查询失败:', allResult.error);
  }
  
  // 测试2: 查询特定月份的工资
  console.log('\n📅 测试2: 查询2025-03月份的工资');
  const monthResult = await getSalaries(testUsername, '2025-03', token);
  if (monthResult.success) {
    console.log('✅ 查询成功!');
    console.log(`📊 找到 ${monthResult.salaries.length} 条工资记录`);
    monthResult.salaries.forEach(salary => {
      console.log(`  ${salary.month}: 基本工资¥${salary.basicSalary}, 实发工资¥${salary.netSalary}`);
    });
  } else {
    console.log('❌ 查询失败:', monthResult.error);
  }
  
  // 测试3: 查询不存在的月份
  console.log('\n📅 测试3: 查询不存在的月份2024-01');
  const noDataResult = await getSalaries(testUsername, '2024-01', token);
  if (noDataResult.success) {
    console.log('✅ 查询成功!');
    console.log(`📊 找到 ${noDataResult.salaries.length} 条工资记录`);
    if (noDataResult.salaries.length === 0) {
      console.log('  ℹ️ 该月份无工资数据');
    }
  } else {
    console.log('❌ 查询失败:', noDataResult.error);
  }
}

// 运行测试
testSalaryQuery();