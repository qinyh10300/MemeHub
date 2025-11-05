import 'dotenv/config'; // 必须在最顶部，以确保所有地方都能用到环境变量

import express, { json } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import multer from 'multer';
import fs from 'fs';

import * as Auth from './controller/auth.js';
import * as Work from './controller/work.js';

const app = express();
app.use(cors());
app.use(json());
const port = 3000;

// 确保 uploads 文件夹存在
if (!fs.existsSync('/uploads')) {
  fs.mkdirSync('/uploads');
}

// 配置 multer 用于保存文件
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, '/uploads/');
  },
  filename: (req, file, cb) => {
    // 保证文件名唯一
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });
app.use('/uploads', express.static('uploads'));


// 用户个人信息

// 注册
app.post('/api/register', Auth.register);
// 登录
app.post('/api/login', Auth.login);
// 重设密码
app.post('/api/reset-password', Auth.resetPassword);


// 模因操作

// 接收前端的文件并创建模因
app.post('/api/upload-meme', upload.single('file'), Work.createMeme);


// 2. 连接到MongoDB数据库
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

