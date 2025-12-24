import { Meme } from '../models/meme.js';
import { Token } from '../models/token.js';
import { Order } from '../models/order.js';
import { User } from '../models/user.js';
import { Comment } from '../models/comment.js';
import { Notification } from '../models/notification.js';

import * as Const from '../configs/const.js';

import fs, { stat } from 'fs';
import path from 'path';
import pkg from 'jsonwebtoken';

const { verify } = pkg;

// 创建模因
export const createMeme = async (req, res) => {
  try {
    const { title, ticker, description, withToken, website, weibo, xiaohongshu } = req.body;
    const file = req.file;
    const token = req.headers.token;
    const username = token;// TODO:暂时用username作为token内容

    // 检查title和ticker是否已存在
    const existTitle = await Meme.findOne({ title });
    if (existTitle) {
      if (file) fs.unlink(path.join(file.destination, file.filename), () => {});
      return res.status(400).json({ code: 1007, message: '该标题已存在，请更换标题' });
    }
    const existTicker = await Meme.findOne({ ticker });
    if (existTicker) {
      if (file) fs.unlink(path.join(file.destination, file.filename), () => {});
      return res.status(400).json({ code: 1008, message: '该ticker已存在，请更换ticker' });
    }

    // 检查是否上传图片
    if (!file) {
      return res.status(400).json({ code: 1009, message: '图片未上传' });
    }

    // 查找作者的用户Id
    const user = await User.findOne({ username });
    if (!user) {
      if (file) {
        fs.unlink(path.join(file.destination, file.filename), () => {});
      }
      return res.status(401).json({ code: 1002, message: '用户不存在，请先登录' });
    }

    // 检查是否发行虚拟货币
    if (withToken === 'true') {
      // 检查用户余额是否足够
      if (user.coins < Const.TOKEN_USDT_COST) {
        if (file) {
          fs.unlink(path.join(file.destination, file.filename), () => {});
        }
        return res.status(400).json({ code: 1010, message: 'USDT 余额不足，无法发行虚拟货币' });
      }
      // 扣除用户 USDT
      user.coins -= Const.TOKEN_USDT_COST;
      await user.save();
    }

    // 先用原文件名创建meme，后续再重命名
    const newMeme = new Meme({ 
      title, 
      ticker, 
      description, 
      author: user._id,
      social: {
        website: website || '',
        weibo: weibo || '',
        xiaohongshu: xiaohongshu || ''
      }
    });
    await newMeme.save();

    if (withToken === 'true') {
      newMeme.withToken = true;
      await newMeme.save();
      // 创建对应的Token
      const newToken = new Token({
        meme: newMeme._id
      });
      await newToken.updatePrice(null, -Const.TOKEN_USDT_LIQUIDITY / Const.TOKEN_INIT_PRICE);
      await newToken.save();
    }

    // 只有创建成功后才重命名文件
    const ext = path.extname(file.originalname);
    const newFilename = `${newMeme._id}${ext}`;
    const oldPath = path.join(file.destination, file.filename);
    const newPath = path.join(file.destination, newFilename);

    // 加入用户作品列表
    user.workList.push(newMeme._id);
    await user.save();

    // 检查是否已存在同名文件，若存在则删除原文件，保留新文件
    if (fs.existsSync(newPath)) {
      fs.unlinkSync(newPath); // 删除原来的同名文件
    }
    
    // 手动设置 imageUrl 并保存（确保路径以 / 开头）
    newMeme.imageUrl = `/api/${Const.MEME_DIR}${newFilename}`;
    await newMeme.save();

    fs.renameSync(oldPath, newPath);

    const memeData = await Meme.findById(newMeme._id)
      .select('title imageUrl description author createdAt likes ticker _id withToken')
      .populate('author', 'username -_id')
      .lean();

    res.status(201).json({
      code: 0,
      message: '创建模因成功',
      data: memeData
    });
  } catch (error) {
    // 如果有文件，出错时也删除
    if (req.file) {
      fs.unlink(path.join(req.file.destination, req.file.filename), () => {});
    }
    // 输出详细错误信息
    console.error('创建模因失败:', error);
    res.status(500).json({
      code: 5000,
      message: '创建模因失败',
      error: process.env.NODE_ENV === 'development' ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    });
  }
};

