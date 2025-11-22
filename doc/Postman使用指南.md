# Postman Collection 使用指南

## 一、导入 Collection

1. 打开 Postman
2. 点击左上角的 **"Import"** 按钮
3. 选择文件：`test/Postman-个人主页测试.postman_collection.json`
4. 点击 **"Import"** 完成导入

---

## 二、设置环境变量

### 方法1：使用 Collection 变量（推荐）

导入后，Collection 已经包含了默认变量，你可以直接修改：

1. 在左侧找到 **"个人主页测试"** Collection
2. 右键点击 → 选择 **"Edit"**
3. 切换到 **"Variables"** 标签页
4. 修改以下变量：
   - `base_url`: `http://localhost:3000`（默认已设置）
   - `username`: 改为你的用户名（例如：`testuser123`）
   - `meme_id`: 留空，后续会自动填充

### 方法2：创建环境（可选）

如果你想使用 Postman 的环境功能：

1. 点击右上角的 **"Environments"** 图标（眼睛图标）
2. 点击 **"+"** 创建新环境
3. 添加变量：
   - `base_url`: `http://localhost:3000`
   - `username`: `你的用户名`
   - `meme_id`: ``
4. 保存并选择该环境

---

## 三、测试步骤

### 步骤1：获取模因列表

**目的**：找到可以收藏的模因ID

1. 在 Collection 中找到 **"1. 获取模因列表"**
2. 点击 **"Send"** 按钮
3. 查看响应，应该看到：
   ```json
   {
     "memeIds": [
       "507f1f77bcf86cd799439011",
       "507f1f77bcf86cd799439012",
       ...
     ]
   }
   ```
4. **重要**：复制一个模因ID，用于下一步

---

### 步骤2：收藏模因

**目的**：测试"我的收藏"功能

1. 在 Collection 中找到 **"2. 收藏模因"**
2. 在URL中，将 `{{meme_id}}` 替换为实际的模因ID
   - 或者：在 Collection 变量中设置 `meme_id` 的值
3. 确保 Headers 中有：
   ```
   token: {{username}}
   ```
4. 点击 **"Send"** 按钮
5. 查看响应，应该看到：
   ```json
   {
     "message": "收藏模因507f1f77bcf86cd799439011",
     "meme": {
       "_id": "507f1f77bcf86cd799439011",
       "title": "...",
       "imageUrl": "..."
     }
   }
   ```
6. **重复此步骤**：收藏2-3个不同的模因（使用不同的模因ID）

---

### 步骤3：创建模因

**目的**：测试"我创作的模因"和"我的模因币"功能

1. 在 Collection 中找到 **"3. 创建模因"**
2. 在 Body 标签页中：
   - `title`: 修改为 `我的模因币1`
   - `ticker`: 修改为 `COIN1`
   - `description`: 修改为 `这是第一个模因币`
   - `file`: 点击 **"Select Files"** 选择一张图片
3. 确保 Headers 中有：
   ```
   token: {{username}}
   ```
4. 点击 **"Send"** 按钮
5. 查看响应，应该看到创建的模因信息，**复制返回的 `_id`**
6. **重复此步骤**：创建2-3个模因（修改 title、ticker 和选择不同的图片）

---

### 步骤4：获取个人主页（验证结果）

**目的**：查看所有数据是否正确显示

1. 在 Collection 中找到 **"4. 获取个人主页"**
2. 确保 URL 中的 `{{username}}` 已正确设置
3. 点击 **"Send"** 按钮
4. 查看响应，检查以下内容：

#### 验证"我创作的模因"
```json
"memesData": {
  "我创作的模因": [
    {
      "image": "...",
      "name": "我的模因币1",
      "code": "COIN1",
      "description": "这是第一个模因币",
      "id": "..."
    },
    ...
  ]
}
```
✅ 应该包含你创建的所有模因

#### 验证"我的模因币"
```json
"我的模因币": [
  {
    "image": "...",
    "name": "我的模因币1",
    "code": "COIN1",
    ...
  },
  ...
]
```
✅ 应该包含你创建的所有模因（与"我创作的模因"相同）

#### 验证"我的收藏"
```json
"我的收藏": [
  {
    "image": "...",
    "name": "...",
    "code": "...",
    ...
  },
  ...
]
```
✅ 应该包含你收藏的所有模因

#### 验证"粉丝"
```json
"粉丝": []
```
✅ 目前应该为空数组（功能待实现）

---

## 四、完整测试流程示例

### 快速测试流程

```
1. 获取模因列表
   → 复制模因ID1: "507f1f77bcf86cd799439011"
   → 复制模因ID2: "507f1f77bcf86cd799439012"

2. 收藏模因
   → 收藏模因ID1 ✅
   → 收藏模因ID2 ✅

3. 创建模因
   → 创建模因1: title="模因1", ticker="MEME1" ✅
   → 创建模因2: title="模因2", ticker="MEME2" ✅
   → 创建模因3: title="模因3", ticker="MEME3" ✅

4. 获取个人主页
   → 验证"我创作的模因": 应该有3个模因 ✅
   → 验证"我的模因币": 应该有3个模因 ✅
   → 验证"我的收藏": 应该有2个模因 ✅
   → 验证"粉丝": 应该为空数组 ✅
```

