/**
 * Google Apps Script 后端代码
 * 部署说明：
 * 1. 在Google Sheets中打开脚本编辑器（扩展程序 > Apps Script）
 * 2. 将此代码复制到Code.gs文件中
 * 3. 保存并部署为Web应用
 * 4. 设置执行权限为"以我身份执行"
 * 5. 设置访问权限为"任何人"
 * 6. 复制部署URL到前端代码中的SCRIPT_URL变量
 */

/**
 * Google Apps Script Web应用的主入口函数
 * 功能：处理来自前端的HTTP GET请求，根据action参数分发到不同的处理函数
 * 支持的操作：
 *   - login: 用户登录验证
 *   - getSalaries: 获取工资数据
 * @param {Object} e - Google Apps Script提供的请求事件对象，包含URL参数
 * @returns {ContentService} 返回JSON格式的HTTP响应
 */
function doPost(e) {
  try {
    const requestData = JSON.parse(e.postData.contents);
    e.parameter = requestData;
    return handleRequest(e);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Invalid POST data' })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  // 验证请求参数的有效性，确保e对象和parameter属性存在
  if (!e || !e.parameter) {
    const errorResponse = {
      success: false,
      error: '请求参数无效'
    };
    // 返回标准的JSON错误响应
    return ContentService
      .createTextOutput(JSON.stringify(errorResponse))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  // 从URL参数中获取操作类型
  const action = e.parameter.action;
  let response = {};
  
  try {
    // 获取当前Google Sheets电子表格的引用
    // 注意：此脚本必须绑定到包含用户和工资数据的电子表格
    const sheet = SpreadsheetApp.getActiveSpreadsheet();
    
    // 根据action参数分发到相应的处理函数
    switch(action) {
      case 'login':
        // 处理用户登录验证请求
        response = loginUser(e, sheet);
        break;
      case 'getSalaries':
        // 处理工资数据查询请求
        response = handleGetSalaries(e, sheet);
        break;
      default:
        // 未知的操作类型
        response = {
          success: false,
          error: '无效的操作类型'
        };
    }
    
  } catch(error) {
    console.error('处理请求时发生错误:', error);
    response = {
      success: false,
      error: error.message || '服务器内部错误'
    };
  }
  
  // 返回JSON响应
  const output = ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
  output.addHeader('Access-Control-Allow-Origin', 'https://salaries-chi.vercel.app');
  return output;
}

/**
 * 处理OPTIONS请求（CORS预检）
 * 功能：为跨域请求提供支持
 * 设置必要的CORS头部以允许跨域访问
 */
function doOptions(e) {
  const response = ContentService.createTextOutput('');
  response.withHeaders({
    'Access-Control-Allow-Origin': 'https://salaries-chi.vercel.app',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400' // 缓存预检请求24小时
  });
  return response;
}

/**
 * 用户登录验证函数
 * 功能：验证用户提供的用户名和密码，支持模拟数据和Google Sheets数据源
 * 验证流程：
 *   1. 参数验证
 *   2. 首先尝试模拟数据验证（用于演示和测试）
 *   3. 如果模拟数据中未找到，则查询Google Sheets中的users工作表
 * @param {Object} e - 包含username和password参数的请求对象
 * @param {Spreadsheet} sheet - Google Sheets电子表格对象
 * @returns {Object} 包含success状态和用户信息或错误信息的响应对象
 */
function loginUser(e, sheet) {
  const username = e.parameter.username;
  const password = e.parameter.password;
  
  // 验证必需参数是否存在
  if (!username || !password) {
    return {
      success: false,
      error: '用户名和密码不能为空'
    };
  }
  
  try {
    console.log(`开始验证用户登录: ${username}`);
    
    // 第一步：使用预定义的模拟数据进行验证
    // 这些模拟用户用于演示和测试，无需依赖Google Sheets数据
    const mockUsers = [
      { username: 'admin', password: '123456', department: '管理部', employee_id: 1001 },
      { username: 'zhang.san', password: '123456', department: '技术部', employee_id: 1002 },
      { username: 'li.si', password: '123456', department: '销售部', employee_id: 1003 },
      { username: 'wang.wu', password: '123456', department: '财务部', employee_id: 1004 }
    ];
    
    // 在模拟用户数据中查找匹配的用户名和密码
    const user = mockUsers.find(u => u.username === username && u.password === password);
    
    // 如果在模拟数据中找到匹配用户，直接返回成功结果
    if (user) {
      console.log(`模拟数据验证成功: ${user.username}`);
      return {
        success: true,
        user: {
          username: user.username,
          department: user.department,
          employee_id: user.employee_id
        }
      };
    }
    
    // 第二步：如果模拟数据中未找到匹配用户，则查询Google Sheets中的users工作表
    console.log('模拟数据中未找到用户，开始查询Google Sheets...');
    try {
      // 获取名为"users"的工作表
      // 注意：工作表名称必须严格为"users"（小写）
      const usersSheet = sheet.getSheetByName('users');
      if (!usersSheet) {
        console.error('用户表不存在，请检查工作表名称是否为"users"');
        return {
          success: false,
          error: '用户表不存在，请检查工作表名称是否为"users"'
        };
      }
      
      // 读取工作表中的所有数据
      const usersData = usersSheet.getDataRange().getValues();
      console.log('用户表数据行数:', usersData.length);
      console.log('用户表标题行:', usersData[0]);
      
      // 遍历用户数据，跳过第一行（标题行）
      // 预期的列结构：A列=username, B列=password, C列=department, D列=employee_id
      for (let i = 1; i < usersData.length; i++) {
        const row = usersData[i];
        // 从工作表中读取用户数据，并进行字符串转换和空格清理
        const dbUsername = String(row[0]).trim(); // A列：用户名
        const dbPassword = String(row[1]).trim(); // B列：密码
        const department = row[2];                // C列：部门
        const employeeId = row[3];                // D列：员工ID
        
        // 输出调试信息，便于排查登录问题
        console.log(`检查用户 ${i}: 表格用户名='${dbUsername}', 输入用户名='${username}', 表格密码='${dbPassword}', 输入密码='${password}'`);
        
        // 比较用户名和密码是否完全匹配
        if (dbUsername === username && dbPassword === password) {
          console.log('在Google Sheets中找到匹配用户:', dbUsername);
          return {
            success: true,
            user: {
              username: dbUsername,
              department: department,
              employee_id: employeeId
            }
          };
        }
      }
      
      // 遍历完所有用户数据后仍未找到匹配用户
      console.log('在Google Sheets中未找到匹配的用户');
    } catch (sheetError) {
      // 处理Google Sheets访问错误
      console.error('工作表查询错误:', sheetError);
      return {
        success: false,
        error: '工作表查询错误: ' + sheetError.message
      };
    }
    
    // 用户名或密码错误
    return {
      success: false,
      error: '用户名或密码错误'
    };
    
  } catch (error) {
    console.error('登录验证错误:', error);
    return {
      success: false,
      error: '登录验证失败: ' + error.message
    };
  }
}

/**
 * 获取员工工资信息
 * @param {Object} e - 请求参数
 * @param {Spreadsheet} sheet - 电子表格对象
 * @returns {Object} 工资查询结果
 */
function handleGetSalaries(e, sheet) {
  const username = e.parameter.username;
  const month = e.parameter.month;
  
  // 参数验证
  if (!username) {
    return {
      success: false,
      error: '用户名不能为空'
    };
  }
  
  try {
    // 使用模拟数据进行工资查询（临时解决方案）
    // 模拟工资数据
    const mockSalaries = [
      // admin的工资数据
      { username: 'admin', month: '2024-01', base_salary: 15000, bonus: 3000, deductions: 1500, net_salary: 16500 },
      { username: 'admin', month: '2024-02', base_salary: 15000, bonus: 2500, deductions: 1500, net_salary: 16000 },
      { username: 'admin', month: '2024-03', base_salary: 15000, bonus: 3500, deductions: 1500, net_salary: 17000 },
      
      // zhang.san的工资数据
      { username: 'zhang.san', month: '2024-01', base_salary: 12000, bonus: 2000, deductions: 1200, net_salary: 12800 },
      { username: 'zhang.san', month: '2024-02', base_salary: 12000, bonus: 1800, deductions: 1200, net_salary: 12600 },
      { username: 'zhang.san', month: '2024-03', base_salary: 12000, bonus: 2200, deductions: 1200, net_salary: 13000 },
      
      // li.si的工资数据
      { username: 'li.si', month: '2024-01', base_salary: 10000, bonus: 1500, deductions: 1000, net_salary: 10500 },
      { username: 'li.si', month: '2024-02', base_salary: 10000, bonus: 1200, deductions: 1000, net_salary: 10200 },
      { username: 'li.si', month: '2024-03', base_salary: 10000, bonus: 1800, deductions: 1000, net_salary: 10800 },
      
      // wang.wu的工资数据
      { username: 'wang.wu', month: '2024-01', base_salary: 11000, bonus: 1800, deductions: 1100, net_salary: 11700 },
      { username: 'wang.wu', month: '2024-02', base_salary: 11000, bonus: 1600, deductions: 1100, net_salary: 11500 },
      { username: 'wang.wu', month: '2024-03', base_salary: 11000, bonus: 2000, deductions: 1100, net_salary: 11900 }
    ];
    
    // 从模拟数据中查找匹配的工资记录
    let salaries = mockSalaries.filter(salary => salary.username === username);
    
    // 如果指定了月份，则只返回该月份的数据
    if (month) {
      salaries = salaries.filter(salary => salary.month === month);
    }
    
    // 如果模拟数据中没有找到，尝试从工作表中查找
    if (salaries.length === 0) {
      try {
        // 获取工资表数据
        const salariesSheet = sheet.getSheetByName('salaries');
        if (!salariesSheet) {
          throw new Error('工资表不存在，请检查工作表名称是否为"salaries"');
        }
        
        const salariesData = salariesSheet.getDataRange().getValues();
        
        // 跳过标题行，从第二行开始查找
        for (let i = 1; i < salariesData.length; i++) {
          const row = salariesData[i];
          const dbUsername = row[0]; // A列：username
          const dbMonth = row[1]; // B列：month
          const baseSalary = row[2]; // C列：base_salary
          const bonus = row[3]; // D列：bonus
          const deductions = row[4]; // E列：deductions
          const netSalary = row[5]; // F列：net_salary
          
          // 匹配用户名
          if (dbUsername === username) {
            // 如果指定了月份，则只返回该月份的数据
            if (month && dbMonth !== month) {
              continue;
            }
            
            salaries.push({
              month: dbMonth,
              base_salary: baseSalary,
              bonus: bonus,
              deductions: deductions,
              net_salary: netSalary
            });
          }
        }
      } catch (sheetError) {
        console.error('工作表查询错误:', sheetError);
        // 如果工作表查询出错，返回空数组
      }
    }
    
    // 移除username字段，只返回工资信息
    const cleanSalaries = salaries.map(salary => ({
      month: salary.month,
      base_salary: salary.base_salary,
      bonus: salary.bonus,
      deductions: salary.deductions,
      net_salary: salary.net_salary
    }));
    
    return {
      success: true,
      salaries: cleanSalaries
    };
    
  } catch (error) {
    console.error('工资查询错误:', error);
    return {
      success: false,
      error: '工资查询失败: ' + error.message
    };
  }
}

/**
 * 初始化示例数据（可选）
 * 运行此函数可以在Google Sheets中创建示例数据
 */
function initializeSampleData() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet();
  
  // 创建用户表
  let usersSheet = sheet.getSheetByName('users');
  if (!usersSheet) {
    usersSheet = sheet.insertSheet('users');
  }
  
  // 设置用户表标题和数据
  const usersData = [
    ['username', 'password', 'department', 'employee_id'],
    ['admin', '123456', '管理部', 1001],
    ['zhang.san', '123456', '技术部', 1002],
    ['li.si', '123456', '销售部', 1003],
    ['wang.wu', '123456', '财务部', 1004]
  ];
  
  usersSheet.clear();
  usersSheet.getRange(1, 1, usersData.length, usersData[0].length).setValues(usersData);
  
  // 创建工资表
  let salariesSheet = sheet.getSheetByName('salaries');
  if (!salariesSheet) {
    salariesSheet = sheet.insertSheet('salaries');
  }
  
  // 设置工资表标题和数据
  const salariesData = [
    ['username', 'month', 'base_salary', 'bonus', 'deduction', 'net_salary'],
    ['admin', '2024-01', 15000, 3000, 1500, '=C2+D2-E2'],
    ['admin', '2024-02', 15000, 2500, 1500, '=C3+D3-E3'],
    ['admin', '2024-03', 15000, 3500, 1500, '=C4+D4-E4'],
    ['zhang.san', '2024-01', 12000, 2000, 1200, '=C5+D5-E5'],
    ['zhang.san', '2024-02', 12000, 1800, 1200, '=C6+D6-E6'],
    ['zhang.san', '2024-03', 12000, 2200, 1200, '=C7+D7-E7'],
    ['li.si', '2024-01', 10000, 1500, 1000, '=C8+D8-E8'],
    ['li.si', '2024-02', 10000, 1200, 1000, '=C9+D9-E9'],
    ['li.si', '2024-03', 10000, 1800, 1000, '=C10+D10-E10'],
    ['wang.wu', '2024-01', 11000, 1800, 1100, '=C11+D11-E11'],
    ['wang.wu', '2024-02', 11000, 1600, 1100, '=C12+D12-E12'],
    ['wang.wu', '2024-03', 11000, 2000, 1100, '=C13+D13-E13']
  ];
  
  salariesSheet.clear();
  salariesSheet.getRange(1, 1, salariesData.length, salariesData[0].length).setValues(salariesData);
  
  // 格式化表格
  formatSheet(usersSheet);
  formatSheet(salariesSheet);
  
  console.log('示例数据初始化完成');
}

/**
 * 格式化工作表样式
 * @param {Sheet} sheet - 工作表对象
 */
function formatSheet(sheet) {
  const range = sheet.getDataRange();
  
  // 设置标题行样式
  const headerRange = sheet.getRange(1, 1, 1, range.getNumColumns());
  headerRange.setBackground('#4285f4');
  headerRange.setFontColor('white');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  
  // 设置数据区域样式
  range.setBorder(true, true, true, true, true, true);
  range.setHorizontalAlignment('center');
  
  // 自动调整列宽
  sheet.autoResizeColumns(1, range.getNumColumns());
}

/**
 * 测试函数 - 验证系统功能
 */
function testSystem() {
  console.log('开始系统测试...');
  
  // 测试登录功能
  const loginTest = loginUser({
    parameter: {
      username: 'admin',
      password: '123456'
    }
  }, SpreadsheetApp.getActiveSpreadsheet());
  
  console.log('登录测试结果:', loginTest);
  
  // 测试工资查询功能
  const salaryTest = getSalaries({
    parameter: {
      username: 'admin',
      month: '2024-01'
    }
  }, SpreadsheetApp.getActiveSpreadsheet());
  
  console.log('工资查询测试结果:', salaryTest);
  
  console.log('系统测试完成');
}