export const getMemeDetail = async (req, res) => {
  try {
    const memeId = req.params.id;
    const userToken = req.headers.token;
    const username = userToken;// TODO:暂时用username作为token内容

    const meme = await Meme.findById(memeId)
      .select('title imageUrl ticker description author createdAt likes favorites status likeList withToken')
      .populate('author', 'username nickname avatar bio -_id');
    if (!meme) {
      return res.status(404).json({ message: '模因不存在' });
    }
    
    // 获取虚拟货币信息
    let tokenInfo = null;
    if (meme.withToken) {
      const token = await Token.findOne({ meme: meme._id });
      if (token) {
        // 按时间降序排序并保留前20条
        const sortedHistory = [...token.priceHistory]
          .sort((a, b) => new Date(b.time) - new Date(a.time))
          .slice(0, Const.PRICE_HISTORY_LIMIT);

        // 批量查找涉及的用户
        const userIds = sortedHistory
          .map(item => item.user)
          .filter(id => !!id);
        const users = await User.find({ _id: { $in: userIds } }).select('nickname username');
        const userMap = new Map(users.map(u => [u._id.toString(), u.nickname || u.username]));
        
        // 替换 user 字段为 nickname
        const priceHistoryWithNickname = sortedHistory.map(item => ({
          time: item.time,
          user: item.user ? userMap.get(item.user.toString()) || '' : '',
          side: item.side,
          amount: item.amount,
          price: item.price,
          newPrice: item.newPrice,
          // _id: item._id
        }));

        let changeRate = 0;
        // 若模因创建时间不足5h，与0.1比较；若超过5h，则与>5h的最近一次交易后价格比较
        const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000);
        if (token.createdAt > fiveHoursAgo) {
          // console.log('Token创建时间不足5h，涨跌幅与初始价格比较');
          changeRate = ((token.price - Const.TOKEN_INIT_PRICE) / Const.TOKEN_INIT_PRICE);
        } else
        {
          const historyAfter5h = priceHistoryWithNickname.filter(item => new Date(item.time) < fiveHoursAgo);
          if (historyAfter5h.length > 0) {
            const priceAt5h = historyAfter5h[0].newPrice;
            changeRate = ((token.price - priceAt5h) / priceAt5h);
            // console.log(`Token创建时间超过5h，涨跌幅与5h前价格比较${priceAt5h}: ${token.price}，变化率${changeRate}`);
          } else {
            // console.log('Token创建时间超过5h，但5h前无交易记录，涨跌幅与初始价格比较');
            changeRate = ((token.price - Const.TOKEN_INIT_PRICE) / Const.TOKEN_INIT_PRICE) ;
          }
        }

        tokenInfo = { 
          price: token.price,
          changeRate: changeRate,
          priceHistory: priceHistoryWithNickname
        }
      }
    } else {
      tokenInfo = null;
    }

    // 当前用户关于该模因的信息
    let is_author = false;
    let is_liked = false;
    let is_favorited = false;
    let tokenAmount = 0;
    let tokenValue = 0;

    const user = await User.findOne({ username });
    if (user) {
      is_author = meme.author.username === username;

      is_liked = Array.isArray(meme.likeList) && meme.likeList.some(id => id.toString() === user._id.toString());
      is_favorited = Array.isArray(user.favoriteList) && user.favoriteList.includes(meme._id);
      if (meme.withToken) {
        const token = await Token.findOne({ meme: meme._id });
        if (token) {
          const userTokenEntry = user.tokenList.find(entry => entry.token.toString() === token._id.toString());
          if (userTokenEntry) {
            tokenAmount = userTokenEntry.amount;
            tokenValue = token.getPriceByAmount(-tokenAmount);
          }
        }
      }
    }

    const memeObj = meme.toObject();
    delete memeObj.likeList;
    res.status(200).json({
      ...memeObj,
      token : tokenInfo,
      userinfo: {
        is_author,
        is_liked,
        is_favorited,
        tokenAmount,
        tokenValue
      }
    });
  } catch (error) {
    res.status(500).json({
      message: '获取模因详情失败',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...error
      }
    });
  }
};

