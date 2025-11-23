# Backend 运行指南

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env` 文件（从示例文件复制）：

**Windows PowerShell:**
```powershell
Copy-Item .env_exmaple .env
```

**Windows CMD:**
```cmd
copy .env_exmaple .env
```

**macOS/Linux:**
```bash
cp .env_exmaple .env
```

或者手动创建 `.env` 文件，内容如下：

```env
JWT_SECRET=a_token_to_secret
MONGODB_URI=mongodb://localhost:27017/MemeHub
REVIEWER_REGISTER_SECRET=reviewer-secret
```

**重要提示：**
- 如果使用 MongoDB Atlas（云数据库），将 `MONGODB_URI` 替换为你的云数据库连接字符串
- `JWT_SECRET` 建议使用更复杂的随机字符串（生产环境）
- `REVIEWER_REGISTER_SECRET` 用于校验审核员注册请求，必须妥善保管

### 3. 确保 MongoDB 运行

**本地 MongoDB:**
- 确保 MongoDB 服务已启动
- 默认端口：27017

**MongoDB Atlas:**
- 无需本地安装
- 使用云数据库连接字符串

### 4. 启动服务器

```bash
npm run dev
```

服务器将在 `http://localhost:3000` 启动

## API 端点

- `POST /api/register` - 用户注册
- `POST /api/reviewer/register` - 审核员注册（Body: username、password、reviewerCode，reviewerCode 必须与 `REVIEWER_REGISTER_SECRET` 一致）
- `POST /api/login` - 用户登录  
- `POST /api/reset-password` - 重置密码
- `POST /api/upload-avatar` - 上传头像（FormData: avatar，Headers: token）
- `GET /api/avatars/default` - 获取默认头像列表
- `POST /api/avatars/select` - 选择默认头像（Body: avatarId，Headers: token）

## 依赖

- express - Web 框架
- mongoose - MongoDB ODM
- bcryptjs - 密码加密
- jsonwebtoken - JWT 认证
- cors - 跨域支持
- dotenv - 环境变量管理

