import 'dotenv/config'; // 必须在最顶部，以确保所有地方都能用到环境变量

import express, { json } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

import * as Auth from './controller/auth.js';
import * as Work from './controller/work.js';
import * as CommentCtrl from './controller/commentCtrl.js';
import * as Search from './controller/search.js';
import * as Profile from './controller/profile.js';
import * as Avatar from './controller/avatar.js';
import * as Const from './configs/const.js';
import * as Review from './controller/review.js';
import { Token } from './models/token.js';

import * as MessageController from './controller/message.js';
import * as C2CController from './controller/c2cCtrl.js';

const app = express();
app.use(cors());
app.use(express.json());
const port = 3000;

// 确保 uploads 文件夹存在
if (!fs.existsSync(Const.MEME_DIR)) {
  fs.mkdirSync(Const.MEME_DIR);
}
// 确保头像文件夹存在
if (!fs.existsSync(Const.AVATAR_DIR)) {
  fs.mkdirSync(Const.AVATAR_DIR);
}
// 确保表情包输出文件夹存在
if (!fs.existsSync(Const.STICKER_DIR)) {
  fs.mkdirSync(Const.STICKER_DIR);
}

// 配置 multer 用于保存模因文件
const memeStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, Const.MEME_DIR);
  },
  filename: (req, file, cb) => {
    // 保证文件名唯一
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage: memeStorage });

