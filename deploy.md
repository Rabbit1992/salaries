git# 部署到Vercel指南

## 前置条件

1. 确保你有一个GitHub账号
2. 确保项目已经推送到GitHub仓库

## 部署步骤

### 方法一：通过Vercel CLI（推荐）

1. **安装Vercel CLI**
```bash
npm install -g vercel
```

2. **登录Vercel**
```bash
vercel login
```

3. **在项目目录下部署**
```bash
vercel
```

4. **按照提示操作**
   - 选择或创建团队
   - 确认项目名称：staff-salary-system
   - 确认项目设置

### 方法二：通过Vercel网站

1. **访问Vercel网站**
   - 前往 [vercel.com](https://vercel.com)
   - 使用GitHub账号登录

2. **导入项目**
   - 点击"New Project"
   - 选择你的GitHub仓库
   - 导入项目

3. **配置项目**
   - Framework Preset: 选择"Other"
   - Build Command: 留空
   - Output Directory: `public`
   - Install Command: `npm install`

## 部署后配置

### 更新Google Apps Script

1. **获取Vercel域名**
   - 部署完成后记录你的域名，如：`https://staff-salary-system.vercel.app`

2. **配置CORS**
   - 在Google Apps Script中添加你的Vercel域名到允许的来源

3. **配置飞书凭证**
   - 在 `google-apps-script.js` 中更新飞书多维表格的 `APP_ID`, `APP_SECRET`, `APP_TOKEN`, `USER_TABLE_ID`, 和 `SALARY_TABLE_ID`

4. **更新前端配置**
   - 在 `public/scripts/auth.js` 和 `public/scripts/salary.js` 中
   - 将 `SCRIPT_URL` 更新为你的Google Apps Script Web应用URL

## 测试清单

部署完成后，请验证：

- [ ] 网站可以正常访问
- [ ] CSS样式正确加载
- [ ] JavaScript功能正常
- [ ] 登录功能可用（测试账户：admin/123456）
- [ ] 工资查询功能正常
- [ ] 移动端显示正常

## 故障排除

### 常见问题

1. **静态资源404错误**
   - 确保所有文件都在 `public` 目录下
   - 检查 `vercel.json` 配置是否正确

2. **Google Apps Script连接失败**
   - 检查CORS设置
   - 确认Google Apps Script URL正确
   - 验证Google Apps Script已部署为Web应用
   - 检查飞书API凭证是否正确

3. **登录失败**
   - 系统会自动回退到模拟登录
   - 使用测试账户：admin/123456 或 zhang.san/123456

## 环境变量（可选）

如果需要配置环境变量：

1. 在Vercel Dashboard中进入项目设置
2. 找到"Environment Variables"部分
3. 添加：
   - `NODE_ENV`: production
   - `SCRIPT_URL`: 你的Google Apps Script URL

## 自定义域名（可选）

1. 在Vercel Dashboard中进入项目设置
2. 找到"Domains"部分
3. 添加你的自定义域名
4. 按照提示配置DNS记录