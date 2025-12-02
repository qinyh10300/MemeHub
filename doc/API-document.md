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

### 1.1 **审核员注册**
  - 方法：POST
  - 路径：/api/reviewer/register
  - 请求体：
    - username：审核员用户名，String
    - password：审核员密码，String
    - reviewerCode：审核员注册密钥，String（需与环境变量 `REVIEWER_REGISTER_SECRET` 一致）
  - 响应体：
    - 201：成功
    - 400：用户名或密码缺失
    - 403：审核员注册密钥错误
    - 500：服务器错误

### 2. **用户登录**
  - 方法：POST
  - 路径：/api/login
  - 请求体：
    - username：用户名，String
    - password：用户密码，String
  - 响应体：
    - 201：成功
       - token：JWT
       - user：包含 id、username、nickname、role，其中 role 可用于区分普通用户与审核员

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

### 5. **获取消息通知**

- 方法：GET
- 路径：/api/notifications
- Headers：
  - token：
- Params：
  - type：消息的分类标签，enum['work','interaction','coin']，分别代表模因作品、互动提醒、模因币
- 响应体
  - notifications：消息通知列表，每一个元素如下：
    - _id
    - user：接收者
    - type：分类标签
    - message：消息内容
    - isRead：是否已读，Bool
    - createdAt：创建时间，Date

### 6. **消息已读**

- 方法：POST
- 路径：/api/mark-notification-read
- Headers：
  - token
- 请求体：
  - notificationIds：消息id列表

### 7. **上传头像**
- 方法：POST
- 路径：/api/upload-avatar
- Headers：
  - token：临时使用 username，后续切换为 JWT
- 请求体：
  - FormData，字段名为 avatar，文件大小 ≤ 5MB
- 响应体：
  - code: 0 表示成功
  - avatar：上传后的头像 URL
  - 401：未提供 token 或 token 无效
  - 400：未上传头像文件

### 8. **获取默认头像列表**
- 方法：GET
- 路径：/api/avatars/default
- 响应体：
  - code: 0 表示成功
  - data：默认头像数组，每个元素包含
    - id：头像编号（从 0 开始）
    - url：头像图片地址

### 9. **选择默认头像**
- 方法：POST
- 路径：/api/avatars/select
- Headers：
  - token：临时使用 username，后续切换为 JWT
- 请求体：
  - avatarId：默认头像编号，对应 `GET /api/avatars/default` 返回的 id
- 响应体：
  - code: 0 表示成功
  - avatar：设置后的头像 URL
  - 401：未提供 token 或 token 无效
  - 400：avatarId 不合法

## 二、模因信息

### 1. **获取模因信息**
- 方法：GET
- 路径：/api/meme/:id
  - :id替换为指定模因对象的id
  - 查询id请使用获取模因列表
- Headers：
  - token：加密登录信息（暂时用username），用于查询点赞、收藏、货币等信息
- status：状态码
  - 200：成功
  - 404：id不存在
  - 500：失败
- 响应体：
  - title：标题，String
  - ticker：代号，String
  - description：描述，String
  - author：作者信息
    - username：用户名，String
    - nickname：昵称
    - avatar：头像
    - bio：简介
  - likes：点赞数，Number
  - createdAt：创建时间，Date
  - imageUrl：图片链接，String
  - withToken：是否发行了货币，若否，token字段为null
  - token：货币信息
    - price：当前单价
    - priceHistory：历史交易记录（最新20条），列表，每一个元素如下
      - time：交易时间
      - user：用户昵称
      - side：交易模式（BUY买入，SELL卖出）
      - amount：交易数量
      - price：交易USDT金额
      - newPrice：交易后的单价

  - userinfo：用户关于该作品的信息
    - is_author：是作者
    - is_liked：已经点赞
    - is_favorited：已经收藏

### 2. **获取列表的模因信息**
- 方法：POST
- 路径：/api/meme/list
  - 查询id请使用获取模因列表
- Headers：
  - token：加密登录信息（暂时用username），用于查询点赞、收藏、货币等信息
- 请求体：
  - memeIds：模因id列表
- 响应体：
  - status：状态码
    - 200：成功
    - 404：id不存在
    - 500：失败
  - memes：模因信息列表，每一个元素如下：
    - _id：模因id（前端需检查此项是否为null）
    - title：标题，String
    - ticker：代号，String
    - description：描述，String
    - author：作者信息
      - username：用户名，String
      - nickname：昵称
      - avatar：头像
      - bio：简介
    - likes：点赞数，Number
    - favorites：收藏数，Number
    - createdAt：创建时间，Date


