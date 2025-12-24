import { User } from '../models/user.js';
import { Meme } from '../models/meme.js';
import { Token } from '../models/token.js';
import { ACHIEVEMENTS, getAllAchievements, calculateAchievementProgress } from '../configs/achievements.js';

// ============== 自选列表 API ==============

/**
 * 获取用户自选列表
 */
export const getWatchlist = async (req, res) => {
  try {
    const username = req.headers.token;
    if (!username) {
      return res.status(401).json({ code: 1001, message: '未登录' });
    }

    const user = await User.findOne({ username }).populate({
      path: 'watchlist.meme',
      select: 'title ticker imageUrl description'
    });

    if (!user) {
      return res.status(404).json({ code: 1002, message: '用户不存在' });
    }

    // 获取每个模因的价格信息
    const watchlistWithPrices = await Promise.all(
      user.watchlist.map(async (item) => {
        if (!item.meme) return null;
        
        const token = await Token.findOne({ meme: item.meme._id });
        const priceHistory = token?.priceHistory || [];
        
        // 计算24小时价格变化
        const now = new Date();
        const yesterday = new Date(now - 24 * 60 * 60 * 1000);
        const recentHistory = priceHistory.filter(h => new Date(h.time) >= yesterday);
        
        let priceChange = 0;
        if (recentHistory.length > 0 && token) {
          const oldPrice = recentHistory[0].newPrice || token.price;
          priceChange = oldPrice > 0 ? ((token.price - oldPrice) / oldPrice) * 100 : 0;
        }

        // 生成简易走势数据
        const sparkline = priceHistory.slice(-20).map(h => h.newPrice || 0);

        return {
          id: item.meme._id,
          title: item.meme.title,
          ticker: item.meme.ticker,
          imageUrl: item.meme.imageUrl,
          price: token?.price || 0,
          change: priceChange,
          volume: recentHistory.reduce((sum, h) => sum + (h.price || 0), 0),
          holders: new Set(priceHistory.filter(h => h.side === 'BUY').map(h => h.user?.toString())).size,
          addedAt: item.addedAt,
          sparkline
        };
      })
    );

    res.json({
      code: 0,
      message: '获取自选列表成功',
      data: watchlistWithPrices.filter(Boolean)
    });
  } catch (error) {
    console.error('[getWatchlist] Error:', error);
    res.status(500).json({ code: 1000, message: '获取自选列表失败', error: error.message });
  }
};

/**
 * 添加到自选列表
 */
export const addToWatchlist = async (req, res) => {
  try {
    const username = req.headers.token;
    const { memeId } = req.body;

    if (!username) {
      return res.status(401).json({ code: 1001, message: '未登录' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ code: 1002, message: '用户不存在' });
    }

    const meme = await Meme.findById(memeId);
    if (!meme) {
      return res.status(404).json({ code: 1003, message: '模因不存在' });
    }

    // 检查是否已在自选列表中
    const exists = user.watchlist.some(item => item.meme?.toString() === memeId);
    if (exists) {
      return res.status(400).json({ code: 1004, message: '该模因已在自选列表中' });
    }

    user.watchlist.push({ meme: memeId, addedAt: new Date() });
    await user.save();

    res.json({ code: 0, message: '添加自选成功' });
  } catch (error) {
    console.error('[addToWatchlist] Error:', error);
    res.status(500).json({ code: 1000, message: '添加自选失败', error: error.message });
  }
};

/**
 * 从自选列表移除
 */
export const removeFromWatchlist = async (req, res) => {
  try {
    const username = req.headers.token;
    const { memeId } = req.params;

    if (!username) {
      return res.status(401).json({ code: 1001, message: '未登录' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ code: 1002, message: '用户不存在' });
    }

    user.watchlist = user.watchlist.filter(item => item.meme?.toString() !== memeId);
    await user.save();

    res.json({ code: 0, message: '移除自选成功' });
  } catch (error) {
    console.error('[removeFromWatchlist] Error:', error);
    res.status(500).json({ code: 1000, message: '移除自选失败', error: error.message });
  }
};

