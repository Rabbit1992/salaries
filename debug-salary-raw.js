// 调试工资表原始数据结构的脚本
// 运行命令: node debug-salary-raw.js

const feishuConfig = {
  APP_ID: 'cli_a8d0a9945631d013',
  APP_SECRET: 'Y9Js8PdijoLrfNpmRGdFXfdM7BNWRkvd',
  APP_TOKEN: 'KvyUbXEBpaQVcbsYQcIc3oDnnKc',
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

// 查询工资表的原始数据
async function debugSalaryRawData() {
  console.log('🔍 开始调试工资表原始数据结构...');
  
  const token = await getTenantAccessToken();
  if (!token) {
    console.log('❌ 无法获取访问令牌');
    return;
  }
  
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
    console.log('📊 工资表查询响应:', JSON.stringify(data, null, 2));
    
    if (data.code === 0 && data.data.items.length > 0) {
      console.log('\n🔍 第一条工资记录的详细结构:');
      const firstRecord = data.data.items[0];
      console.log('完整记录:', JSON.stringify(firstRecord, null, 2));
      
      console.log('\n📋 字段详细分析:');
      Object.keys(firstRecord.fields).forEach(fieldName => {
        const fieldValue = firstRecord.fields[fieldName];
        console.log(`${fieldName}:`, JSON.stringify(fieldValue, null, 2));
        
        if (Array.isArray(fieldValue) && fieldValue.length > 0) {
          console.log(`  - 数组长度: ${fieldValue.length}`);
          console.log(`  - 第一个元素类型: ${typeof fieldValue[0]}`);
          console.log(`  - 第一个元素内容:`, fieldValue[0]);
          
          if (fieldValue[0] && typeof fieldValue[0] === 'object') {
            console.log(`  - 对象属性:`, Object.keys(fieldValue[0]));
            if (fieldValue[0].text !== undefined) {
              console.log(`  - text值: "${fieldValue[0].text}"`);
            }
            if (fieldValue[0].value !== undefined) {
              console.log(`  - value值: "${fieldValue[0].value}"`);
            }
          }
        }
        console.log('---');
      });
    } else {
      console.log('❌ 未找到工资记录或查询失败');
    }
  } catch (error) {
    console.error('调试工资数据失败:', error);
  }
}

// 运行调试
debugSalaryRawData();