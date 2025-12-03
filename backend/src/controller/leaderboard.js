import mongoose from 'mongoose';
import { Meme } from '../models/meme.js';
import { Token } from '../models/token.js';
import { User } from '../models/user.js';

/**
 * 获取排行榜数据
 * @param {string} type - 排行榜类型: hot, gainers, losers, volume, new
 * @param {string} timeRange - 时间范围: 1h, 24h, 7d, 30d
 */
export const getLeaderboard = async (req, res) => {
  try {
    const { type = 'hot', timeRange = '24h' } = req.query;
    
    // 计算时间范围
    const now = new Date();
    let startTime;
    switch (timeRange) {
      case '1h':
        startTime = new Date(now - 60 * 60 * 1000);
        break;
      case '7d':
        startTime = new Date(now - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startTime = new Date(now - 30 * 24 * 60 * 60 * 1000);
        break;
      default: // 24h
        startTime = new Date(now - 24 * 60 * 60 * 1000);
    }

    // 获取所有已审核通过且有Token的模因
    const memes = await Meme.find({ 
      status: 'active',
      withToken: true 
    }).lean();

    // 获取对应的Token信息
    const memeIds = memes.map(m => m._id);
    const tokens = await Token.find({ meme: { $in: memeIds } }).lean();
    const tokenMap = new Map(tokens.map(t => [t.meme.toString(), t]));

    // 计算每个模因的统计数据
    const memeStats = memes.map(meme => {
      const token = tokenMap.get(meme._id.toString());
      if (!token) return null;

      // 从价格历史中计算统计数据
      const priceHistory = token.priceHistory || [];
      const recentHistory = priceHistory.filter(h => new Date(h.time) >= startTime);
      
      // 计算价格变化
      let priceChange = 0;
      if (recentHistory.length > 0) {
        const oldPrice = recentHistory[0].price || token.price;
        const newPrice = token.price;
        priceChange = oldPrice > 0 ? ((newPrice - oldPrice) / oldPrice) * 100 : 0;
      }

      // 计算交易量
      const volume24h = recentHistory.reduce((sum, h) => sum + (h.price || 0), 0);
      
      // 计算交易笔数
      const tradeCount = recentHistory.length;

      // 计算热度指数 (综合交易量、交易笔数、点赞数、收藏数)
      const hotScore = (
        (volume24h * 0.4) + 
        (tradeCount * 10) + 
        ((meme.likes || 0) * 2) + 
        ((meme.favorites || 0) * 3)
      );

      // 计算持有人数
      const holders = new Set(priceHistory.filter(h => h.side === 'BUY').map(h => h.user?.toString())).size;

      return {
        id: meme._id,
        title: meme.title,
        ticker: meme.ticker,
        imageUrl: meme.imageUrl,
        description: meme.description,
        price: token.price,
        priceChange,
        volume24h,
        tradeCount,
        hotScore,
        holders,
        likes: meme.likes || 0,
        favorites: meme.favorites || 0,
        createdAt: meme.createdAt
      };
    }).filter(Boolean);

    // 根据类型排序
    let sortedList;
    switch (type) {
      case 'gainers':
        sortedList = memeStats.sort((a, b) => b.priceChange - a.priceChange);
        break;
      case 'losers':
        sortedList = memeStats.sort((a, b) => a.priceChange - b.priceChange);
        break;
      case 'volume':
        sortedList = memeStats.sort((a, b) => b.volume24h - a.volume24h);
        break;
      case 'new':
        sortedList = memeStats.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      default: // hot
        sortedList = memeStats.sort((a, b) => b.hotScore - a.hotScore);
    }

    // 计算市场统计
    const totalVolume = memeStats.reduce((sum, m) => sum + m.volume24h, 0);
    const totalTrades = memeStats.reduce((sum, m) => sum + m.tradeCount, 0);
    const totalTraders = await User.countDocuments({ 'tokenList.0': { $exists: true } });

    res.json({
      code: 0,
      message: '获取排行榜成功',
      data: {
        list: sortedList.slice(0, 50), // 返回前50名
        stats: {
          totalVolume,
          totalMemes: memes.length,
          totalTraders,
          totalTrades
        }
      }
    });
  } catch (error) {
    console.error('[Leaderboard] Error:', error);
    res.status(500).json({
      code: 1000,
      message: '获取排行榜失败',
      error: error.message
    });
  }
};

/**
 * 获取模因趋势数据（用于图表）
 */
export const getMemeTrend = async (req, res) => {
  try {
    const { id } = req.params;
    const { timeRange = '24h' } = req.query;

    const meme = await Meme.findById(id);
    if (!meme) {
      return res.status(404).json({ code: 1001, message: '模因不存在' });
    }

    const token = await Token.findOne({ meme: id });
    if (!token) {
      return res.status(404).json({ code: 1002, message: '该模因未发行代币' });
    }

    // 计算时间范围
    const now = new Date();
    let startTime, interval;
    switch (timeRange) {
      case '1h':
        startTime = new Date(now - 60 * 60 * 1000);
        interval = 5 * 60 * 1000; // 5分钟
        break;
      case '7d':
        startTime = new Date(now - 7 * 24 * 60 * 60 * 1000);
        interval = 6 * 60 * 60 * 1000; // 6小时
        break;
      case '30d':
        startTime = new Date(now - 30 * 24 * 60 * 60 * 1000);
        interval = 24 * 60 * 60 * 1000; // 1天
        break;
      default: // 24h
        startTime = new Date(now - 24 * 60 * 60 * 1000);
        interval = 60 * 60 * 1000; // 1小时
    }

    // 从价格历史中提取数据点
    const priceHistory = token.priceHistory || [];
    const recentHistory = priceHistory.filter(h => new Date(h.time) >= startTime);

    // 按时间间隔聚合数据
    const dataPoints = [];
    let currentTime = startTime.getTime();
    
    while (currentTime <= now.getTime()) {
      const nextTime = currentTime + interval;
      const pointsInInterval = recentHistory.filter(h => {
        const time = new Date(h.time).getTime();
        return time >= currentTime && time < nextTime;
      });

      if (pointsInInterval.length > 0) {
        const lastPoint = pointsInInterval[pointsInInterval.length - 1];
        dataPoints.push({
          time: new Date(currentTime),
          price: lastPoint.newPrice || token.price,
          volume: pointsInInterval.reduce((sum, p) => sum + (p.price || 0), 0)
        });
      } else if (dataPoints.length > 0) {
        // 如果没有数据，使用上一个点的价格
        dataPoints.push({
          time: new Date(currentTime),
          price: dataPoints[dataPoints.length - 1].price,
          volume: 0
        });
      }

      currentTime = nextTime;
    }

    res.json({
      code: 0,
      message: '获取趋势数据成功',
      data: {
        memeId: id,
        ticker: meme.ticker,
        currentPrice: token.price,
        dataPoints
      }
    });
  } catch (error) {
    console.error('[MemeTrend] Error:', error);
    res.status(500).json({
      code: 1000,
      message: '获取趋势数据失败',
      error: error.message
    });
  }
};

/**
 * 获取模因对比数据
 */
export const compareMemes = async (req, res) => {
  try {
    const { ids } = req.query; // 逗号分隔的模因ID列表
    if (!ids) {
      return res.status(400).json({ code: 1005, message: '请提供要对比的模因ID' });
    }

    const memeIds = ids.split(',').slice(0, 5); // 最多对比5个
    const memes = await Meme.find({ _id: { $in: memeIds } }).lean();
    const tokens = await Token.find({ meme: { $in: memeIds } }).lean();
    const tokenMap = new Map(tokens.map(t => [t.meme.toString(), t]));

    const now = new Date();
    const day1 = new Date(now - 24 * 60 * 60 * 1000);
    const day7 = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const day30 = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const compareData = memes.map(meme => {
      const token = tokenMap.get(meme._id.toString());
      if (!token) return null;

      const priceHistory = token.priceHistory || [];

      // 计算不同时间段的价格变化
      const calcPriceChange = (startTime) => {
        const history = priceHistory.filter(h => new Date(h.time) >= startTime);
        if (history.length === 0) return 0;
        const oldPrice = history[0].newPrice || token.price;
        return oldPrice > 0 ? ((token.price - oldPrice) / oldPrice) * 100 : 0;
      };

      // 计算交易量
      const calcVolume = (startTime) => {
        return priceHistory
          .filter(h => new Date(h.time) >= startTime)
          .reduce((sum, h) => sum + (h.price || 0), 0);
      };

      // 计算持有人数
      const holders = new Set(priceHistory.filter(h => h.side === 'BUY').map(h => h.user?.toString())).size;

      // 生成走势数据
      const sparkline = priceHistory.slice(-30).map(h => h.newPrice || 0);

      return {
        id: meme._id,
        title: meme.title,
        ticker: meme.ticker,
        imageUrl: meme.imageUrl,
        description: meme.description,
        createdAt: meme.createdAt,
        metrics: {
          price: token.price,
          change24h: calcPriceChange(day1),
          change7d: calcPriceChange(day7),
          change30d: calcPriceChange(day30),
          volume24h: calcVolume(day1),
          volume7d: calcVolume(day7),
          marketCap: token.price * (token.RToken || 0),
          holders,
          likes: meme.likes || 0,
          favorites: meme.favorites || 0
        },
        sparkline
      };
    }).filter(Boolean);

    res.json({
      code: 0,
      message: '获取对比数据成功',
      data: compareData
    });
  } catch (error) {
    console.error('[compareMemes] Error:', error);
    res.status(500).json({
      code: 1000,
      message: '获取对比数据失败',
      error: error.message
    });
  }
};

/**
 * 搜索模因（用于对比选择）
 */
export const searchMemesForCompare = async (req, res) => {
  try {
    const { q = '', ids = '' } = req.query;
    const idList = ids
      ? ids.split(',').map(id => id.trim()).filter(Boolean).map(id => {
          try {
            return new mongoose.Types.ObjectId(id);
          } catch (error) {
            return null;
          }
        }).filter(Boolean)
      : [];
    
    const query = { status: 'active' };
    if (idList.length > 0) {
      query._id = { $in: idList };
    }
    if (q) {
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { ticker: { $regex: q, $options: 'i' } }
      ];
    }

    const memes = await Meme.find(query)
      .select('title ticker imageUrl withToken')
      .limit(idList.length > 0 ? idList.length : 50)
      .lean();

    // 获取价格信息
    const tokens = await Token.find({ meme: { $in: memes.map(m => m._id) } }).lean();
    const tokenMap = new Map(tokens.map(t => [t.meme.toString(), t]));

    const result = memes
      .filter(meme => tokenMap.has(meme._id.toString()))
      .slice(0, 20)
      .map(meme => ({
        id: meme._id,
        title: meme.title,
        ticker: meme.ticker,
        imageUrl: meme.imageUrl,
        price: tokenMap.get(meme._id.toString())?.price || 0
      }));

    res.json({
      code: 0,
      message: '搜索成功',
      data: result
    });
  } catch (error) {
    console.error('[searchMemesForCompare] Error:', error);
    res.status(500).json({ code: 1000, message: '搜索失败', error: error.message });
  }
};