// ============== 价格预警 API ==============

/**
 * 获取用户价格预警列表
 */
export const getPriceAlerts = async (req, res) => {
  try {
    const username = req.headers.token;
    if (!username) {
      return res.status(401).json({ code: 1001, message: '未登录' });
    }

    const user = await User.findOne({ username }).populate({
      path: 'priceAlerts.meme',
      select: 'title ticker imageUrl'
    });

    if (!user) {
      return res.status(404).json({ code: 1002, message: '用户不存在' });
    }

    const triggeredAlerts = [];

    // 获取当前价格并检查是否触发
    const alertsWithPrices = await Promise.all(
      user.priceAlerts.map(async (alert) => {
        if (!alert.meme) return null;
        
        const token = await Token.findOne({ meme: alert.meme._id });
        const currentPrice = token?.price || 0;

        // 检查是否应该触发
        let shouldTrigger = false;
        if (alert.status === 'active') {
          if (alert.type === 'above' && currentPrice >= alert.targetPrice) {
            shouldTrigger = true;
          } else if (alert.type === 'below' && currentPrice <= alert.targetPrice) {
            shouldTrigger = true;
          }
        }

        if (shouldTrigger) {
          alert.status = 'triggered';
          alert.triggeredAt = new Date();
          triggeredAlerts.push({ alert, currentPrice });
        }

        return {
          id: alert._id,
          memeId: alert.meme._id,
          memeTicker: alert.meme.ticker,
          memeTitle: alert.meme.title,
          memeImage: alert.meme.imageUrl,
          type: alert.type,
          targetPrice: alert.targetPrice,
          currentPrice,
          status: alert.status,
          notifyInApp: alert.notifyInApp,
          notifyEmail: alert.notifyEmail,
          note: alert.note,
          createdAt: alert.createdAt,
          triggeredAt: alert.triggeredAt
        };
      })
    );

    if (triggeredAlerts.length) {
      await user.save();
    }

    res.json({
      code: 0,
      message: '获取价格预警成功',
      data: alertsWithPrices.filter(Boolean)
    });
  } catch (error) {
    console.error('[getPriceAlerts] Error:', error);
    res.status(500).json({ code: 1000, message: '获取价格预警失败', error: error.message });
  }
};

/**
 * 创建价格预警
 */
export const createPriceAlert = async (req, res) => {
  try {
    const username = req.headers.token;
    const { memeId, type, targetPrice, notifyInApp, notifyEmail, note } = req.body;

    if (!username) {
      return res.status(401).json({ code: 1001, message: '未登录' });
    }

    if (!memeId || !type || !targetPrice) {
      return res.status(400).json({ code: 1005, message: '缺少必要参数' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ code: 1002, message: '用户不存在' });
    }

    const meme = await Meme.findById(memeId);
    if (!meme) {
      return res.status(404).json({ code: 1003, message: '模因不存在' });
    }

    user.priceAlerts.push({
      meme: memeId,
      type,
      targetPrice,
      notifyInApp: notifyInApp !== false,
      notifyEmail: notifyEmail === true,
      note: note || '',
      status: 'active',
      createdAt: new Date()
    });

    await user.save();

    res.json({ code: 0, message: '创建价格预警成功' });
  } catch (error) {
    console.error('[createPriceAlert] Error:', error);
    res.status(500).json({ code: 1000, message: '创建价格预警失败', error: error.message });
  }
};

/**
 * 删除价格预警
 */
export const deletePriceAlert = async (req, res) => {
  try {
    const username = req.headers.token;
    const { alertId } = req.params;

    if (!username) {
      return res.status(401).json({ code: 1001, message: '未登录' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ code: 1002, message: '用户不存在' });
    }

    user.priceAlerts = user.priceAlerts.filter(alert => alert._id.toString() !== alertId);
    await user.save();

    res.json({ code: 0, message: '删除价格预警成功' });
  } catch (error) {
    console.error('[deletePriceAlert] Error:', error);
    res.status(500).json({ code: 1000, message: '删除价格预警失败', error: error.message });
  }
};