export const getListMeme = async (req, res) => {
  try {
    const memeIds = req.body.memeIds;
    const token = req.headers.token;
    const username = token; // TODO:暂时用username作为token内容

    // 查询所有存在的 meme
    const memes = await Meme.find({ _id: { $in: memeIds } })
      .select('_id title imageUrl ticker description author createdAt likes')
      .populate('author', 'username nickname avatar bio -_id')
      .lean();

    // 构建返回列表，按请求顺序，缺失的id补404
    const memeMap = new Map(memes.map(meme => [meme._id.toString(), meme]));
    const result = memeIds.map(id => {
      const meme = memeMap.get(id);
      if (meme) {
        return meme;
      } else {
        return { _id: null };
      }
    });

    res.status(200).json({ memes: result });
  } catch (error) {
    res.status(500).json({
      message: '获取模因列表详情失败',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...error
      }
    });
  }
};

export const getMemeList = async (req, res) => {
  try {
    // 支持 ?sortBy=time 或 ?sortBy=likes
    const sortBy = req.query.sortBy === 'hot' ? 'likes' : 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1; // 默认倒序

    const memes = await Meme.find({ status: 'active' })// 筛选active
      .select('_id likes createdAt')
      .sort({ [sortBy]: sortOrder });

    // res.status(200).json(memes);
    
    const memeIds = memes.map(meme => meme._id);
    res.status(200).json({ memeIds });
  } catch (error) {
    res.status(500).json({
      message: '获取模因列表失败',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...error
      }
    });
  }
};

export const deleteMeme = async (req, res) => {
  try {
    const memeId = req.params.id;
    const token = req.headers.token;
    const username = token; // TODO:暂时用username作为token内容

    // 删除评论区
    const comments = await Comment.find({ meme: memeId });
    for (const comment of comments) {
      await Comment.findByIdAndDelete(comment._id);
    }

    // 查找模因
    const meme = await Meme.findById(memeId);
    if (!meme) {
      return res.status(404).json({ message: `模因${memeId}不存在` });
    }

    // 检查用户权限
    const user = await User.findOne({ username });
    if (!user || meme.author.toString() !== user._id.toString()) {
      return res.status(403).json({ message: `没有权限删除模因${memeId}` });
    }
    
    // 从用户作品列表中移除
    user.workList.pull(meme._id);
    await user.save();

    // 删除模因
    await Meme.findByIdAndDelete(memeId);
    res.status(200).json({ message: `模因${memeId}已删除` });
  } catch (error) {
    res.status(500).json({
      message: '删除模因失败',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...error
      }
    });
  }
};

export const likeMeme = async (req, res) => {
  try {
    const memeId = req.params.id;
    const token = req.headers.token;
    const username = token; // TODO:暂时用username作为token内容

    // 查找模因
    const meme = await Meme.findById(memeId);
    if (!meme) {
      return res.status(404).json({ message: `模因${memeId}不存在` });
    }

    // 查找用户
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: `用户${username}不存在` });
    }

    // 检查用户是否已点赞
    const isLiked = meme.likeList.includes(user._id);
    if (isLiked) {
      // 取消点赞
      meme.likeList.pull(user._id);
    } else {
      // 点赞
      meme.likeList.push(user._id);
      await Notification.create({
        user: meme.author,
        type: 'interaction',
        message: `您的模因'${meme.title.substring(0, 100)}'收到来自${user.nickname || user.username}的点赞`,
      });
    }
    // 更新点赞数
    meme.likes = meme.likeList.length;
    await meme.save();

    res.status(200).json({
      message: isLiked ? `取消点赞模因${memeId}` : `点赞模因${memeId}`,
      meme: {
        _id: meme._id,
        title: meme.title,
        likes: meme.likes,
        imageUrl: meme.imageUrl
      }
    });
  } catch (error) {
    res.status(500).json({
      message: '点赞模因失败',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...error
      }
    });
  }
};

