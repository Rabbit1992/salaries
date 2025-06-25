// 专门用于调试用户表字段结构的脚本
// 运行命令: node debug-user-fields.js

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

// 查看用户表字段结构
async function debugUserFields() {
  console.log('🔍 正在查看用户表字段结构...');
  
  const token = await getTenantAccessToken();
  if (!token) {
    console.log('❌ 无法获取访问令牌');
    return;
  }
  
  try {
    const url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${feishuConfig.APP_TOKEN}/tables/${feishuConfig.USER_TABLE_ID}/records?page_size=1`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.code === 0 && data.data.items.length > 0) {
      const firstRecord = data.data.items[0];
      console.log('✅ 用户表字段结构:');
      console.log('字段名称:', Object.keys(firstRecord.fields));
      console.log('\n📄 第一条记录内容:');
      
      // 逐个显示字段内容
      for (const [fieldName, fieldValue] of Object.entries(firstRecord.fields)) {
        console.log(`  ${fieldName}: ${fieldValue}`);
      }
      
    } else {
      console.log('❌ 无法获取用户表数据:', data.msg || '表格为空');
    }
  } catch (error) {
    console.error('❌ 请求失败:', error.message);
  }
}

// 运行调试
debugUserFields();