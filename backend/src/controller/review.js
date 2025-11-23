import { User } from '../models/user.js';
import { Meme } from '../models/meme.js';

export const getPendingMemeList = async (req, res) => {
  try {
    // const reviewerUsername = req.headers['token'];
    // if (!reviewerUsername) {
    //   return res.status(401).json({ code: 1010, message: '未提供审核员身份验证信息' });
    // }
    // TODO: 验证审核员身份

    const pendingMemes = await Meme.find({ status: 'pending' }).sort({ createdAt: -1 });
    // 构建id列表
    const pendingMemeIds = pendingMemes.map(meme => meme._id);

    res.status(200).json({ 
        code: 0, 
        message: '成功获取待审核模因列表', 
        memeIds: pendingMemeIds 
    });
  } catch (error) {
    res.status(500).json({
      code: 1000,
        message: '服务器内部错误，获取待审核模因列表失败',
        error: error.message,
        stack: error.stack,
    });
  }
};