export const favoriteMeme = async (req, res) => {
  try {
    const memeId = req.params.id;
    const token = req.headers.token;
    const username = token; // TODO:暂时用username作为token内容
    // 查找模因
    const meme = await Meme.findById(memeId);
    if (!meme) {
      return res.status(404).json({ message: `模因${memeId}不存在` });
    }
    // 查找用户
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: `用户${username}不存在` });
    }
    // 检查用户是否已收藏
    const isFavorited = user.favoriteList.includes(meme._id);
    if (isFavorited) {
      // 取消收藏
      user.favoriteList.pull(meme._id);
      meme.favorites = Math.max(0, meme.favorites - 1);
    }
    else {
      // 收藏
      user.favoriteList.push(meme._id);
      meme.favorites += 1;
    }
    await user.save();
    await meme.save();

    res.status(200).json({
      message: isFavorited ? `取消收藏模因${memeId}` : `收藏模因${memeId}`,
      meme: {
        _id: meme._id,
        title: meme.title,
        imageUrl: meme.imageUrl
      }
    });
  } catch (error) {
    res.status(500).json({
      message: '收藏模因失败',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...error
      }
    });
  }
};

export const getTokenPriceByAmount = async (req, res) => {
  try {
    const memeId = req.params.id;
    const meme = await Meme.findById(memeId);
    if (!meme) {
      return res.status(404).json({ message: `模因${memeId}不存在` });
    }
    if (!meme.withToken) {
      return res.status(400).json({ message: `模因${memeId}未关联Token` });
    }
    const token = await Token.findOne({ meme: memeId });
    if (!token) {
      return res.status(404).json({ message: `模因${memeId}的Token不存在` });
    }
    let amount = Number(req.query.amount);
    let expectedPrice = Number(req.query.expectedPrice) || 0;
    if (isNaN(amount) || amount === 0) {
      return res.status(400).json({ message: '无效的Token数量参数' });
    }
    amount = Math.round(amount * 10000) / 10000;

    const price = token.getPriceByAmount(amount, expectedPrice);
    res.status(200).json({ price });
  } catch (error) {
    const statusCode = error.message?.includes('无法买入池中所有Token') ? 400 : 500;
    res.status(statusCode).json({
      message: error.message || '获取Token价格失败',
    });
  }
};

export const getTokenPriceHistoryByTime = async (req, res) => {
  try {
    const memeId = req.params.id;
    const meme = await Meme.findById(memeId);
    if (!meme) {
      return res.status(404).json({ code: 1001, message: `模因${memeId}不存在` });
    }
    if (!meme.withToken) {
      return res.status(400).json({ code: 1002, message: `模因${memeId}未关联Token` });
    }
    const token = await Token.findOne({ meme: memeId });
    if (!token) {
      return res.status(404).json({ code: 1003, message: `模因${memeId}的Token不存在` });
    }

    const intervalMap = {
      '1m': 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '30m': 30 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000,
      '1w': 7 * 24 * 60 * 60 * 1000
    };

    const now = Date.now();
    const intervalKey = (req.query.interval || '1h').toLowerCase();
    const intervalMs = intervalMap[intervalKey] || intervalMap['1h'];
    const requestedEnd = Number(req.query.endTime) || now;
    const requestedStart = token.createdAt;

    const tokenCreatedAt = new Date(token.createdAt).getTime();
    const startTime = Math.max(tokenCreatedAt, requestedStart);
    const endTime = Math.max(startTime + intervalMs, requestedEnd);

    const sortedHistory = (token.priceHistory || [])
      .map(item => ({
        time: new Date(item.time).getTime(),
        price: typeof item.newPrice === 'number'
          ? item.newPrice
          : (typeof item.price === 'number' ? item.price : null),
        amount: Number(item.amount) || 0
      }))
      .filter(item => !Number.isNaN(item.time))
      .sort((a, b) => a.time - b.time);

    let pointer = 0;
    let lastPrice = token.price || Const.TOKEN_INIT_PRICE;

    // 使用历史中早于起始时间的记录更新lastPrice
    while (pointer < sortedHistory.length && sortedHistory[pointer].time < startTime) {
      if (typeof sortedHistory[pointer].price === 'number') {
        lastPrice = sortedHistory[pointer].price;
      }
      pointer++;
    }

    const data = [];

    for (let bucketStart = startTime; bucketStart < endTime; bucketStart += intervalMs) {
      const bucketEnd = bucketStart + intervalMs;

      let bucketOpen = lastPrice;
      let bucketHigh = lastPrice;
      let bucketLow = lastPrice;
      let bucketClose = lastPrice;
      let bucketVolume = 0;
      let traded = false;

      while (pointer < sortedHistory.length && sortedHistory[pointer].time < bucketEnd) {
        const entry = sortedHistory[pointer];
        const tradePrice = typeof entry.price === 'number' ? entry.price : lastPrice;

        if (!traded) {
          bucketOpen = lastPrice;
          traded = true;
        }
        bucketHigh = Math.max(bucketHigh, tradePrice);
        bucketLow = Math.min(bucketLow, tradePrice);
        bucketVolume += Math.abs(entry.amount || 0);

        lastPrice = tradePrice;
        bucketClose = lastPrice;
        pointer++;
      }

      // 如果本区间没有交易，open/high/low/close都继承上一区间的close（即lastPrice）
      if (!traded) {
        bucketOpen = lastPrice;
        bucketHigh = lastPrice;
        bucketLow = lastPrice;
        bucketClose = lastPrice;
      }

      data.push({
        timestamp: bucketStart,
        open: Number((bucketOpen ?? lastPrice).toFixed(8)),
        high: Number((bucketHigh ?? bucketOpen ?? lastPrice).toFixed(8)),
        low: Number((bucketLow ?? bucketOpen ?? lastPrice).toFixed(8)),
        close: Number((bucketClose ?? bucketOpen ?? lastPrice).toFixed(8)),
        volume: Number(bucketVolume.toFixed(6))
      });
    }

    return res.status(200).json({
      code: 0,
      message: 'ok',
      data
    });
  } catch (error) {
    res.status(500).json({
      code: 1000,
      message: '获取Token价格历史失败',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...error
      }
    });
  }
};

