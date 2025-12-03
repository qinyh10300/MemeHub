import { Meme } from '../models/meme.js';
import { User } from '../models/user.js';

import * as Const from '../configs/const.js';

// 搜索模因
export const searchMeme = async (req, res) => {
  try {
    const keyword = req.query.q || '';
    // 支持 ?sortBy=time 或 ?sortBy=likes
    const sortBy = req.query.sortBy === 'hot' ? 'likes' : 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1; // 默认倒序

    if (!keyword || keyword.length === 0) {
      return res.status(400).json({ message: '请输入搜索关键词' });
    }

    // 构造正则表达式，支持不连续字符匹配
    const pattern = keyword.split('').map(c => escapeRegExp(c)).join('.*');
    const regex = new RegExp(pattern, 'i'); // 不区分大小写

    // 构造查询条件，任意字段匹配
    const query = {
      status: 'active',
      $or: [
        { title: { $regex: regex } },
        { ticker: { $regex: regex } },
        { description: { $regex: regex } }
      ]
    };

    // 查询并排序
    const memes = await Meme.find(query)
      .select('_id title ticker imageUrl description author createdAt likes')
      .populate('author', 'username nickname -_id')
      .sort({ [sortBy]: sortOrder });

    const memeIds = memes.map(meme => meme._id);

    res.status(200).json({ memeIds });
  } catch (error) {
    res.status(500).json({
      message: '搜索模因失败',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...error
      }
    });
  }
};

// 工具函数：转义正则特殊字符
function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const searchUser = async (req, res) => {
  try {
    const keyword = req.query.q || '';
    
    if (!keyword || keyword.length === 0) {
      return res.status(400).json({ message: '请输入搜索关键词' });
    }

    // 构造正则表达式，支持不连续字符匹配
    const pattern = keyword.split('').map(c => escapeRegExp(c)).join('.*');
    const regex = new RegExp(pattern, 'i'); // 不区分大小写
    // 构造查询条件，任意字段匹配
    const query = {
      $or: [
        { username: { $regex: regex } },
        { nickname: { $regex: regex } }
      ]
    };
    // 查询用户，筛选active用户
    const users = await User.find({ ...query, status: 'active' })
      .select('-_id username nickname avatarUrl bio followersCount followingCount memesCount')
      .sort({ followersCount: -1 }); // 按关注者数量降序排序
    const userIds = users.map(user => user.username);

    res.status(200).json({ userIds });
  } catch (error) {
    res.status(500).json({
      message: '搜索用户失败',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...error
      }
    });
  }
};