// 配置 multer 用于保存头像文件
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, Const.AVATAR_DIR);
  },
  filename: (req, file, cb) => {
    // 使用用户ID作为文件名，保证唯一性
    const token = req.headers.token || req.headers.authorization?.replace('Bearer ', '');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${uniqueSuffix}${ext}`);
  }
});
const uploadAvatar = multer({ 
  storage: avatarStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 限制文件大小为5MB
  },
  fileFilter: (req, file, cb) => {
    // 只允许图片文件
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件（jpeg, jpg, png, gif, webp）'));
    }
  }
});


// 每30秒检查一次预约订单是否可以完成
setInterval(async () => {
  try {
    // 先查出你关心的 token 列表，比如有挂单的
    const tokens = await Token.find({ hasPendingOrder: true });

    for (const token of tokens) {
      token.checkOrderFulfillment().catch(err => {
        console.error(`checkOrderFulfillment error for token ${token._id}:`, err);
      });
    }
  } catch (e) {
    console.error('periodic checkOrderFulfillment failed:', e);
  }
}, Const.CHECK_ORDER_INTERVAL_MS);

app.get('/api/health', (req, res) => {
  res.status(200).send('OK');
});


// 用户个人信息

// 注册
app.post('/api/register', Auth.register);
// 审核员注册（仅后端）
app.post('/api/reviewer/register', Auth.registerReviewer);
// 登录
app.post('/api/login', Auth.login);
// 重设密码
app.post('/api/reset-password', Auth.resetPassword);
// 更新昵称
app.put('/api/update-nickname', Auth.updateNickname);
app.patch('/api/update-nickname', Auth.updateNickname); // 也支持 PATCH 方法
// 临时添加 GET 方法用于测试（仅测试用，生产环境应移除）
app.get('/api/update-nickname', (req, res) => {
  res.status(405).json({ 
    code: 1007, 
    message: '请使用 PUT 或 PATCH 方法更新昵称，GET 方法不支持。请在 Postman 中使用 PUT 方法，并设置 Body 为 JSON 格式。' 
  });
});
// 获取用户个人主页数据（支持通过用户名或用户ID查询）
app.get('/api/user/:username', Profile.getUserProfile);
// 关注/取消关注用户
app.post('/api/user/:username/follow', Profile.followUser);
// 上传用户头像
app.post('/api/upload-avatar', uploadAvatar.single('avatar'), Profile.uploadAvatar);
// 默认头像
app.get('/api/avatars/default', Avatar.getDefaultAvatars);
// 选择默认头像
app.post('/api/avatars/select', Avatar.selectDefaultAvatar);
// 如果使用GET方法访问关注API，返回错误提示
app.get('/api/user/:username/follow', (req, res) => {
  res.status(405).json({
    code: 1009,
    message: '请使用 POST 方法关注用户。在 Postman 中：1. 选择 POST 方法 2. URL: /api/user/:username/follow 3. Headers 中添加 token: 你的用户名'
  });
});


// 模因操作

app.use('/api/memefiles', express.static(Const.MEME_DIR));
// 兼容前端以 /api 开头访问头像资源
app.use('/api/avatars', express.static(Const.AVATAR_DIR));
// 兼容前端以 /api 开头访问表情包资源
app.use('/api/stickers', express.static(Const.STICKER_DIR));
// 接收前端的文件并创建模因
app.post('/api/upload-meme', upload.single('file'), Work.createMeme);
// 返回单个模因的详细信息
app.get('/api/meme/:id', Work.getMemeDetail);
// 返回指定模因id列表的详细信息（预览页）
app.post('/api/meme/list', Work.getListMeme);
// 返回预览页的模因列表
app.get('/api/meme-list', Work.getMemeList);
// 删除模因
app.delete('/api/meme/:id', Work.deleteMeme);
// 更新模因（重新提交审核）
// app.put('/api/meme/:id', upload.single('file'), Work.updateMeme);
// 点赞模因
app.post('/api/meme/:id/like', Work.likeMeme);
// 收藏模因
app.post('/api/meme/:id/favorite', Work.favoriteMeme);

// 搜索模因
app.get('/api/search-meme', Search.searchMeme);
// 搜索用户
app.get('/api/search-user', Search.searchUser);

// 虚拟货币操作

// 查询Token价格
app.get('/api/meme/:id/token/price', Work.getTokenPriceByAmount);
// 查看历史价格
app.get('/api/meme/:id/token/price-history', Work.getTokenPriceHistoryByTime);
// 购买Token
app.post('/api/meme/:id/token/buy', Work.buyTokenByAmount);
// 出售Token
app.post('/api/meme/:id/token/sell', Work.sellTokenByAmount);
// 预约买入Token
app.post('/api/meme/:id/token/buy-reservation', Work.buyTokenReservation);
// 预约卖出Token
app.post('/api/meme/:id/token/sell-reservation', Work.sellTokenReservation);
// 取消预约
app.post('/api/order/:id/cancel', Work.cancelOrderReservation);
// 手动检查订单是否完成（测试用）
app.post('/api/meme/:id/check-orders', Work.manualCheckOrderFulfillment);
// 根据 ticker 查询用户持有的代币数量
app.get('/api/token/by-ticker/:ticker', Work.getUserTokenByTicker);
// 获取用户的挂单列表
app.get('/api/user/:username/orders', Work.getUserOrders);

// 排行榜
import * as LeaderboardCtrl from './controller/leaderboard.js';
app.get('/api/leaderboard', LeaderboardCtrl.getLeaderboard);
app.get('/api/meme/:id/trend', LeaderboardCtrl.getMemeTrend);
app.get('/api/memes/compare', LeaderboardCtrl.compareMemes);
app.get('/api/memes/search-for-compare', LeaderboardCtrl.searchMemesForCompare);

// 用户功能 (自选、价格预警、成就、创作者数据、推荐)
import * as UserFeatures from './controller/userFeatures.js';
app.get('/api/watchlist', UserFeatures.getWatchlist);
app.post('/api/watchlist', UserFeatures.addToWatchlist);
app.delete('/api/watchlist/:memeId', UserFeatures.removeFromWatchlist);
app.get('/api/price-alerts', UserFeatures.getPriceAlerts);
app.post('/api/price-alerts', UserFeatures.createPriceAlert);
app.delete('/api/price-alerts/:alertId', UserFeatures.deletePriceAlert);
app.post('/api/user/coins', UserFeatures.updateCoins);
app.get('/api/achievements', UserFeatures.getUserAchievements);
app.get('/api/creator-stats', UserFeatures.getCreatorStats);
app.get('/api/recommendations', UserFeatures.getRecommendations);

// 社区投票
import * as PollCtrl from './controller/pollCtrl.js';
app.get('/api/polls', PollCtrl.getPolls);
app.post('/api/polls', PollCtrl.createPoll);
app.get('/api/polls/stats', PollCtrl.getPollStats);
app.get('/api/polls/:pollId', PollCtrl.getPollDetail);
app.post('/api/polls/:pollId/vote', PollCtrl.vote);

// 评论操作

// 评论模因
app.post('/api/meme/:id/comment', CommentCtrl.commentMeme);
// 读取指定模因的评论区
app.get('/api/meme/:id/comments', CommentCtrl.getMemeComments);
// 读取指定评论id列表的评论信息
app.post('/api/comment/list', CommentCtrl.getListComment);
// 点赞评论
app.post('/api/comment/:id/like', CommentCtrl.likeComment);
// 删除评论
app.delete('/api/comment/:id', CommentCtrl.deleteComment);


// 私信功能
app.post('/api/message/send', MessageController.sendMessage);
app.get('/api/message/conversations', MessageController.getConversations);
app.get('/api/message/history/:targetId', MessageController.getHistory);
app.delete('/api/message/:messageId', MessageController.deleteMessage);
app.get('/api/message/unread-count', MessageController.getUnreadCount);
app.post('/api/message/sticker/generate', MessageController.generateSticker);

// 审核操作

// 获取待审核模因列表
app.get('/api/review/pending-meme-list', Review.getPendingMemeList);
// 审核模因（通过或拒绝）
app.post('/api/review/meme/:id', Review.reviewMeme);
// AI 审核
app.post('/api/review/meme/:id/ai', Review.aiReviewMeme);

// C2C 交易
app.post('/api/c2c/create', C2CController.createC2CTrade);
app.get('/api/c2c/outgoing', C2CController.getOutgoingTrades);
app.get('/api/c2c/incoming', C2CController.getIncomingTrades);
app.get('/api/c2c/incoming/pending-count', C2CController.getIncomingPendingCount);
app.post('/api/c2c/:id/accept', C2CController.acceptTrade);
app.post('/api/c2c/:id/reject', C2CController.rejectTrade);
app.post('/api/c2c/:id/cancel', C2CController.cancelTrade);

// 消息推送

// 获取用户的全部消息
app.get('/api/notifications', Profile.getNotifications);
// 标记消息为已读
app.post('/api/mark-notification-read', Profile.markNotificationListRead);

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