/**
 * 更新用户 USDT（coins）余额，用于兑换同步
 */
export const updateCoins = async (req, res) => {
  try {
    const username = req.headers.token;
    const { coins } = req.body || {};

    if (!username) {
      return res.status(401).json({ code: 1001, message: '未登录' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ code: 1002, message: '用户不存在' });
    }

    const numeric = Number(coins);
    if (!Number.isFinite(numeric) || numeric < 0) {
      return res.status(400).json({ code: 1005, message: 'coins 参数无效' });
    }

    user.coins = Math.round(numeric * 10000) / 10000;
    await user.save();

    res.json({ code: 0, message: '余额已更新', coins: user.coins });
  } catch (error) {
    console.error('[updateCoins] Error:', error);
    res.status(500).json({ code: 1000, message: '更新余额失败', error: error.message });
  }
};

// ============== 成就系统 API ==============

/**
 * 获取用户成就列表
 */
export const getUserAchievements = async (req, res) => {
  try {
    const username = req.headers.token;
    if (!username) {
      return res.status(401).json({ code: 1001, message: '未登录' });
    }

    let user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ code: 1002, message: '用户不存在' });
    }

    // 先检查是否有新的成就达成
    const newlyUnlocked = await checkAndUnlockAchievements(user._id);
    if (newlyUnlocked.length > 0) {
      user = await User.findById(user._id);
    }

    // 获取关注者数量
    const followersCount = await User.countDocuments({ following: user._id });
    
    // 获取已审核通过的模因数量
    const approvedMemeCount = await Meme.countDocuments({ 
      _id: { $in: user.workList }, 
      status: 'active' 
    });

    // 构建用户数据用于计算进度
    const userData = {
      ...user.toObject(),
      followersCount,
      approvedMemeCount,
      tradeCount: user.tokenList?.length || 0, // 简化的交易计数
      gameWins: 0 // 需要从游戏化数据获取
    };

    // 获取所有成就定义
    const allAchievements = getAllAchievements();
    
    // 构建成就列表
    const achievementsList = allAchievements.map(achievement => {
      const userAch = user.achievements.find(a => a.achievementId === achievement.id);
      const { progress, current, target } = calculateAchievementProgress(achievement.id, userData);
      
      return {
        id: achievement.id,
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon,
        category: achievement.category,
        rarity: achievement.rarity,
        points: achievement.points,
        unlocked: !!userAch,
        unlockedAt: userAch?.unlockedAt,
        progress,
        current,
        target
      };
    });

    // 统计数据
    const unlockedCount = achievementsList.filter(a => a.unlocked).length;
    const totalPoints = achievementsList.filter(a => a.unlocked).reduce((sum, a) => sum + a.points, 0);

    res.json({
      code: 0,
      message: '获取成就列表成功',
      data: {
        achievements: achievementsList,
        stats: {
          unlockedCount,
          totalCount: achievementsList.length,
          totalPoints,
          completionRate: Math.round((unlockedCount / achievementsList.length) * 100)
        },
        userLevel: user.level || 1,
        userXp: user.xp || 0
      }
    });
  } catch (error) {
    console.error('[getUserAchievements] Error:', error);
    res.status(500).json({ code: 1000, message: '获取成就列表失败', error: error.message });
  }
};

/**
 * 检查并解锁成就
 */