export const buyTokenByAmount = async (req, res) => {
  try {
    const userToken = req.headers.token;
    const username = userToken; // TODO:暂时用username作为token内容
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: `用户${username}不存在` });
    }
    const memeId = req.params.id;
    const meme = await Meme.findById(memeId);
    if (!meme) {
      return res.status(404).json({ message: `模因${memeId}不存在` });
    }
    if (!meme.withToken) {
      return res.status(400).json({ message: `模因${memeId}未关联Token` });
    }
    const token = await Token.findOne({ meme: memeId });
    if (!token) {
      return res.status(404).json({ message: `模因${memeId}的Token不存在` });
    }
    const amount = Math.round(Number(req.body.amount) * 10000) / 10000;
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: '无效的购买数量参数' });
    }
    const price = token.getPriceByAmount(amount);
    // 检查用户余额是否足够
    if (user.coins < price) {
      return res.status(400).json({ message: '余额不足，无法购买Token' });
    }
    user.coins -= price;
    // 更新User的Token余额
    await user.changeToken(token, amount);
    token.RToken -= amount;
    await token.updatePrice(user._id, amount, price);
    res.status(200).json({ 
      message: `成功购买${amount}个Token，支付USDT：${price.toFixed(6)}`,
      price: price 
    });
  } catch (error) {
    res.status(500).json({
      message: '购买Token失败',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...error
      }
    });
  }
};

export const sellTokenByAmount = async (req, res) => {
  try {
    const userToken = req.headers.token;
    const username = userToken; // TODO:暂时用username作为token内容
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: `用户${username}不存在` });
    }
    
    const memeId = req.params.id;
    const meme = await Meme.findById(memeId);
    if (!meme) {
      return res.status(404).json({ message: `模因${memeId}不存在` });
    }
    if (!meme.withToken) {
      return res.status(400).json({ message: `模因${memeId}未关联Token` });
    }
    const token = await Token.findOne({ meme: memeId });
    if (!token) {
      return res.status(404).json({ message: `模因${memeId}的Token不存在` });
    }
    const amount = Math.round(Number(req.body.amount) * 10000) / 10000;
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: '无效的出售数量参数' });
    }
    // 检查用户Token余额是否足够
    const userTokenEntry = user.tokenList.find(entry => entry.token.toString() === token._id.toString());
    if (!userTokenEntry || userTokenEntry.amount < amount) {
      return res.status(400).json({ message: 'Token余额不足，无法出售' });
    }
    const price = token.getPriceByAmount(-amount);
    await user.changeToken(token, -amount);
    user.coins += price;
    await user.save();
    // 更新Token的RUsdt和RToken
    token.RToken += amount;
    await token.updatePrice(user._id, -amount, price);
    res.status(200).json({ 
      message: `成功出售${amount}个Token，获得USDT：${price.toFixed(6)}`,
      price: price 
    });
  } catch (error) {
    res.status(500).json({
      message: '出售Token失败',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...error
      }
    });
  }
};

