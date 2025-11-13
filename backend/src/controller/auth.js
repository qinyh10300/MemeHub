import { genSalt, hash, compare } from 'bcryptjs';
import pkg from 'jsonwebtoken';
const { sign, verify } = pkg;

import { User } from '../models/user.js';
import { generateNickname } from '../utils/nickname.js';

// 注册
export async function register(req, res) {
  try {
    const { username, password } = req.body;
    const salt = await genSalt(10);
    const hashedPassword = await hash(password, salt);

    // 自动生成昵称（确保唯一性）
    const nickname = await generateNickname();

    const newUser = new User({
      username,
      password: hashedPassword,
      nickname
    });

    await newUser.save();

    res.status(201).json({
      code: 0,
      message: '注册成功，用户信息已存入数据库！',
      nickname
    });
  } catch (error) {
    if (error.code === 11000) {
      // 检查是用户名重复还是昵称重复
      if (error.keyPattern?.username) {
        return res.status(400).json({ code: 1001, message: '用户名已被注册' });
      }
      if (error.keyPattern?.nickname) {
        // 昵称重复，重新生成并重试（这种情况应该很少发生）
        try {
          const { username, password } = req.body;
          const salt = await genSalt(10);
          const hashedPassword = await hash(password, salt);
          const newNickname = await generateNickname();
          const newUser = new User({
            username,
            password: hashedPassword,
            nickname: newNickname
          });
          await newUser.save();
          return res.status(201).json({
            code: 0,
            message: '注册成功，用户信息已存入数据库！',
            nickname: newNickname
          });
        } catch (retryError) {
          console.error('重试注册时发生错误:', retryError);
          return res.status(500).json({ code: 5000, message: '服务器内部错误，请稍后重试' });
        }
      }
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
    const token = sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    user.loginToken = token;
    await user.save();
    res.status(201).json({
      code: 0,
      message: '登录成功',
      token
    });
      
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

// 更新昵称
export async function updateNickname(req, res) {
  try {
    const { nickname } = req.body;
    const token = req.headers.token || req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ code: 1003, message: '未提供认证令牌' });
    }

    if (!nickname || nickname.trim().length === 0) {
      return res.status(400).json({ code: 1004, message: '昵称不能为空' });
    }

    // 验证昵称长度（可选，根据需求调整）
    if (nickname.length > 20) {
      return res.status(400).json({ code: 1004, message: '昵称长度不能超过20个字符' });
    }

    // 从 token 中获取用户信息
    // TODO: 临时方案 - 暂时使用 username 作为 token，方便测试，等最后再改回 JWT
    // 优先使用 username 方式（临时测试用）
    let user = await User.findOne({ username: token });
    
    // 如果 username 方式找不到，再尝试 JWT 验证（保留兼容性）
    if (!user) {
      try {
        const decoded = verify(token, process.env.JWT_SECRET);
        user = await User.findById(decoded.user.id);
      } catch (jwtError) {
        // JWT 验证也失败，返回错误
      }
    }

    if (!user) {
      return res.status(401).json({ code: 1002, message: '用户不存在或令牌无效' });
    }

    const trimmedNickname = nickname.trim();

    // 检查昵称是否已被其他用户使用
    const existingUser = await User.findOne({ 
      nickname: trimmedNickname,
      _id: { $ne: user._id } // 排除当前用户
    });

    if (existingUser) {
      return res.status(400).json({ code: 1006, message: '该昵称已被使用，请选择其他昵称' });
    }

    // 更新昵称
    user.nickname = trimmedNickname;
    await user.save();

    res.json({
      code: 0,
      message: '昵称更新成功',
      nickname: user.nickname
    });
  } catch (error) {
    // 处理数据库唯一性约束错误
    if (error.code === 11000 && error.keyPattern?.nickname) {
      return res.status(400).json({ code: 1006, message: '该昵称已被使用，请选择其他昵称' });
    }
    console.error('更新昵称时发生错误:', error);
    res.status(500).json({ code: 5000, message: '服务器内部错误' });
  }
}