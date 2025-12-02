import { User } from '../models/user.js';
import { Meme } from '../models/meme.js';
import { Notification } from '../models/notification.js';

export const getPendingMemeList = async (req, res) => {
  try {
    const reviewerToken = req.headers['token'];
    if (!reviewerToken) {
      return res.status(401).json({ code: 1010, message: '未提供审核员身份验证信息' });
    }
    // TODO: 验证审核员身份

    const PENDINGMemes = await Meme.find({ status: 'PENDING' }).sort({ createdAt: -1 });
    // 构建id列表
    const PENDINGMemeIds = PENDINGMemes.map(meme => meme._id);

    res.status(200).json({ 
        code: 0, 
        message: '成功获取待审核模因列表', 
        memeIds: PENDINGMemeIds 
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

export const reviewMeme = async (req, res) => {
  try {
    const reviewerToken = req.headers['token'];
    if (!reviewerToken) {
      return res.status(401).json({ code: 1010, message: '未提供审核员身份验证信息' });
    }
    // TODO: 验证审核员身份

    const memeId = req.params.id;
    const action = req.body.action; // 'approve' 或 'reject'
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ code: 1011, message: '无效的审核操作' });
    }

    
    const meme = await Meme.findById(memeId);
    if (!meme) {
      return res.status(404).json({ code: 1004, message: '模因不存在' });
    }
    // // TODO: 暂时忽略模因状态
    // if (meme.status !== 'PENDING') {
    //   return res.status(400).json({ code: 1012, message: '该模因不在待审核状态' });
    // }
    if (action === 'reject') {
        meme.status = 'BANNED';
        await meme.save();
        // 消息推送
        await Notification.create({
          user: meme.author, // Assuming memeId is the user ID, adjust if necessary
          type: 'work',
          message: `您的模因${meme.title || ''}已被拒绝并下架。原因：${req.body.description || "违反社区作品规范条例"}。`,
        });
        return res.status(200).json({ code: 0, message: `模因${meme.title || ''}已被拒绝并下架。原因：${req.body.description || "违反社区作品规范条例"}。` });
    } else if (action === 'approve') {
        meme.status = 'ACTIVE';
        await meme.save();
        // 消息推送
        await Notification.create({
          user: meme.author,
          type: 'work',
          message: `您的模因${meme.title || ''}已被通过审核并上架。`,
        });
        return res.status(200).json({ code: 0, message: '模因已通过审核并上架' });
    }
    } catch (error) {
    res.status(500).json({
        code: 1000,
        message: '服务器内部错误，审核模因失败',
        error: error.message,
        stack: error.stack,
    });
  }
};
