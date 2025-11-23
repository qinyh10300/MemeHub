import fs from 'fs';
import path from 'path';
import pkg from 'jsonwebtoken';
const { verify } = pkg;

import { DEFAULT_AVATARS } from '../configs/avatar.js';
import * as Const from '../configs/const.js';
import { User } from '../models/user.js';

function extractToken(req) {
  return req.headers.token
    || req.headers.authorization?.replace('Bearer ', '')
    || req.body?.token
    || '';
}

async function resolveUser(token) {
  if (!token) {
    return null;
  }

  let user = await User.findOne({ username: token });
  if (user) {
    return user;
  }

  try {
    const decoded = verify(token, process.env.JWT_SECRET);
    const userId = decoded?.user?.id;
    if (!userId) {
      return null;
    }
    user = await User.findById(userId);
  } catch (err) {
    return null;
  }
  return user;
}

function cleanupLocalAvatar(avatarUrl) {
  if (!avatarUrl || !avatarUrl.includes('/avatars/')) {
    return;
  }

  const filename = avatarUrl.split('/').pop()?.split('?')[0];
  if (!filename) {
    return;
  }

  const filePath = path.join(Const.AVATAR_DIR, filename);
  if (fs.existsSync(filePath)) {
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error('删除旧头像失败:', err);
      }
    });
  }
}

export function getDefaultAvatars(req, res) {
  const data = DEFAULT_AVATARS.map((url, index) => ({
    id: index,
    url,
  }));

  res.status(200).json({
    code: 0,
    message: '获取默认头像成功',
    data,
  });
}

export async function selectDefaultAvatar(req, res) {
  try {
    const { avatarId } = req.body;
    const parsedId = Number(avatarId);

    if (Number.isNaN(parsedId) || parsedId < 0 || parsedId >= DEFAULT_AVATARS.length) {
      return res.status(400).json({ code: 1004, message: '无效的头像编号' });
    }

    const token = extractToken(req);
    const user = await resolveUser(token);

    if (!user) {
      return res.status(401).json({ code: 1002, message: '用户不存在或令牌无效' });
    }

    cleanupLocalAvatar(user.avatar);

    const avatarUrl = DEFAULT_AVATARS[parsedId];
    user.avatar = avatarUrl;
    await user.save();

    return res.status(200).json({
      code: 0,
      message: '头像更新成功',
      avatar: avatarUrl,
    });
  } catch (error) {
    console.error('选择默认头像失败:', error);
    return res.status(500).json({ code: 5000, message: '选择默认头像失败' });
  }
}