export const checkAndUnlockAchievements = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) return [];

    const followersCount = await User.countDocuments({ following: user._id });
    const approvedMemeCount = await Meme.countDocuments({ 
      _id: { $in: user.workList }, 
      status: 'active' 
    });

    const userData = {
      ...user.toObject(),
      followersCount,
      approvedMemeCount,
      tradeCount: user.tokenList?.length || 0
    };

    const newlyUnlocked = [];
    const allAchievements = getAllAchievements();

    for (const achievement of allAchievements) {
      // 跳过已解锁的
      if (user.achievements.some(a => a.achievementId === achievement.id)) continue;

      const { progress } = calculateAchievementProgress(achievement.id, userData);
      
      if (progress >= 100) {
        user.achievements.push({
          achievementId: achievement.id,
          unlockedAt: new Date()
        });
        user.xp = (user.xp || 0) + achievement.points;
        newlyUnlocked.push(achievement);
      }
    }

    if (newlyUnlocked.length > 0) {
      // 更新等级
      const xpPerLevel = 500;
      user.level = Math.floor(user.xp / xpPerLevel) + 1;
      await user.save();
    }

    return newlyUnlocked;
  } catch (error) {
    console.error('[checkAndUnlockAchievements] Error:', error);
    return [];
  }
};

// ============== 创作者数据 API ==============

/**
 * 获取创作者数据统计
 */
export const getCreatorStats = async (req, res) => {
  try {
    const username = req.headers.token;
    if (!username) {
      return res.status(401).json({ code: 1001, message: '未登录' });
    }

    const user = await User.findOne({ username }).populate('workList');
    if (!user) {
      return res.status(404).json({ code: 1002, message: '用户不存在' });
    }

    // 获取用户创建的所有模因
    const memes = await Meme.find({ _id: { $in: user.workList } });
    const approvedMemes = memes.filter(m => m.status === 'active');

    // 计算总持有人数和交易量
    let totalHolders = 0;
    let totalVolume = 0;
    let totalEarnings = 0;

    const memeStats = await Promise.all(
      approvedMemes.map(async (meme) => {
        const token = await Token.findOne({ meme: meme._id });
        if (!token) return null;

        const priceHistory = token.priceHistory || [];
        const now = new Date();
        const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
        const recentHistory = priceHistory.filter(h => new Date(h.time) >= thirtyDaysAgo);

        const volume = recentHistory.reduce((sum, h) => sum + (h.price || 0), 0);
        const holders = new Set(priceHistory.filter(h => h.side === 'BUY').map(h => h.user?.toString())).size;
        
        // 模拟收益（实际应该根据交易手续费等计算）
        const earnings = volume * 0.01; // 1% 创作者分成

        totalHolders += holders;
        totalVolume += volume;
        totalEarnings += earnings;

        // 计算24小时变化
        const yesterday = new Date(now - 24 * 60 * 60 * 1000);
        const dayHistory = priceHistory.filter(h => new Date(h.time) >= yesterday);
        let priceChange = 0;
        if (dayHistory.length > 0) {
          const oldPrice = dayHistory[0].newPrice || token.price;
          priceChange = oldPrice > 0 ? ((token.price - oldPrice) / oldPrice) * 100 : 0;
        }

        return {
          id: meme._id,
          title: meme.title,
          ticker: meme.ticker,
          imageUrl: meme.imageUrl,
          price: token.price,
          priceChange,
          holders,
          volume,
          earnings
        };
      })
    );

    // 获取粉丝数据
    const followersCount = await User.countDocuments({ following: user._id });

    res.json({
      code: 0,
      message: '获取创作者数据成功',
      data: {
        overview: {
          totalEarnings,
          totalMemes: memes.length,
          approvedMemes: approvedMemes.length,
          totalHolders,
          totalVolume,
          followersCount
        },
        memes: memeStats.filter(Boolean).sort((a, b) => b.earnings - a.earnings),
        earningsHistory: [] // TODO: 实现收益历史记录
      }
    });
  } catch (error) {
    console.error('[getCreatorStats] Error:', error);
    res.status(500).json({ code: 1000, message: '获取创作者数据失败', error: error.message });
  }
};

// ============== 智能推荐 API ==============

