<<<<<<< HEAD
# 工资查询系统

基于飞书多维表格 + Vercel的静态工资查询系统，采用无服务器架构设计。

## 系统特性

- 🔐 **安全登录**: 用户名密码验证
- 📊 **工资查询**: 按月份筛选查询工资详情
- 🌐 **无服务器**: 使用Google Apps Script作为后端
- 📱 **响应式设计**: 支持桌面和移动设备
- ⚡ **快速部署**: 前端部署到Vercel，后端使用Google Script

## 技术栈

- **前端**: HTML5/CSS3/JavaScript(ES6+)
- **后端**: Google Apps Script
- **数据库**: 飞书多维表格
- **部署**: Vercel（前端）+ Google Script（后端）

## 项目结构

```
/
├── public/
│   ├── index.html       # 登录页面
│   ├── salary.html      # 工资查询页面
│   ├── scripts/
│   │   ├── auth.js      # 前端登录逻辑
│   │   └── salary.js    # 前端查询逻辑
│   └── styles/
│       └── main.css     # 共用样式文件
├── google-apps-script.js # Google Apps Script后端代码
├── vercel.json          # Vercel部署配置
├── package.json         # 项目配置
├── deploy.md            # 详细部署指南
├── deploy.bat           # Windows部署脚本
└── README.md            # 项目说明文档
```

## 部署指南

### 第一步：设置飞书多维表格

1. 创建一个新的飞书多维表格
2. 创建两个数据表：

#### 用户表 (users)
| 字段名 | 类型 | 说明 |
|------|------|------|
| username | 文本 | 用户名（主键） |
| password | 文本 | 密码（建议存储哈希值） |
| department | 文本 | 部门信息 |
| employee_id | 数字 | 员工编号 |

#### 工资表 (salaries)
| 字段名 | 类型 | 说明 |
|------|------|------|
| username | 文本 | 关联用户名 |
| month | 文本 | 月份（格式：YYYY-MM） |
| base_salary | 数字 | 基础工资 |
| bonus | 数字 | 奖金 |
| deduction | 数字 | 扣除项 |
| net_salary | 数字 | 实发工资 |

### 第二步：部署Google Apps Script后端

1. 创建一个新的Google Apps Script项目

2. 将 `google-apps-script.js` 文件内容复制到 `Code.gs` 中

3. 在脚本中配置飞书多维表格的凭证：
   - `APP_ID`: 你的飞书应用ID
   - `APP_SECRET`: 你的飞书应用密钥
   - `APP_TOKEN`: 你的飞书多维表格App Token
   - `USER_TABLE_ID`: 你的用户表ID
   - `SALARY_TABLE_ID`: 你的工资表ID

4. 部署为Web应用：
   - 点击 `部署` > `新建部署`
   - 选择类型：`Web应用`
   - 执行身份：`以我身份执行`
   - 访问权限：`任何人`
   - 点击 `部署`

5. 复制部署URL（类似：`https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec`）

### 第三步：配置环境变量

在Vercel部署时，需要配置以下环境变量：

```
FEISHU_APP_ID=your_app_id
FEISHU_APP_SECRET=your_app_secret
FEISHU_APP_TOKEN=your_app_token
FEISHU_USER_TABLE_ID=your_user_table_id
FEISHU_SALARY_TABLE_ID=your_salary_table_id
```

### 第四步：部署到Vercel

1. 将项目代码推送到GitHub仓库

2. 在Vercel中导入项目：
   - 访问 [vercel.com](https://vercel.com)
   - 点击 `New Project`
   - 导入您的GitHub仓库

3. 配置构建设置：
   - Framework Preset: `Other`
   - Build Command: 留空
   - Output Directory: `public`
   - Install Command: 留空

4. 点击 `Deploy` 完成部署

## 使用说明

### 演示账户

系统提供了以下演示账户（如果使用了示例数据）：

| 用户名 | 密码 | 部门 |
|--------|------|------|
| admin | 123456 | 管理部 |
| zhang.san | 123456 | 技术部 |
| li.si | 123456 | 销售部 |
| wang.wu | 123456 | 财务部 |

### 功能说明

1. **登录系统**
   - 输入用户名和密码
   - 系统验证后跳转到工资查询页面

2. **查询工资**
   - 选择要查询的月份
   - 点击查询按钮或直接选择月份自动查询
   - 查看工资详情表格

3. **退出登录**
   - 点击右上角的退出登录按钮
   - 返回登录页面

## 安全配置

### Google Apps Script安全设置

1. **执行权限**：设置为"以我身份执行"
2. **访问权限**：根据需求设置为"任何人"或"仅限组织内部"
3. **CORS支持**：代码中已包含跨域访问头

### 数据安全建议

1. **密码安全**：
   - 生产环境中应使用密码哈希存储
   - 考虑实现密码复杂度要求

2. **访问控制**：
   - 定期更新密码
   - 监控异常访问

3. **数据备份**：
   - 定期备份飞书多维表格数据
   - 设置适当的共享权限

## 开发和测试

### 本地开发

由于使用了Google Apps Script作为后端，前端可以直接在浏览器中打开HTML文件进行测试。系统包含了模拟数据功能，在未配置Google Apps Script URL时会自动使用模拟数据。

### 测试用例

1. **登录测试**
   - 测试正确的用户名密码
   - 测试错误的用户名密码
   - 测试空输入处理

2. **查询测试**
   - 测试有数据的月份查询
   - 测试无数据的月份查询
   - 测试网络错误处理

3. **响应式测试**
   - 测试桌面浏览器显示
   - 测试移动设备显示

## 故障排除

### 常见问题

1. **登录失败**
   - 检查Google Apps Script URL是否正确配置
   - 确认飞书多维表格中的用户数据格式正确
   - 检查网络连接和飞书API凭证是否正确

2. **查询无结果**
   - 确认工资表中有对应用户和月份的数据
   - 检查月份格式是否为YYYY-MM
   - 确认数据表ID配置正确

3. **部署问题**
   - 确认Google Apps Script权限设置正确
   - 检查Vercel构建配置
   - 确认所有文件路径正确

### 调试方法

1. **前端调试**
   - 打开浏览器开发者工具
   - 查看Console面板的错误信息
   - 检查Network面板的API请求

2. **后端调试**
   - 在Google Apps Script编辑器中查看执行日志
   - 使用 `console.log()` 添加调试信息

## 扩展功能

### 可能的改进方向

1. **功能增强**
   - 添加工资统计图表
   - 实现工资历史对比
   - 添加导出功能

2. **安全增强**
   - 实现JWT令牌认证
   - 添加密码加密
   - 实现会话超时

3. **用户体验**
   - 添加加载动画
   - 实现数据缓存
   - 优化移动端体验

## 许可证

本项目仅供学习和参考使用。在生产环境中使用前，请确保遵循相关的安全和隐私规范。

## 支持

如果您在使用过程中遇到问题，请检查：
1. Google Apps Script的部署状态
2. 飞书多维表格的数据格式和凭证
3. 网络连接状况
4. 浏览器控制台的错误信息
