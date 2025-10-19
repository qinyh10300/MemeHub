// index.js (升级版)

const express = require('express');     // 引入 express 框架
const mongoose = require('mongoose');   // 用于操作mongodb的库

const app = express();
app.use(express.json());
const port = 3000;

// 2. 连接到你的 MongoDB Atlas 数据库
// 把下面的 <username>, <password>, 和 cluster... 替换成你自己的信息！
const dbURI = 'mongodb+srv://zhangtl0206_db_user:ztl123456@cluster0.6yy0nc3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(dbURI)
  .then((result) => {
    console.log('成功连接到 MongoDB 数据库！');
    // 只有成功连接到数据库后，才启动服务器
    app.listen(port, () => {
      console.log(`服务器已成功启动，正在监听 http://localhost:${port}`);
    });
  })
  .catch((err) => console.log(err));

// 3. 定义用户数据的蓝图(Schema)
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true // 设为必填项
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true // 手机号必须是唯一的
  },
  password: {
    type: String,
    required: true
  }
}, { timestamps: true }); // timestamps 会自动添加 createdAt 和 updatedAt 字段

// 4. 根据蓝图创建“模型” (Model)
// 模型是我们用来操作数据库的句柄
const User = mongoose.model('User', userSchema);

// 5. 升级你的注册接口
// 我们把它变成一个 async 函数，这样就可以用 await 了
app.post('/api/register', async (req, res) => {
  try {
    const { username, phoneNumber, password } = req.body;

    // (未来：在这里加入服务器端验证逻辑，比如检查手机号格式、密码强度等)

    // (未来：在这里加入密码加密逻辑)

    // 创建一个新的用户实例
    const newUser = new User({
      username,
      phoneNumber,
      password // 注意：现在还是明文密码，这是不安全的！我们后面会解决。
    });

    // 将新用户保存到数据库
    await newUser.save();

    res.status(201).json({
      code: 0,
      message: '注册成功，用户信息已存入数据库！'
    });

  } catch (error) {
    // 处理错误，比如手机号重复
    if (error.code === 11000) { // 11000 是 MongoDB 的唯一键冲突错误码
      return res.status(400).json({ code: 1001, message: '手机号已被注册' });
    }
    // 其他错误
    console.error('注册时发生错误:', error);
    res.status(500).json({ code: 5000, message: '服务器内部错误' });
  }
});