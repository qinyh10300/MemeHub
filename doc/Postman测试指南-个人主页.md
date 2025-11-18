# Postman 测试指南 - 个人主页功能

## 前置准备

1. **确保后端服务器运行**：`http://localhost:3000`
2. **准备测试数据**：
   - 至少一个已注册的用户账号（用户名和密码）
   - 一些已创建的模因（用于测试收藏）

---

## 一、测试"我的收藏"功能

### 步骤1：获取模因列表（找到要收藏的模因ID）

**请求：**
- **方法**：`GET`
- **URL**：`http://localhost:3000/api/meme-list`
- **Headers**：无需

**响应示例：**
```json
{
  "memeIds": [
    "507f1f77bcf86cd799439011",
    "507f1f77bcf86cd799439012",
    ...
  ]
}
```

**操作**：复制一个模因ID，用于下一步收藏。

---

### 步骤2：收藏模因

**请求：**
- **方法**：`POST`
- **URL**：`http://localhost:3000/api/meme/{memeId}/favorite`
  - 将 `{memeId}` 替换为实际的模因ID
- **Headers**：
  ```
  token: 你的用户名
  Content-Type: application/json
  ```

**示例：**
```
POST http://localhost:3000/api/meme/507f1f77bcf86cd799439011/favorite
Headers:
  token: testuser123
```

**响应示例（成功）：**
```json
{
  "message": "收藏模因507f1f77bcf86cd799439011",
  "meme": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "测试模因",
    "imageUrl": "memefiles/507f1f77bcf86cd799439011.jpg"
  }
}
```

**再次调用**：如果模因已收藏，再次调用会取消收藏。

---

### 步骤3：查看个人主页（验证收藏）

**请求：**
- **方法**：`GET`
- **URL**：`http://localhost:3000/api/user/{username}`
  - 将 `{username}` 替换为你的用户名
- **Headers**：
  ```
  token: 你的用户名（可选）
  ```

**示例：**
```
GET http://localhost:3000/api/user/testuser123
```

**响应示例：**
```json
{
  "code": 0,
  "message": "获取用户信息成功",
  "data": {
    "id": "...",
    "nickname": "...",
    "username": "@testuser123",
    "bio": "...",
    "followers": 0,
    "following": 0,
    "likes": 123,
    "memesData": {
      "我创作的模因": [...],
      "我的模因币": [...],
      "我的收藏": [
        {
          "image": "http://localhost:3000/memefiles/507f1f77bcf86cd799439011.jpg",
          "name": "测试模因",
          "code": "TEST1",
          "description": "这是测试模因的描述",
          "id": "507f1f77bcf86cd799439011"
        },
        ...
      ],
      "粉丝": []
    }
  }
}
```

**验证**：检查 `memesData.我的收藏` 数组，应该包含你收藏的模因。

---

## 二、测试"我的模因币"功能

### 说明
"我的模因币"目前显示的是用户创作的所有模因（每个模因代表一个模因币）。

### 步骤1：创建模因（如果还没有）

**请求：**
- **方法**：`POST`
- **URL**：`http://localhost:3000/api/upload-meme`
- **Headers**：
  ```
  token: 你的用户名
  ```
- **Body**：选择 `form-data` 格式
  - `title`: 模因标题（例如：`我的模因币1`）
  - `ticker`: 模因代号（例如：`COIN1`）
  - `description`: 描述（例如：`这是我的第一个模因币`）
  - `file`: 选择图片文件

**Postman 设置：**
1. 选择 `POST` 方法
2. URL: `http://localhost:3000/api/upload-meme`
3. Headers 标签页：
   - Key: `token`
   - Value: `你的用户名`
4. Body 标签页：
   - 选择 `form-data`
   - 添加以下字段：
     - `title` (Text): `我的模因币1`
     - `ticker` (Text): `COIN1`
     - `description` (Text): `这是我的第一个模因币`
     - `file` (File): 选择一张图片

**响应示例（成功）：**
```json
{
  "_id": "507f1f77bcf86cd799439013",
  "title": "我的模因币1",
  "ticker": "COIN1",
  "description": "这是我的第一个模因币",
  "imageUrl": "memefiles/507f1f77bcf86cd799439013.jpg",
  "author": {
    "username": "testuser123"
  },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "likes": 0
}
```

### 步骤2：查看个人主页（验证模因币）

**请求：**
- **方法**：`GET`
- **URL**：`http://localhost:3000/api/user/{username}`

