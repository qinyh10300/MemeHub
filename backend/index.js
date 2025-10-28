
require('dotenv').config(); // 必须在最顶部，以确保所有地方都能用到环境变量
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
// ... 其他 require 语句
const express = require('express');
const mongoose = require('mongoose'); // 1. 引入 mongoose
const cors = require('cors');

// 中间件
const app = express();
app.use(cors());
app.use(express.json());
const port = 3000;

// 2. 连接到你的 MongoDB Atlas 数据库
const dbURI = process.env.MONGODB_URI;


mongoose.connect(dbURI)
  .then((result) => {
    console.log('成功连接到 MongoDB 数据库！');
    // 只有成功连接到数据库后，才启动服务器
    app.listen(port, () => {
      console.log(`服务器已成功启动，正在监听 http://localhost:${port}`);
    });
  })
  .catch((err) => console.log(err));

// 3. 定义用户数据的“蓝图” (Schema)
const userSchema = new mongoose.Schema({
  // ... username, password 字段不变
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  // --- 新增字段 ---
  verificationCode: String,
  verificationCodeExpiresAt: Date,
}, { timestamps: true });

// 4. 根据蓝图创建“模型” (Model)
// 模型是我们用来操作数据库的句柄
const User = mongoose.model('User', userSchema);

// 注册
// 我们把它变成一个 async 函数，这样就可以用 await 了
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    // (未来：在这里加入服务器端验证逻辑，比如检查手机号格式、密码强度等)

      // --- 核心修改：对密码进行哈希处理 ---
    const salt = await bcrypt.genSalt(10); // 生成盐，10 是复杂度
    const hashedPassword = await bcrypt.hash(password, salt); // 生成哈希密码

    const newUser = new User({
      username,
      password: hashedPassword // 存入数据库的是哈希后的密码
    });

    // 将新用户保存到数据库
    await newUser.save();

    res.status(201).json({
      code: 0,
      message: '注册成功，用户信息已存入数据库！'
    });

  } catch (error) {
    // 处理错误，比如用户名重复
    if (error.code === 11000) { // 11000 是 MongoDB 的唯一键冲突错误码
      return res.status(400).json({ code: 1001, message: '用户名已被注册' });
    }
    // 其他错误
    console.error('注册时发生错误:', error);
    res.status(500).json({ code: 5000, message: '服务器内部错误' });
  }
});
//登录
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 1. 根据用户名查找用户
    const user = await User.findOne({ username });
    if (!user) {
      // 为了安全，不明确提示是用户不存在还是密码错误
      return res.status(401).json({ code: 1002, message: '用户名或密码错误' });
    }

    // 2. 比较密码
    // bcrypt.compare 会把用户输入的密码(password)进行哈希，然后和数据库中存储的哈希(user.password)进行比较
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ code: 1002, message: '用户名或密码错误' });
    }

    // 3. 密码匹配，生成 JWT
    const payload = {
      user: {
        id: user.id // 将用户的唯一ID存入token
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET, // 使用我们.env文件里的密钥
      { expiresIn: '1h' }, // token 有效期1小时
      (err, token) => {
        if (err) throw err;
        res.status(201).json({
          code: 0,
          message: '登录成功',
          token: token // 将 token 返回给前端
        });
      }
    );
  } catch (error) {
    console.error('登录时发生错误:', error);
    res.status(500).json({ code: 5000, message: '服务器内部错误' });
  }
});
//发送验证码
app.post('/api/send-code', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return res.status(404).json({ code: 1004, message: '该手机号未注册' });
    }

    // 1. 生成一个随机的6位数字验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    // 2. 设置验证码5分钟后过期
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // 3. 将验证码和过期时间存入数据库
    user.verificationCode = code;
    user.verificationCodeExpiresAt = expiresAt;
    await user.save();

    // 4. *** 调用短信服务商API发送短信 (此处为伪代码) ***
    console.log(`向 ${phoneNumber} 发送验证码: ${code}`);
    // sendSms(phoneNumber, `您的验证码是 ${code}，5分钟内有效。`);

    res.json({ code: 0, message: '验证码已发送，请注意查收' });

  } catch (error) {
    console.error('发送验证码时发生错误:', error);
    res.status(500).json({ code: 5000, message: '服务器内部错误' });
  }
});
//重设密码
app.post('/api/reset-password', async (req, res) => {
  try {
    const { phoneNumber, verificationCode, newPassword } = req.body;

    const user = await User.findOne({
      phoneNumber,
      verificationCode,
      verificationCodeExpiresAt: { $gt: Date.now() } // 检查验证码是否已过期
    });

    // 如果找不到用户，说明验证码错误或已过期
    if (!user) {
      return res.status(400).json({ code: 1005, message: '验证码错误或已过期' });
    }

    // 重设密码
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    // 清除已使用的验证码
    user.verificationCode = undefined;
    user.verificationCodeExpiresAt = undefined;
    await user.save();

    res.json({ code: 0, message: '密码重设成功' });

  } catch (error) {
    console.error('重设密码时发生错误:', error);
    res.status(500).json({ code: 5000, message: '服务器内部错误' });
  }
});