@echo off
echo ====================================
echo     工资查询系统 - Vercel部署脚本
echo ====================================
echo.

echo 检查Node.js和npm...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未找到Node.js，请先安装Node.js
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)

npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未找到npm
    pause
    exit /b 1
)

echo Node.js和npm检查通过!
echo.

echo 检查Vercel CLI...
vercel --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Vercel CLI未安装，正在安装...
    npm install -g vercel
    if %errorlevel% neq 0 (
        echo 错误: Vercel CLI安装失败
        pause
        exit /b 1
    )
    echo Vercel CLI安装成功!
) else (
    echo Vercel CLI已安装!
)
echo.

echo 开始部署到Vercel...
echo 请按照提示完成登录和配置
echo.
vercel

if %errorlevel% equ 0 (
    echo.
    echo ====================================
    echo         部署成功!
    echo ====================================
    echo.
    echo 接下来请:
    echo 1. 记录你的Vercel域名
    echo 2. 配置Google Apps Script CORS
    echo 3. 更新前端代码中的Google Apps Script URL
    echo 4. 测试所有功能
    echo.
    echo 详细说明请查看 deploy.md 文件
) else (
    echo.
    echo 部署失败，请检查错误信息
)

echo.
pause