**验证**：检查 `memesData.我的模因币` 数组，应该包含你创建的所有模因。

---

## 三、测试"粉丝"功能

### 说明
"粉丝"功能目前还未实现，返回空数组。如果需要测试，可以：

1. **临时添加测试数据**（仅用于测试）：
   - 修改后端代码，返回一些模拟的粉丝数据
   - 或者等待关注功能实现后再测试

2. **查看当前状态**：
   - 调用个人主页API
   - 检查 `memesData.粉丝` 数组，应该为空数组 `[]`

---

## 四、完整测试流程

### 测试场景：完整的个人主页数据

1. **创建多个模因**（测试"我创作的模因"和"我的模因币"）
   ```
   POST /api/upload-meme
   - 创建模因1: title="模因1", ticker="MEME1"
   - 创建模因2: title="模因2", ticker="MEME2"
   - 创建模因3: title="模因3", ticker="MEME3"
   ```

2. **收藏一些模因**（测试"我的收藏"）
   ```
   POST /api/meme/{memeId1}/favorite  # 收藏模因1
   POST /api/meme/{memeId2}/favorite  # 收藏模因2
   ```

3. **查看个人主页**（验证所有数据）
   ```
   GET /api/user/{username}
   ```

4. **验证结果**：
   - `memesData.我创作的模因`: 应该包含你创建的3个模因
   - `memesData.我的模因币`: 应该包含你创建的3个模因（与"我创作的模因"相同）
   - `memesData.我的收藏`: 应该包含你收藏的2个模因
   - `memesData.粉丝`: 应该为空数组 `[]`

---

## 五、Postman Collection 配置

### 环境变量（可选）

在 Postman 中创建环境变量：
- `base_url`: `http://localhost:3000`
- `username`: `你的用户名`
- `meme_id`: `模因ID`（动态更新）

### 请求示例

#### 1. 获取模因列表
```
GET {{base_url}}/api/meme-list
```

#### 2. 收藏模因
```
POST {{base_url}}/api/meme/{{meme_id}}/favorite
Headers:
  token: {{username}}
```

#### 3. 创建模因
```
POST {{base_url}}/api/upload-meme
Headers:
  token: {{username}}
Body (form-data):
  title: 测试模因
  ticker: TEST1
  description: 测试描述
  file: [选择文件]
```

#### 4. 获取个人主页
```
GET {{base_url}}/api/user/{{username}}
Headers:
  token: {{username}}
```

---

## 六、常见问题

### Q: 收藏后看不到数据？
A: 
1. 确认收藏API调用成功（返回200状态码）
2. 刷新个人主页API
3. 检查用户名是否正确

### Q: 如何获取模因ID？
A: 
1. 调用 `/api/meme-list` 获取所有模因ID
2. 或者创建模因时，API响应中会返回 `_id` 字段

### Q: 为什么"我的模因币"和"我创作的模因"一样？
A: 目前"我的模因币"显示的是用户创作的所有模因。后续可以根据 `coins` 字段或 `currencyList` 实现真正的模因币功能。

### Q: 为什么"粉丝"是空的？
A: 关注功能还未实现，User模型中也没有 `followers` 字段。需要先实现关注功能。

---

## 七、快速测试脚本

### 使用 curl（Windows PowerShell）

```powershell
# 设置变量
$baseUrl = "http://localhost:3000"
$username = "你的用户名"
$memeId = "模因ID"

# 1. 获取模因列表
Invoke-RestMethod -Uri "$baseUrl/api/meme-list" -Method Get

# 2. 收藏模因
Invoke-RestMethod -Uri "$baseUrl/api/meme/$memeId/favorite" -Method Post -Headers @{"token"=$username}

# 3. 获取个人主页
Invoke-RestMethod -Uri "$baseUrl/api/user/$username" -Method Get -Headers @{"token"=$username}
```

### 使用 curl（Linux/Mac）

```bash
# 设置变量
BASE_URL="http://localhost:3000"
USERNAME="你的用户名"
MEME_ID="模因ID"

# 1. 获取模因列表
curl -X GET "$BASE_URL/api/meme-list"

# 2. 收藏模因
curl -X POST "$BASE_URL/api/meme/$MEME_ID/favorite" \
  -H "token: $USERNAME" \
  -H "Content-Type: application/json"

# 3. 获取个人主页
curl -X GET "$BASE_URL/api/user/$USERNAME" \
  -H "token: $USERNAME"
```