export const buyTokenReservation = async (req, res) => {
  try {
    const userToken = req.headers.token;
    const username = userToken; // TODO:暂时用username作为token内容
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: `用户${username}不存在` });
    }
    const memeId = req.params.id;
    const meme = await Meme.findById(memeId);
    if (!meme) {
      return res.status(404).json({ message: `模因${memeId}不存在` });
    }
    if (!meme.withToken) {
      return res.status(400).json({ message: `模因${memeId}未关联Token` });
    }
    const token = await Token.findOne({ meme: memeId });
    if (!token) {
      return res.status(404).json({ message: `模因${memeId}的Token不存在` });
    }
    // 获取预约参数
    const { expectedPrice, amount } = req.body;
    const buyAmount = Math.round(Number(amount) * 10000) / 10000;
    const buyExpectedPrice = Number(expectedPrice);
    if (isNaN(buyAmount) || buyAmount <= 0) {
      return res.status(400).json({ message: '无效的预约购买数量参数' });
    }
    if (isNaN(buyExpectedPrice) || buyExpectedPrice <= 0) {
      return res.status(400).json({ message: '无效的预约购买期望价格参数' });
    }
    // 创建预约订单
    const newOrder = new Order({
      user: user._id,
      meme: meme._id,
      // token: token._id,
      side: 'BUY',
      expectedPrice: buyExpectedPrice,
      amount: buyAmount
    });
    await newOrder.save();
    token.hasPendingOrder = true;
    await token.save();
    res.status(200).json({ message: '预约购买Token成功' });
  } catch (error) {
    res.status(500).json({
      message: '预约购买Token失败',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...error
      }
    });
  }
};

export const sellTokenReservation = async (req, res) => {
  try {
    const userToken = req.headers.token;
    const username = userToken; // TODO:暂时用username作为token内容
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: `用户${username}不存在` });
    }
    const memeId = req.params.id;
    const meme = await Meme.findById(memeId);
    if (!meme) {
      return res.status(404).json({ message: `模因${memeId}不存在` });
    }
    if (!meme.withToken) {
      return res.status(400).json({ message: `模因${memeId}未关联Token` });
    }
    const token = await Token.findOne({ meme: memeId });
    if (!token) {
      return res.status(404).json({ message: `模因${memeId}的Token不存在` });
    }
    // 获取预约参数
    const { expectedPrice, amount } = req.body;
    let sellAmount = Math.round(Number(amount) * 10000) / 10000;
    const sellExpectedPrice = Number(expectedPrice);
    if (isNaN(sellAmount) || sellAmount <= 0) {
      return res.status(400).json({ message: '无效的预约出售数量参数' });
    }
    if (isNaN(sellExpectedPrice) || sellExpectedPrice <= 0) {
      return res.status(400).json({ message: '无效的预约出售期望价格参数' });
    }
    // 检查用户是否有足够的Token
    sellAmount = await user.changeToken(token, -sellAmount);
    // 创建预约订单
    const newOrder = new Order({
      user: user._id,
      meme: meme._id,
      // token: token._id,
      side: 'SELL',
      expectedPrice: sellExpectedPrice,
      amount: -sellAmount
    });
    await newOrder.save();
    token.hasPendingOrder = true;
    await token.save();
    res.status(200).json({ message: '预约出售Token成功' });
  } catch (error) {
    res.status(500).json({
      message: '预约出售Token失败',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...error
      }
    });
  }
};

