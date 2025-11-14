# Windows 平台安装和配置指南

> 精臣打印机 TypeScript 模块 - Windows 专属安装说明

## 📋 目录

- [系统要求](#系统要求)
- [安装步骤](#安装步骤)
- [防火墙配置](#防火墙配置)
- [浏览器设置](#浏览器设置)
- [常见问题](#常见问题)
- [故障排除](#故障排除)

---

## 🖥️ 系统要求

### 最低要求

- **操作系统**：Windows 10 或更高版本（推荐 Windows 11）
- **Node.js**：v16.0.0 或更高版本
- **npm**：v7.0.0 或更高版本
- **浏览器**：
  - Chrome 90+
  - Edge 90+
  - Firefox 88+
- **内存**：至少 4GB RAM
- **磁盘空间**：至少 500MB 可用空间

### 检查当前环境

在 PowerShell 或命令提示符中运行：

```powershell
# 检查 Node.js 版本
node --version

# 检查 npm 版本
npm --version

# 检查 git 版本（可选）
git --version
```

---

## 📦 安装步骤

### 步骤 1：安装精臣打印服务

**重要！** 这是最关键的一步。

1. **找到打印服务安装包**
   ```
   路径：../打印服务（必须安装）/
   文件：JingchenPrinterService_Windows.exe（或类似名称）
   ```

2. **以管理员身份运行安装程序**
   - 右键点击安装包
   - 选择"以管理员身份运行"
   - 按照安装向导完成安装

3. **验证服务是否运行**
   - 按 `Win + R`，输入 `services.msc`，回车
   - 查找"精臣打印服务"或"Jingchen Printer Service"
   - 确认状态为"正在运行"

4. **验证 WebSocket 监听**
   - 打开浏览器
   - 按 F12 打开开发者工具
   - 在控制台中输入：
     ```javascript
     const ws = new WebSocket('ws://127.0.0.1:37989');
     ws.onopen = () => console.log('连接成功！');
     ws.onerror = (e) => console.error('连接失败！', e);
     ```
   - 如果看到"连接成功！"，说明服务正常运行

### 步骤 2：克隆或复制项目

**选项 A：使用 Git（推荐）**
```powershell
# 在 PowerShell 中运行
cd C:\Users\YourUsername\Projects
git clone <项目地址>
cd jingchen-printer-module
```

**选项 B：手动复制**
- 将整个 `jingchen-printer-module` 文件夹复制到本地
- 注意保持目录结构完整

### 步骤 3：安装依赖

在项目目录中打开 PowerShell：

```powershell
# 安装 npm 依赖
npm install
```

**预期输出：**
```
added 350 packages in 10s
```

**如果遇到网络问题：**
```powershell
# 使用国内镜像
npm install --registry=https://registry.npmmirror.com
```

### 步骤 4：编译 TypeScript 代码

```powershell
npm run build
```

**预期输出：**
```
> jingchen-printer-module@1.0.0 build
> tsc
```

检查 `dist/` 目录是否生成了编译文件：
```powershell
dir dist
```

### 步骤 5：启动测试服务器

```powershell
npm run test
```

**预期输出：**
```
<i> [webpack-dev-server] Project is running at:
<i> [webpack-dev-server] Loopback: http://localhost:8080/
```

浏览器会自动打开 `http://localhost:8080`

---

## 🔥 防火墙配置

### Windows Defender 防火墙设置

#### 方法 1：图形界面配置

1. **打开 Windows Defender 防火墙**
   - 按 `Win + I` 打开设置
   - 导航到：更新和安全 > Windows 安全中心 > 防火墙和网络保护
   - 点击"高级设置"

2. **添加入站规则**
   - 左侧选择"入站规则"
   - 右侧点击"新建规则"
   - 选择"端口" → 下一步
   - 选择"TCP" → 特定本地端口：`37989` → 下一步
   - 选择"允许连接" → 下一步
   - 全部勾选（域、专用、公用）→ 下一步
   - 名称：`精臣打印服务` → 完成

3. **添加出站规则**（可选）
   - 重复上述步骤，但在"出站规则"中添加

#### 方法 2：PowerShell 命令（管理员）

以管理员身份打开 PowerShell，运行：

```powershell
# 添加入站规则
New-NetFirewallRule -DisplayName "精臣打印服务 - 入站" -Direction Inbound -Protocol TCP -LocalPort 37989 -Action Allow

# 添加出站规则（可选）
New-NetFirewallRule -DisplayName "精臣打印服务 - 出站" -Direction Outbound -Protocol TCP -LocalPort 37989 -Action Allow

# 验证规则
Get-NetFirewallRule -DisplayName "*精臣*"
```

#### 方法 3：临时禁用防火墙（仅用于测试）

⚠️ **警告：仅在受信任的网络环境中使用！**

```powershell
# 以管理员身份运行
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled False

# 测试完成后记得重新启用
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled True
```

---

## 🌐 浏览器设置

### Microsoft Edge（推荐）

1. **允许 localhost WebSocket 连接**
   - Edge 默认允许 localhost 连接，无需额外配置

2. **开发者工具快捷键**
   - `F12` 或 `Ctrl + Shift + I`

3. **检查 WebSocket 连接**
   - 打开开发者工具
   - 切换到"网络"选项卡
   - 筛选器选择"WS"（WebSocket）
   - 刷新页面，应该能看到 `ws://127.0.0.1:37989` 的连接

### Google Chrome

1. **允许不安全的 localhost**
   - 访问：`chrome://flags/#allow-insecure-localhost`
   - 设置为"Enabled"
   - 重启浏览器

2. **检查 WebSocket**
   - 同 Edge 的方法

### Firefox

1. **允许 localhost 连接**
   - 访问：`about:config`
   - 搜索：`network.websocket.allowInsecureFromHTTPS`
   - 设置为 `true`

---

## ❓ 常见问题

### Q1: 打印服务无法启动

**症状：**
- `services.msc` 中找不到精臣打印服务
- 或服务状态为"已停止"

**解决方案：**

1. **检查是否以管理员身份安装**
   ```powershell
   # 以管理员身份运行 PowerShell
   Get-Service -Name "*jingchen*" -ErrorAction SilentlyContinue
   ```

2. **手动启动服务**
   ```powershell
   # 以管理员身份运行
   Start-Service -Name "精臣打印服务"
   ```

3. **检查端口占用**
   ```powershell
   # 查看 37989 端口是否被占用
   netstat -ano | findstr :37989

   # 如果被占用，查找占用进程
   Get-Process -Id <PID>

   # 结束占用进程（谨慎操作）
   Stop-Process -Id <PID> -Force
   ```

### Q2: npm install 失败

**症状：**
```
npm ERR! network request failed
npm ERR! network timeout
```

**解决方案：**

1. **使用国内镜像**
   ```powershell
   # 临时使用淘宝镜像
   npm install --registry=https://registry.npmmirror.com

   # 或永久设置
   npm config set registry https://registry.npmmirror.com
   ```

2. **清理 npm 缓存**
   ```powershell
   npm cache clean --force
   npm install
   ```

3. **使用 cnpm**
   ```powershell
   npm install -g cnpm --registry=https://registry.npmmirror.com
   cnpm install
   ```

### Q3: TypeScript 编译错误

**症状：**
```
error TS2307: Cannot find module 'xxx'
```

**解决方案：**

1. **重新安装类型定义**
   ```powershell
   npm install --save-dev @types/node typescript
   ```

2. **检查 tsconfig.json**
   - 确认文件存在且格式正确

3. **删除 node_modules 重新安装**
   ```powershell
   Remove-Item -Recurse -Force node_modules
   Remove-Item -Force package-lock.json
   npm install
   ```

### Q4: 找不到打印机

**症状：**
- 扫描 USB 打印机返回空列表
- 扫描 WiFi 打印机超时

**解决方案：**

**USB 打印机：**
1. 检查 USB 线缆连接
2. 检查打印机电源
3. 在设备管理器中查看是否识别设备
   ```
   按 Win + X → 设备管理器 → 查看"端口(COM 和 LPT)"或"打印队列"
   ```
4. 尝试重新插拔 USB 线
5. 更换 USB 端口

**WiFi 打印机：**
1. 确保打印机和电脑在同一 WiFi 网络
2. 检查路由器设置，确保允许设备间通信（关闭 AP 隔离）
3. ping 打印机 IP 地址验证网络连通性
   ```powershell
   ping <打印机IP地址>
   ```
4. 检查 Windows 防火墙是否阻止
5. 尝试重启路由器和打印机

### Q5: WebSocket 连接失败

**症状：**
```
WebSocket connection failed
Error: Failed to connect to ws://127.0.0.1:37989
```

**解决方案：**

1. **验证打印服务运行**
   ```powershell
   # 检查服务状态
   Get-Service -Name "*jingchen*"

   # 检查端口监听
   netstat -ano | findstr :37989
   ```

2. **检查防火墙规则**
   ```powershell
   Get-NetFirewallRule -DisplayName "*精臣*"
   ```

3. **使用 PowerShell 测试连接**
   ```powershell
   Test-NetConnection -ComputerName 127.0.0.1 -Port 37989
   ```

4. **查看打印服务日志**
   - 打开事件查看器：`eventvwr.msc`
   - 导航到：Windows 日志 > 应用程序
   - 查找与精臣打印服务相关的错误

### Q6: 权限错误

**症状：**
```
Error: EPERM: operation not permitted
Access is denied
```

**解决方案：**

1. **以管理员身份运行 PowerShell**
   - 右键 PowerShell 图标
   - 选择"以管理员身份运行"

2. **检查文件夹权限**
   - 右键项目文件夹
   - 属性 > 安全 > 编辑
   - 确保当前用户有"完全控制"权限

3. **禁用杀毒软件（临时）**
   - 某些杀毒软件可能阻止 npm 或 Node.js 操作

---

## 🔧 故障排除

### 完整诊断流程

运行以下诊断脚本（PowerShell）：

```powershell
# 创建诊断脚本
@"
Write-Host "=== 精臣打印机模块诊断 ===" -ForegroundColor Cyan

Write-Host "`n1. 检查 Node.js 环境..." -ForegroundColor Yellow
node --version
npm --version

Write-Host "`n2. 检查打印服务..." -ForegroundColor Yellow
Get-Service -Name "*jingchen*" -ErrorAction SilentlyContinue

Write-Host "`n3. 检查端口 37989..." -ForegroundColor Yellow
netstat -ano | findstr :37989

Write-Host "`n4. 检查防火墙规则..." -ForegroundColor Yellow
Get-NetFirewallRule -DisplayName "*精臣*" -ErrorAction SilentlyContinue

Write-Host "`n5. 检查项目文件..." -ForegroundColor Yellow
if (Test-Path "package.json") {
    Write-Host "✓ package.json 存在" -ForegroundColor Green
} else {
    Write-Host "✗ package.json 不存在" -ForegroundColor Red
}

if (Test-Path "dist") {
    Write-Host "✓ dist 目录存在" -ForegroundColor Green
    Get-ChildItem dist -File | Measure-Object | Select-Object -ExpandProperty Count | ForEach-Object {
        Write-Host "  包含 $_ 个文件" -ForegroundColor Gray
    }
} else {
    Write-Host "✗ dist 目录不存在（需要运行 npm run build）" -ForegroundColor Red
}

if (Test-Path "node_modules") {
    Write-Host "✓ node_modules 存在" -ForegroundColor Green
} else {
    Write-Host "✗ node_modules 不存在（需要运行 npm install）" -ForegroundColor Red
}

Write-Host "`n6. 测试 WebSocket 连接..." -ForegroundColor Yellow
try {
    `$result = Test-NetConnection -ComputerName 127.0.0.1 -Port 37989 -WarningAction SilentlyContinue
    if (`$result.TcpTestSucceeded) {
        Write-Host "✓ 端口 37989 可访问" -ForegroundColor Green
    } else {
        Write-Host "✗ 端口 37989 不可访问" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ 连接测试失败" -ForegroundColor Red
}

Write-Host "`n=== 诊断完成 ===" -ForegroundColor Cyan
"@ | Out-File -FilePath "diagnose.ps1" -Encoding UTF8

# 运行诊断
.\diagnose.ps1
```

### 重置环境

如果一切都不工作，尝试完全重置：

```powershell
# 1. 停止打印服务
Stop-Service -Name "*jingchen*" -Force -ErrorAction SilentlyContinue

# 2. 删除项目依赖
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue

# 3. 清理 npm 缓存
npm cache clean --force

# 4. 重新安装
npm install

# 5. 重新编译
npm run build

# 6. 启动打印服务
Start-Service -Name "*jingchen*"

# 7. 启动测试
npm run test
```

---

## 📞 获取帮助

如果以上方法都无法解决问题：

1. **收集诊断信息**
   - 运行诊断脚本
   - 截图错误信息
   - 记录 Windows 版本：`winver`
   - 记录 Node.js 版本：`node --version`

2. **查看日志文件**
   - npm 错误日志：`C:\Users\YourUsername\AppData\Roaming\npm-cache\_logs\`
   - 打印服务日志：事件查看器

3. **联系技术支持**
   - 提供诊断信息
   - 描述复现步骤
   - 附上错误截图

---

## ✅ 验证安装成功

完成所有步骤后，运行以下检查清单：

- [ ] Node.js 和 npm 版本正确
- [ ] 精臣打印服务正在运行
- [ ] 端口 37989 可访问
- [ ] 防火墙规则已添加
- [ ] `npm install` 成功
- [ ] `npm run build` 成功
- [ ] `npm run test` 启动测试页面
- [ ] 浏览器打开 http://localhost:8080
- [ ] 点击"连接打印服务"显示"服务已连接"
- [ ] 能够扫描到打印机
- [ ] 能够连接打印机
- [ ] 能够打印测试条码

如果所有项目都打勾，恭喜您安装成功！🎉

---

**祝您使用愉快！**

如有任何问题，请参考 [README.md](README.md) 或 [WINDOWS_TEST.md](WINDOWS_TEST.md)。
