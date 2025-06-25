// 飞书API连接测试脚本
// 运行命令: node test-feishu-api.js

const feishuConfig = {
  APP_ID: 'cli_a8d0a9945631d013',
  APP_SECRET: 'Y9Js8PdijoLrfNpmRGdFXfdM7BNWRkvd',
  APP_TOKEN: 'KvyUbXEBpaQVcbsYQcIc3oDnnKc',
  USER_TABLE_ID: 'tblUwpIiulO5QfS4',
  SALARY_TABLE_ID: 'tblhjBxxfDbEx1Kt'
};

// 获取飞书租户访问令牌
async function getTenantAccessToken() {
  console.log('🔑 正在获取飞书访问令牌...');
  
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
    console.log('📋 访问令牌响应:', data);
    
    if (data.code === 0) {
      console.log('✅ 访问令牌获取成功!');
      return data.tenant_access_token;
    } else {
      console.log('❌ 访问令牌获取失败:', data.msg);
      return null;
    }
  } catch (error) {
    console.error('❌ 网络请求失败:', error.message);
    return null;
  }
}

// 测试多维表格应用信息
async function testAppInfo(token) {
  console.log('\n📊 正在测试多维表格应用信息...');
  
  try {
    const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${feishuConfig.APP_TOKEN}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('📋 应用信息响应:', data);
    
    if (data.code === 0) {
      console.log('✅ 多维表格应用访问成功!');
      console.log(`📝 应用名称: ${data.data.app.name}`);
      console.log(`🆔 应用ID: ${data.data.app.app_id}`);
      return true;
    } else {
      console.log('❌ 多维表格应用访问失败:', data.msg);
      return false;
    }
  } catch (error) {
    console.error('❌ 应用信息请求失败:', error.message);
    return false;
  }
}

// 测试用户表访问
async function testUserTable(token) {
  console.log('\n👥 正在测试用户表访问...');
  
  try {
    const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${feishuConfig.APP_TOKEN}/tables/${feishuConfig.USER_TABLE_ID}/records`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('📋 用户表响应:', data);
    
    if (data.code === 0) {
      console.log('✅ 用户表访问成功!');
      console.log(`📊 用户表记录数: ${data.data.items.length}`);
      
      if (data.data.items.length > 0) {
        console.log('📝 第一条用户记录字段:', Object.keys(data.data.items[0].fields));
        console.log('📄 第一条用户记录内容:', data.data.items[0].fields);
      }
      return true;
    } else {
      console.log('❌ 用户表访问失败:', data.msg);
      return false;
    }
  } catch (error) {
    console.error('❌ 用户表请求失败:', error.message);
    return false;
  }
}

// 测试工资表访问
async function testSalaryTable(token) {
  console.log('\n💰 正在测试工资表访问...');
  
  try {
    const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${feishuConfig.APP_TOKEN}/tables/${feishuConfig.SALARY_TABLE_ID}/records`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('📋 工资表响应:', data);
    
    if (data.code === 0) {
      console.log('✅ 工资表访问成功!');
      console.log(`📊 工资表记录数: ${data.data.items.length}`);
      
      if (data.data.items.length > 0) {
        console.log('📝 第一条工资记录字段:', Object.keys(data.data.items[0].fields));
      }
      return true;
    } else {
      console.log('❌ 工资表访问失败:', data.msg);
      return false;
    }
  } catch (error) {
    console.error('❌ 工资表请求失败:', error.message);
    return false;
  }
}

// 测试搜索功能
async function testSearch(token) {
  console.log('\n🔍 正在测试搜索功能...');
  
  try {
    const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${feishuConfig.APP_TOKEN}/tables/${feishuConfig.USER_TABLE_ID}/records/search`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        page_size: 1
      })
    });
    
    const data = await response.json();
    console.log('📋 搜索响应:', data);
    
    if (data.code === 0) {
      console.log('✅ 搜索功能正常!');
      return true;
    } else {
      console.log('❌ 搜索功能失败:', data.msg);
      return false;
    }
  } catch (error) {
    console.error('❌ 搜索请求失败:', error.message);
    return false;
  }
}

// 主测试函数
async function runTests() {
  console.log('🚀 开始飞书API连接测试\n');
  console.log('📋 配置信息:');
  console.log(`   APP_ID: ${feishuConfig.APP_ID}`);
  console.log(`   APP_SECRET: ${feishuConfig.APP_SECRET.substring(0, 8)}...`);
  console.log(`   APP_TOKEN: ${feishuConfig.APP_TOKEN}`);
  console.log(`   USER_TABLE_ID: ${feishuConfig.USER_TABLE_ID}`);
  console.log(`   SALARY_TABLE_ID: ${feishuConfig.SALARY_TABLE_ID}\n`);
  
  let allTestsPassed = true;
  
  // 1. 测试访问令牌
  const token = await getTenantAccessToken();
  if (!token) {
    console.log('\n❌ 测试失败: 无法获取访问令牌');
    return;
  }
  
  // 2. 测试应用信息
  const appInfoSuccess = await testAppInfo(token);
  if (!appInfoSuccess) allTestsPassed = false;
  
  // 3. 测试用户表
  const userTableSuccess = await testUserTable(token);
  if (!userTableSuccess) allTestsPassed = false;
  
  // 4. 测试工资表
  const salaryTableSuccess = await testSalaryTable(token);
  if (!salaryTableSuccess) allTestsPassed = false;
  
  // 5. 测试搜索功能
  const searchSuccess = await testSearch(token);
  if (!searchSuccess) allTestsPassed = false;
  
  // 测试结果总结
  console.log('\n' + '='.repeat(50));
  if (allTestsPassed) {
    console.log('🎉 所有测试通过! 飞书API配置正确，可以正常使用。');
  } else {
    console.log('⚠️  部分测试失败，请检查配置和权限设置。');
  }
  console.log('='.repeat(50));
}

// 运行测试
runTests().catch(error => {
  console.error('💥 测试过程中发生错误:', error);
});