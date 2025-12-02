import { User } from '../models/user.js';
import { Meme } from '../models/meme.js';
import { Notification } from '../models/notification.js';
import { runAIAudit } from '../services/aiReview.js';

export const getPendingMemeList = async (req, res) => {
  try {
    const reviewerToken = req.headers['token'];
    if (!reviewerToken) {
      return res.status(401).json({ code: 1010, message: '未提供审核员身份验证信息' });
    }
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
    // if (meme.status !== 'pending') {
    //   return res.status(400).json({ code: 1012, message: '该模因不在待审核状态' });
    // }
    if (action === 'reject') {
        meme.status = 'banned';
        await meme.save();
        // 消息推送
        await Notification.create({
          user: meme.author, // Assuming memeId is the user ID, adjust if necessary
          type: 'work',
          message: `您的模因${meme.title || ''}已被拒绝并下架。原因：${req.body.description || "违反社区作品规范条例"}。`,
        });
        return res.status(200).json({ code: 0, message: `模因${meme.title || ''}已被拒绝并下架。原因：${req.body.description || "违反社区作品规范条例"}。` });
    } else if (action === 'approve') {
        meme.status = 'active';
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

export const aiReviewMeme = async (req, res) => {
  try {
    const reviewerToken = req.headers['token'];
    if (!reviewerToken) {
      return res.status(401).json({ code: 1010, message: '未提供审核员身份验证信息' });
    }
    // TODO: 验证审核员身份

    const memeId = req.params.id;
    const meme = await Meme.findById(memeId).populate('author', 'username');
    if (!meme) {
      return res.status(404).json({ code: 1004, message: '模因不存在' });
    }

    const host = req.get('host');
    const baseUrl = host ? `${req.protocol}://${host}` : '';
    let imageUrl = meme.imageUrl || '';
    if (imageUrl && !/^https?:\/\//i.test(imageUrl)) {
      imageUrl = imageUrl.startsWith('/') ? `${baseUrl}${imageUrl}` : `${baseUrl}/${imageUrl}`;
    }

    const { raw, parsed } = await runAIAudit({
      title: meme.title,
      description: meme.description,
      createdAt: meme.createdAt,
      status: meme.status,
      author: { username: meme.author?.username },
      imageUrl,
    });

    res.status(200).json({
      code: 0,
      message: 'AI 审核完成',
      result: parsed,
      raw,
    });
  } catch (error) {
    if (error.message.includes('GLM_API_KEY')) {
      return res.status(503).json({ code: 1301, message: 'AI 审核未配置，请联系管理员', detail: error.message });
    }
    res.status(500).json({
      code: 1000,
      message: 'AI 审核失败',
      error: error.message,
    });
  }
};
