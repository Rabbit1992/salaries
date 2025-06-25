// 本地开发服务器
const express = require('express');
const path = require('path');
const cors = require('cors');

// 导入API处理函数
const loginHandler = require('./api/login.js').default;
const getSalariesHandler = require('./api/getSalaries.js').default;

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API路由
app.post('/api/login', async (req, res) => {
  try {
    await loginHandler(req, res);
  } catch (error) {
    console.error('登录API错误:', error);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

app.post('/api/getSalaries', async (req, res) => {
  try {
    await getSalariesHandler(req, res);
  } catch (error) {
    console.error('工资查询API错误:', error);
    res.status(500).json({ success: false, error: '服务器内部错误' });
  }
});

// 默认路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 服务器已启动，访问地址: http://localhost:${PORT}`);
  console.log('📁 静态文件目录:', path.join(__dirname, 'public'));
  console.log('🔗 API端点:');
  console.log('  - POST /api/login');
  console.log('  - POST /api/getSalaries');
});

module.exports = app;