import { Meme } from '../models/meme.js';
import { User } from '../models/user.js';

import * as Const from '../configs/const.js';

// 搜索模因
export const searchMeme = async (req, res) => {
  try {
    const { keyword } = req.query;
    if (!keyword || keyword.length === 0) {
      return res.status(400).json({ message: '请输入搜索关键词' });
    }

    // 构造正则表达式，支持不连续字符匹配
    const pattern = keyword.split('').map(c => escapeRegExp(c)).join('.*');
    const regex = new RegExp(pattern, 'i'); // 不区分大小写

    // 搜索标题
    const memes = await Meme.find({ title: { $regex: regex } })
      .select('_id title ticker imageUrl description author createdAt likes')
      .populate('author', 'username nickname -_id');

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