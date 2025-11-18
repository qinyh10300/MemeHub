# Postman 测试：ztl10300 关注 qyh10300

## 快速测试步骤

### 步骤1：设置 Collection 变量

1. 在 Postman 中，找到 **"个人主页测试"** Collection
2. 右键点击 → 选择 **"Edit"**
3. 切换到 **"Variables"** 标签页
4. 设置以下变量：
   - `username`: `ztl10300`（当前登录用户，用于token）
   - `target_username`: `qyh10300`（要关注的目标用户）

### 步骤2：执行关注操作

1. 在 Collection 中找到 **"5. 关注用户"**
2. 确保 URL 显示为：`{{base_url}}/api/user/{{target_username}}/follow`
   - 实际URL应该是：`http://localhost:3000/api/user/qyh10300/follow`
3. 确保 Headers 中有：
   ```
   token: ztl10300
   Content-Type: application/json
   ```
4. 点击 **"Send"** 按钮
5. 查看响应，应该看到：
   ```json
   {
     "code": 0,
     "message": "已关注用户 qyh10300",
     "isFollowing": true,
     "targetUser": {
       "_id": "...",
       "username": "qyh10300",
       "nickname": "..."
     }
   }
   ```

### 步骤3：验证关注关系

#### 3.1 查看 ztl10300 的个人主页（关注数应该增加）

1. 调用 **"4. 获取个人主页"**
2. 修改 URL 为：`{{base_url}}/api/user/ztl10300`
   - 或者直接在URL中替换：`http://localhost:3000/api/user/ztl10300`
3. Headers 中设置：`token: ztl10300`
4. 点击 **"Send"**
5. 检查响应中的 `data.following` 字段，应该为 `1`（关注了1个用户）

#### 3.2 查看 qyh10300 的个人主页（粉丝数应该增加）

1. 调用 **"4. 获取个人主页"**
2. 修改 URL 为：`{{base_url}}/api/user/qyh10300`
   - 或者直接在URL中替换：`http://localhost:3000/api/user/qyh10300`
3. Headers 中设置：`token: qyh10300`（或任意值，查看他人主页不需要token）
4. 点击 **"Send"**
5. 检查响应：
   - `data.followers` 应该为 `1`（有1个粉丝）
   - `data.memesData.粉丝` 数组应该包含 ztl10300 的信息：
     ```json
     {
       "memesData": {
         "粉丝": [
           {
             "id": "...",
             "username": "@ztl10300",
             "nickname": "...",
             "avatar": "..."
           }
         ]
       }
     }
     ```

---

## 手动创建请求（如果不想用Collection）

### 请求1：关注用户

**方法**：`POST`  
**URL**：`http://localhost:3000/api/user/qyh10300/follow`  
**Headers**：
```
token: ztl10300
Content-Type: application/json
```

**预期响应**：
```json
{
  "code": 0,
  "message": "已关注用户 qyh10300",
  "isFollowing": true
}
```

### 请求2：查看 ztl10300 的个人主页

**方法**：`GET`  
**URL**：`http://localhost:3000/api/user/ztl10300`  
**Headers**：
```
token: ztl10300
```

**检查**：`data.following` 应该为 `1`

### 请求3：查看 qyh10300 的个人主页

**方法**：`GET`  
**URL**：`http://localhost:3000/api/user/qyh10300`  
**Headers**：
```
token: qyh10300
```

**检查**：
- `data.followers` 应该为 `1`
- `data.memesData.粉丝` 应该包含 ztl10300

---

## 前端页面验证

### 验证步骤

1. **确保后端服务器正在运行**（`http://localhost:3000`）

2. **确保前端服务器正在运行**

3. **登录 ztl10300 账号**
   - 打开前端页面
   - 点击"登录"按钮
   - 输入用户名：`ztl10300` 和密码

4. **查看 ztl10300 的个人主页**
   - 点击"个人主页"或访问：`http://localhost:5173/profile/ztl10300`
   - 检查"关注"数字，应该显示 `1`

5. **查看 qyh10300 的个人主页**
   - 访问：`http://localhost:5173/profile/qyh10300`
   - 检查"粉丝"数字，应该显示 `1`
   - 点击"粉丝"标签页，应该能看到 ztl10300 的信息

---

## 常见问题

### Q: 关注后前端没有更新？

A: 需要刷新页面，或者重新访问个人主页。前端会在页面加载时从后端获取最新数据。

### Q: 如何取消关注？

A: 再次调用相同的关注API（`POST /api/user/qyh10300/follow`），会取消关注。

### Q: 如何查看我关注了哪些用户？

A: 目前个人主页API只返回粉丝列表，不返回关注列表。你可以：
1. 查看 `data.following` 字段（数字）
2. 或者在前端实现"关注"标签页来显示关注列表

---

## 测试检查清单

- [ ] 关注API调用成功
- [ ] ztl10300 的 `following` 为 1
- [ ] qyh10300 的 `followers` 为 1
- [ ] qyh10300 的 `粉丝` 列表包含 ztl10300
- [ ] 前端页面显示正确的关注数
- [ ] 前端页面显示正确的粉丝数
- [ ] 前端"粉丝"标签页能显示粉丝列表

