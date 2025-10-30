import { genSalt, hash, compare } from 'bcryptjs';
import pkg from 'jsonwebtoken';
const { sign } = pkg;

import { User } from '../models/user.js';

// 注册
export async function register(req, res) {
  try {
    const { username, password } = req.body;
    const salt = await genSalt(10);
    const hashedPassword = await hash(password, salt);

    const newUser = new User({
      username,
      password: hashedPassword
    });

    await newUser.save();

    res.status(201).json({
      code: 0,
      message: '注册成功，用户信息已存入数据库！'
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ code: 1001, message: '用户名已被注册' });
    }
    console.error('注册时发生错误:', error);
    res.status(500).json({ code: 5000, message: '服务器内部错误' });
  }
}

// 登录
export async function login(req, res) {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ code: 1002, message: '用户名或密码错误' });
    }
    const isMatch = await compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ code: 1002, message: '用户名或密码错误' });
    }
    const payload = { user: { id: user.id } };
    sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
      (err, token) => {
        if (err) throw err;
        res.status(201).json({
          code: 0,
          message: '登录成功',
          token
        });
      }
    );
  } catch (error) {
    console.error('登录时发生错误:', error);
    res.status(500).json({ code: 5000, message: '服务器内部错误' });
  }
}

// 重设密码
export async function resetPassword(req, res) {
  try {
    const { phoneNumber, verificationCode, newPassword } = req.body;
    const user = await User.findOne({
      phoneNumber,
      verificationCode,
      verificationCodeExpiresAt: { $gt: Date.now() }
    });
    if (!user) {
      return res.status(400).json({ code: 1005, message: '验证码错误或已过期' });
    }
    const salt = await genSalt(10);
    user.password = await hash(newPassword, salt);
    user.verificationCode = undefined;
    user.verificationCodeExpiresAt = undefined;
    await user.save();
    res.json({ code: 0, message: '密码重设成功' });
  } catch (error) {
    console.error('重设密码时发生错误:', error);
    res.status(500).json({ code: 5000, message: '服务器内部错误' });
  }
}