/**
 * 获取智能推荐
 */
export const getRecommendations = async (req, res) => {
  try {
    const username = req.headers.token;
    const { type = 'hot' } = req.query; // hot, new, potential, personalized

    // 获取已审核通过的模因
    const memes = await Meme.find({ status: 'active', withToken: true }).limit(50);
    const tokens = await Token.find({ meme: { $in: memes.map(m => m._id) } });
    const tokenMap = new Map(tokens.map(t => [t.meme.toString(), t]));

    const now = new Date();
    const yesterday = new Date(now - 24 * 60 * 60 * 1000);

    const memeStats = memes.map(meme => {
      const token = tokenMap.get(meme._id.toString());
      if (!token) return null;

      const priceHistory = token.priceHistory || [];
      const recentHistory = priceHistory.filter(h => new Date(h.time) >= yesterday);

      // 计算价格变化
      let priceChange = 0;
      if (recentHistory.length > 0) {
        const oldPrice = recentHistory[0].newPrice || token.price;
        priceChange = oldPrice > 0 ? ((token.price - oldPrice) / oldPrice) * 100 : 0;
      }

      // 计算热度分数
      const volume = recentHistory.reduce((sum, h) => sum + (h.price || 0), 0);
      const tradeCount = recentHistory.length;
      const hotScore = volume * 0.4 + tradeCount * 10 + (meme.likes || 0) * 2 + (meme.favorites || 0) * 3;

      return {
        id: meme._id,
        title: meme.title,
        ticker: meme.ticker,
        imageUrl: meme.imageUrl,
        description: meme.description,
        price: token.price,
        priceChange,
        volume,
        hotScore,
        createdAt: meme.createdAt
      };
    }).filter(Boolean);

    // 根据类型排序和筛选
    let result = [];
    let reason = '';

    switch (type) {
      case 'hot':
        result = memeStats.sort((a, b) => b.hotScore - a.hotScore).slice(0, 6);
        result = result.map(m => ({
          ...m,
          reason: m.priceChange > 10 ? '24小时涨幅超过10%' : 
                  m.volume > 1000 ? '交易活跃度高' : '社区热度持续上升'
        }));
        break;
      case 'new':
        const threeDaysAgo = new Date(now - 3 * 24 * 60 * 60 * 1000);
        result = memeStats
          .filter(m => new Date(m.createdAt) >= threeDaysAgo)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 6);
        result = result.map(m => ({
          ...m,
          reason: '新上线模因，值得关注'
        }));
        break;
      case 'potential':
        result = memeStats
          .filter(m => m.priceChange > 0 && m.hotScore > 50)
          .sort((a, b) => b.priceChange - a.priceChange)
          .slice(0, 6);
        result = result.map(m => ({
          ...m,
          reason: m.priceChange > 20 ? '涨势强劲，潜力巨大' : '技术指标向好'
        }));
        break;
      case 'personalized':
        // 如果用户登录，基于用户行为推荐
        if (username) {
          const user = await User.findOne({ username });
          if (user && user.favoriteList?.length > 0) {
            // 基于用户收藏推荐相似模因
            result = memeStats
              .filter(m => !user.favoriteList.includes(m.id))
              .slice(0, 6);
            result = result.map(m => ({
              ...m,
              reason: '基于你的收藏推荐'
            }));
          }
        }
        if (result.length === 0) {
          result = memeStats.sort(() => Math.random() - 0.5).slice(0, 6);
          result = result.map(m => ({
            ...m,
            reason: '为你精选'
          }));
        }
        break;
      default:
        result = memeStats.sort((a, b) => b.hotScore - a.hotScore).slice(0, 6);
    }

    res.json({
      code: 0,
      message: '获取推荐成功',
      data: result
    });
  } catch (error) {
    console.error('[getRecommendations] Error:', error);
    res.status(500).json({ code: 1000, message: '获取推荐失败', error: error.message });
  }
};