export const cancelOrderReservation = async (req, res) => {
  try {
    const userToken = req.headers.token;
    const username = userToken; // TODO:暂时用username作为token内容
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: `用户${username}不存在` });
    }
    const orderId = req.params.id;
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: `订单${orderId}不存在` });
    }
    // 检查订单归属
    if (order.user.toString() !== user._id.toString()) {
      return res.status(403).json({ message: `没有权限取消订单${orderId}` });
    }
    // 卖单返还Token
    if (order.side === 'SELL') {
      await user.changeToken(await Token.findById(order.token), order.amount);
    }
    await Order.findByIdAndUpdate(orderId, { status: 'CANCELLED' });
    res.status(200).json({ message: `成功取消订单${orderId}` });
  } catch (error) {
    res.status(500).json({
      message: '取消订单失败',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...error
      }
    });
  }
};

// 仅测试使用，手动触发订单成交检查
export const manualCheckOrderFulfillment = async (req, res) => {
  try {
    const memeId = req.params.id;
    const meme = await Meme.findById(memeId);
    if (!meme) {
      return res.status(404).json({ message: `模因${memeId}不存在` });
    }
    if (!meme.withToken) {
      return res.status(400).json({ message: `模因${memeId}未关联Token` });
    }
    const token = await Token.findOne({ meme: memeId });
    if (!token) {
      return res.status(404).json({ message: `模因${memeId}的Token不存在` });
    }
    await token.checkOrderFulfillment();
    res.status(200).json({ message: '手动检查订单成交完成' });
  } catch (error) {
    res.status(500).json({
      message: '手动检查订单成交失败',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...error
      }
    });
  }
};

// 根据 ticker 查询用户持有的代币数量
export const getUserTokenByTicker = async (req, res) => {
  try {
    const { ticker } = req.params;
    const userToken = req.headers.token;
    const username = userToken; // TODO: 暂时用 username 作为 token 内容

    if (!username) {
      return res.status(401).json({ code: 1001, message: '未登录' });
    }

    // 查找用户
    const user = await User.findOne({ username }).populate({
      path: 'tokenList.token',
      populate: { path: 'meme', select: 'ticker title' }
    });

    if (!user) {
      return res.status(404).json({ code: 1002, message: '用户不存在' });
    }

    // 查找对应 ticker 的 meme
    const meme = await Meme.findOne({ ticker });
    if (!meme) {
      return res.status(404).json({ code: 1003, message: `未找到 ticker 为 ${ticker} 的模因` });
    }

    // 查找该 meme 对应的 token
    const token = await Token.findOne({ meme: meme._id });
    if (!token) {
      return res.status(404).json({ code: 1004, message: `该模因未发行代币` });
    }

    // 在用户的 tokenList 中查找该 token
    const userTokenEntry = user.tokenList.find(
      entry => entry.token && entry.token._id.toString() === token._id.toString()
    );

    const amount = userTokenEntry ? userTokenEntry.amount : 0;

    res.json({
      code: 0,
      message: '查询成功',
      data: {
        ticker,
        memeId: meme._id,
        memeTitle: meme.title,
        tokenId: token._id,
        amount,
        currentPrice: token.price
      }
    });
  } catch (error) {
    console.error('[getUserTokenByTicker] Error:', error);
    res.status(500).json({
      code: 1000,
      message: '查询用户代币数量失败',
      error: error.message
    });
  }
};

// 获取用户的挂单列表
export const getUserOrders = async (req, res) => {
  try {
    const userToken = req.headers.token;
    const username = userToken;
    
    if (!username) {
      return res.status(401).json({ code: 1001, message: '未登录' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ code: 1002, message: '用户不存在' });
    }

    const { memeId } = req.query;
    
    // 构建查询条件
    const query = { user: user._id };
    if (memeId) {
      query.meme = memeId;
    }

    const orders = await Order.find(query)
      .populate('meme', 'title ticker')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      code: 0,
      message: '查询成功',
      data: orders.map(order => ({
        _id: order._id,
        memeId: order.meme?._id,
        memeTitle: order.meme?.title,
        memeTicker: order.meme?.ticker,
        side: order.side,
        expectedPrice: order.expectedPrice,
        amount: order.amount,
        status: order.status,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        completedAt: order.completedAt
      }))
    });
  } catch (error) {
    console.error('[getUserOrders] Error:', error);
    res.status(500).json({
      code: 1000,
      message: '获取挂单列表失败',
      error: error.message
    });
  }
};