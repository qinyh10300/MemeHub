# MemeHub API设计文档

## 一、登录注册

### 1. **用户注册**
  - 方法：POST
  - 路径：/api/register
  - 请求体：
    - username：用户名，String
    - password：用户密码，String
  - 响应体：
    - 201：成功
    - 400：用户名已被注册
    - 500：服务器错误

### 2. **用户登录**
  - 方法：POST
  - 路径：/api/login
  - 请求体：
    - username：用户名，String
    - password：用户密码，String
  - 响应体：
    - 201：成功

### 3. **重设密码**
  - 方法：POST
  - 路径：/api/reset-password
  - 请求体：
  - 响应体：

### 4. **更新昵称**
- 方法：PUT 或 PATCH
  - 路径：/api/update-nicknam
- 请求头：token：认证令牌，String（临时测试时使用用户名username）
- 请求体：
  - nickname：新昵称，String，必填，不能为空，长度不超过20个字符
- 响应体：
  - 200：成功
  - 400：昵称不能为空/昵称长度超过限制/昵称已被使用
  - 401：未提供认证令牌/用户不存在或令牌无效
  - 500：服务器错误


## 二、模因信息

### 1. **获取模因信息**
  - 方法：GET
  - 路径：/api/meme/:id
    - :id替换为指定模因对象的id
    - 查询id请使用获取模因列表
  - Headers：
    - token：加密登录信息（暂时用username），用于查询点赞、收藏、货币等信息
  - 响应体：
    - status：状态码
      - 201：成功
      - 404：id不存在
      - 500：失败
    - title：标题，String
    - ticker：代号，String
    - description：描述，String
    - author：作者信息
      - username：用户名，String
    - likes：点赞数，Number
    - createdAt：创建时间，Date
    - imageUrl：图片链接，String
    - userinfo：用户关于该作品的信息
      - is_author：是作者
      - is_liked：已经点赞
      - is_favorited：已经收藏

### 2. **获取模因文件**
  - 方法：GET
  - 路径：/:imageUrl
    - :imageUrl替换为访问模因对象的imageUrl属性
    - 查询iamgeUrl请使用获取模因信息
    - 注意不需要加/api

### 3. **获取模因列表**
  - 方法：GET
  - 路径：/api/meme-list
  - Params：在路径后添加对应字符串，例如：/api/meme-list?sortBy=hot&sortOrder=asc -> 按热度升序排序
    - sortBy
      - time：按模因创建时间排序（默认），排序准则createdAt
      - hot：按热度排序，排序准则likes
    - sortOrder
      - des：降序排序（默认）
      - asc：升序排序
  - 响应体：
    - 模因id的列表，每个元素包括：
      - _id：模因id
      - likes：点赞数
      - createdAt：创建时间

## 三、模因操作

### 1. **上传模因**
  - 方法：POST
  - 路径：/api/upload-meme
  - 请求体：
    - title：标题，String
    - description：简介，String
    - file：模因文件，File(.jpg, .png, .gif, ...)
  - Headers
    - token：用户的JWT验证码（暂时用作者用户名实现），String
  - 响应体：
    - status：状态码
      - 201：成功
      - 500：失败
    - title：
    - description：
    - author：作者信息
      - username：用户名，String 
    - _id：模因id
    - createdAt：创作时间

### 2. **删除模因**
  - 方法：DELETE
  - 路径：/api/meme/:id
  - Headers：
    - token：JWT校验（暂时用username）
  - 响应体
    - 状态码
      - 200：成功
      - 404：模因不存在
      - 403：无权限
      - 500：服务器内部错误
    - message

### 3. **点赞模因**
  - 方法：POST
  - 路径：/api/meme/:id/like
  - Headers：
    - Token
  - 响应体：
    - 状态码
      - 200：成功
      - 404：用户不存在/模因不存在
      - 500
    - message：提示消息
    - meme：模因信息
      - _id
      - title
      - likes
      - imageUrl

### 4. **收藏模因**
  - 方法：POST
  - 路径：/api/meme/:id/favorite
  - Headers：
    - Token
  - 响应体：
    - 状态码
      - 200：成功
      - 404：用户不存在/模因不存在
      - 500
    - message：提示消息
    - meme：模因信息
      - _id
      - title
      - imageUrl

## 四、评论

### 1. **评论模因**
  - 方法：POST
  - 路径：/api/meme/:id/comment
  - Headers：
    - token：
  - 请求体：
    - content：评论内容，String
    - reference：引用的评论id，String
  - 响应体：
    - 状态码：
      - 200
      - 404
      - 500
    - message：
    - comment：
      - _id：
      - content：
      - reference：
      - meme：
      - user：评论用户的nickname

### 2. **获取模因的评论区**
  - 方法：GET
  - 路径：/api/meme/:id/comments
  - Params：
    - sortBy：
      - time：（默认）
      - hot：
    - sortOrder：
      - des：降序（默认）
      - asc：升序
  - 响应体：
    - 状态码
    - message：
    - comments：List
    每个元素：
      - _id：
      - content：
      - user：评论用户的nickname
      - reference：引用评论的id
      - likes：点赞数
      - createdAt：

### 3. **点赞评论**
  - 方法：POST
  - 路径：/api/comment/:id/like
  - Headers：
    - token：
  - 响应体：
    - 状态码：
    - message：
    - comment：
      - _id：
      - content：
      - likes：

### 4. **删除评论**
  - 方法：DELETE
  - 路径：/api/comment/:id
  - Headers：
    - token：JWT校验（暂时用username）
  - 响应体
    - 状态码
      - 200：成功
      - 404：模因不存在
      - 403：无权限
      - 500：服务器内部错误
    - message