/**
 * 飞书API连接测试脚本
 * 用于验证飞书API配置是否正确
 */

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
    console.log('🔑 正在获取飞书访问令牌...');
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
    console.log('📋 访问令牌响应:', JSON.stringify(data, null, 2));
    
    if (data.code === 0) {
      console.log('✅ 访问令牌获取成功!');
      return data.tenant_access_token;
    }
    console.log('❌ 获取访问令牌失败:', data.msg);
    return null;
  } catch (error) {
    console.error('❌ 获取飞书访问令牌失败:', error);
    return null;
  }
}

// 测试多维表格应用访问
async function testBitableApp(token) {
  try {
    console.log('\n📊 正在测试多维表格应用访问...');
    const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${feishuConfig.APP_TOKEN}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('📋 多维表格应用响应:', JSON.stringify(data, null, 2));
    
    if (data.code === 0) {
      console.log('✅ 多维表格应用访问成功!');
      return true;
    }
    console.log('❌ 多维表格应用访问失败:', data.msg);
    return false;
  } catch (error) {
    console.error('❌ 多维表格应用访问异常:', error);
    return false;
  }
}

// 测试用户表访问
async function testUserTable(token) {
  try {
    console.log('\n👥 正在测试用户表访问...');
    const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${feishuConfig.APP_TOKEN}/tables/${feishuConfig.USER_TABLE_ID}/records`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('📋 用户表响应:', JSON.stringify(data, null, 2));
    
    if (data.code === 0) {
      console.log('✅ 用户表访问成功!');
      console.log(`📊 用户表记录数: ${data.data.items.length}`);
      return true;
    }
    console.log('❌ 用户表访问失败:', data.msg);
    return false;
  } catch (error) {
    console.error('❌ 用户表访问异常:', error);
    return false;
  }
}

// 测试搜索功能
async function testUserSearch(token) {
  try {
    console.log('\n🔍 正在测试用户搜索功能...');
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
            value: ['test']
          }]
        }
      })
    });
    
    const data = await response.json();
    console.log('📋 搜索响应:', JSON.stringify(data, null, 2));
    
    if (data.code === 0) {
      console.log('✅ 搜索功能正常!');
      console.log(`🔍 搜索结果数: ${data.data.items.length}`);
      return true;
    }
    console.log('❌ 搜索功能失败:', data.msg);
    return false;
  } catch (error) {
    console.error('❌ 搜索功能异常:', error);
    return false;
  }
}

// 主测试函数
async function runTests() {
  console.log('🚀 开始飞书API连接测试...');
  console.log('📋 配置信息:');
  console.log(`   APP_ID: ${feishuConfig.APP_ID}`);
  console.log(`   APP_SECRET: ${feishuConfig.APP_SECRET.substring(0, 8)}...`);
  console.log(`   APP_TOKEN: ${feishuConfig.APP_TOKEN}`);
  console.log(`   USER_TABLE_ID: ${feishuConfig.USER_TABLE_ID}`);
  console.log(`   SALARY_TABLE_ID: ${feishuConfig.SALARY_TABLE_ID}`);
  
  // 1. 获取访问令牌
  const token = await getTenantAccessToken();
  if (!token) {
    console.log('\n❌ 测试失败: 无法获取访问令牌');
    return;
  }
  
  // 2. 测试多维表格应用访问
  const appAccess = await testBitableApp(token);
  
  // 3. 测试用户表访问
  const userTableAccess = await testUserTable(token);
  
  // 4. 测试搜索功能
  const searchAccess = await testUserSearch(token);
  
  // 总结
  console.log('\n📊 测试结果总结:');
  console.log(`   访问令牌: ${token ? '✅' : '❌'}`);
  console.log(`   多维表格应用: ${appAccess ? '✅' : '❌'}`);
  console.log(`   用户表访问: ${userTableAccess ? '✅' : '❌'}`);
  console.log(`   搜索功能: ${searchAccess ? '✅' : '❌'}`);
  
  if (token && appAccess && userTableAccess && searchAccess) {
    console.log('\n🎉 所有测试通过! 飞书API配置正确，可以正常使用。');
  } else {
    console.log('\n⚠️  部分测试失败，请检查飞书应用权限配置。');
    console.log('\n📖 解决方案:');
    console.log('   1. 访问飞书开放平台: https://open.feishu.cn/app/cli_a8d0a9945631d013/auth');
    console.log('   2. 开通以下权限:');
    console.log('      - bitable:app:readonly (多维表格应用只读)');
    console.log('      - bitable:app (多维表格应用读写)');
    console.log('      - base:app:read (基础应用读取)');
    console.log('      - base:record:retrieve (基础记录检索)');
    console.log('   3. 等待权限生效后重新测试');
  }
}

// 运行测试
runTests().catch(console.error);