### 3. **获取模因文件**
- 方法：GET
- 路径：/:imageUrl
  - :imageUrl替换为访问模因对象的imageUrl属性
  - 查询iamgeUrl请使用获取模因信息
  - 注意不需要加/api

### 4. **获取模因列表**
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
  - 模因id的列表，List(String)，每个元素是Meme的_id

## 三、模因操作

### 1. **上传模因**
- 方法：POST
- 路径：/api/upload-meme
- 请求体Body：
  - title：标题，String
  - ticker：代号，String
  - description：简介，String
  - withToken:是否发行虚拟货币，Boolen，若是，则需要
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
  - comments：评论列表
    - _id：评论id
    - reference：引用id，没有引用则为null
    - content：评论内容
    - createdAt：创建时间
    - likes：点赞数
    - isLiked：当前用户是否点赞
    - userId：评论作者的用户ID
    - user：评论作者的用户名
    - nickname：评论作者昵称
    - avatar：评论作者头像（若用户未上传则返回默认头像）
  
### 3. **获取列表评论**
- 方法：POST
- 路径：/api/comment/list
- Headers：
  - token: 暂时用username
- 请求体：
  - commentIds：评论id列表
- 响应体：
  - comments：评论内容列表，每一个元素如下
    - content：内容，String（前端需检查此项是否为null，若是，引用已删除）
    - likes：点赞数
    - userinfo：浏览用户与评论的关系
      - is_author：浏览用户是否是发布者
      - is_liked：浏览用户是否已经点赞
    - user：作者信息
      - username
      - nickname
      - avatar
      - bio
    - reference：引用评论信息（前端需检查此项是否为null，若是，未引用或引用已删除，暂时无法区分两者）
      - content：
      - likes：点赞数
      - user
        - username
        - nickname
        - avatar
        - bio


### 4. **点赞评论**
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

### 5. **删除评论**
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

## 五、搜索

### 1. **搜索模因**

- 方法：GET
- 路径：/api/search-meme
- Params：
  - q：搜索关键词，String
  - sortBy
    - time：按模因创建时间排序（默认），排序准则createdAt
    - hot：按热度排序，排序准则likes
  - sortOrder
    - des：降序排序（默认）
    - asc：升序排序
- 响应体：
  - 模因id的列表，List(String)，每个元素是Meme的_id

### 2. **搜索用户**

- 方法：GET
- 路径：/api/search-user
- Params：
  - q：搜索关键词
- 响应体：
  - 用户username列表，List(String)，每个元素是返回用户的username

## 六、审核操作

### 1. **获取待审核模因列表**

  - 方法：GET
  - 路径：/api/review/pending-meme-list
  - Headers：
    - token
  - 响应体
    - memeIds：模因id列表

### 2. **审核模因作品**

  - 方法：POST
  - 路径：/api/review/meme/:id
  - Headers：
    - token：
  - 请求体：
    - action：审核操作，enum['approve', 'reject']
    - description：描述（仅拒绝时需要）

## 七、虚拟货币

### 1. **getTokenPriceByAmount**

- 方法：GET
- 路径：/api/meme/:id/token/price
- Param：
  - amount：购买或卖出的Token数量
    - 买入为正，卖出为负，自然数，后端自动向零取整
  - expectedPrice：预约订单时的期望价格
    - 非订单无需此参数（也可赋值0），根据期望价格计算购买指定数量的货币需要多少USDT
- Header：
  - token：用户身份验证码
- 响应体：
  - price：买入所需USDT或卖出可得的USDT，返回值非负

### 2. **buyTokenPriceByAmount**

- 方法：POST
- 路径：/api/meme/:id/token/buy
- Body：
  - amount：购买的Token数量
- Header：
  - token：用户身份验证码
- 状态码：
  - 200：成功
  - 400：模因没有发行货币；amount参数非法；用户余额不足
  - 404：用户/模因/货币不存在

### 3. **sellTokenPriceByAmount**

- 方法：POST
- 路径：/api/meme/:id/token/sell
- Body：
  - amount：购买的Token数量
- Header：
  - token：用户身份验证码
- 状态码：
  - 200：成功
  - 400：模因没有发行货币；amount参数非法；用户余额不足
  - 404：用户/模因/货币不存在

### 4. **buyTokenReservation**

- 方法：POST
- 路径：/api/meme/:id/token/buy-reservation
- Body：
  - amount：购买的Token数量
  - expectedPrice：触发预约订单的价格
- Header：
  - token：用户身份验证码
  
### 45. **sellTokenReservation**

- 方法：POST
- 路径：/api/meme/:id/token/sell-reservation
- Body：
  - amount：出售的Token数量
  - expectedPrice：触发预约订单的价格
- Header：
  - token：用户身份验证码