---

## 五、常见问题

### Q: 如何修改 Collection 变量？

**方法1：通过 Collection 设置**
1. 右键点击 Collection → **"Edit"**
2. 切换到 **"Variables"** 标签页
3. 修改 `username` 的值
4. 点击 **"Save"**

**方法2：在请求中直接修改**
- 在URL或Headers中，直接替换 `{{username}}` 为实际值

### Q: 如何查看请求和响应？

1. **请求**：在 Postman 中可以看到：
   - URL
   - Headers
   - Body（如果有）

2. **响应**：点击 **"Send"** 后，下方会显示：
   - Status Code（状态码）
   - Response Body（响应体）
   - Headers（响应头）

### Q: 如何保存模因ID？

**方法1：使用 Collection 变量**
1. 获取模因列表后，复制一个模因ID
2. 编辑 Collection → Variables
3. 将 `meme_id` 的值设置为复制的ID
4. 保存

**方法2：直接在URL中替换**
- 在"收藏模因"请求的URL中，直接替换 `{{meme_id}}` 为实际ID

### Q: 创建模因时如何选择文件？

1. 在 Body 标签页中，找到 `file` 字段
2. 点击 **"Select Files"** 按钮
3. 选择一张图片文件（jpg、png等）
4. 文件会自动上传

### Q: 如何知道请求是否成功？

**成功的标志：**
- Status Code: `200` 或 `201`
- Response Body 中有 `code: 0` 或包含数据

**失败的标志：**
- Status Code: `400`, `401`, `404`, `500` 等
- Response Body 中有错误信息

---

## 六、测试检查清单

### ✅ 测试前准备
- [ ] 后端服务器正在运行（`http://localhost:3000`）
- [ ] 已导入 Postman Collection
- [ ] 已设置 `username` 变量为你的用户名
- [ ] 至少有一个已注册的用户账号

### ✅ 测试"我的收藏"
- [ ] 获取模因列表成功
- [ ] 收藏至少2个模因成功
- [ ] 查看个人主页，`我的收藏` 数组包含收藏的模因

### ✅ 测试"我的模因币"
- [ ] 创建至少2个模因成功
- [ ] 查看个人主页，`我的模因币` 数组包含创建的模因

### ✅ 测试"我创作的模因"
- [ ] 查看个人主页，`我创作的模因` 数组包含创建的模因
- [ ] 与"我的模因币"数据一致

### ✅ 测试"粉丝"
- [ ] 查看个人主页，`粉丝` 数组为空（功能待实现）

---

## 七、调试技巧

### 1. 查看完整请求信息

在 Postman 中，点击 **"Code"** 按钮（在 Send 按钮旁边），可以看到：
- cURL 命令
- 完整的请求头
- 请求体

### 2. 使用 Console 查看日志

1. 点击 Postman 底部的 **"Console"** 标签
2. 发送请求
3. 可以看到详细的请求和响应信息

### 3. 保存响应示例

1. 点击响应区域的 **"Save Response"**
2. 保存为示例，方便后续参考

### 4. 使用 Tests 脚本（高级）

可以在请求中添加 Tests 脚本来自动验证响应：

```javascript
// 验证状态码
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

// 验证响应结构
pm.test("Response has memesData", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data.memesData).to.exist;
});
```

---

## 八、预期结果示例

### 成功的个人主页响应

```json
{
  "code": 0,
  "message": "获取用户信息成功",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "nickname": "我的昵称",
    "username": "@testuser123",
    "bio": "这是我的个人简介",
    "followers": 0,
    "following": 0,
    "likes": 15,
    "memesData": {
      "我创作的模因": [
        {
          "image": "http://localhost:3000/memefiles/...",
          "name": "模因1",
          "code": "MEME1",
          "description": "描述1",
          "id": "..."
        },
        {
          "image": "http://localhost:3000/memefiles/...",
          "name": "模因2",
          "code": "MEME2",
          "description": "描述2",
          "id": "..."
        }
      ],
      "我的模因币": [
        // 与"我创作的模因"相同的数据
      ],
      "我的收藏": [
        {
          "image": "http://localhost:3000/memefiles/...",
          "name": "收藏的模因1",
          "code": "FAV1",
          "description": "描述",
          "id": "..."
        }
      ],
      "粉丝": []
    }
  }
}
```

---

## 九、下一步

测试完成后，你可以：
1. 在前端个人主页查看数据是否正确显示
2. 测试不同用户的个人主页
3. 测试边界情况（空数据、大量数据等）

如果遇到问题，请检查：
- 后端服务器是否正常运行
- 用户名是否正确
- 模因ID是否存在
- 网络连接是否正常

