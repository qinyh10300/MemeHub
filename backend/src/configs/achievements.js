// 成就定义配置
export const ACHIEVEMENTS = {
  // 社交类
  first_checkin: {
    id: 'first_checkin',
    title: '初次签到',
    description: '完成第一次签到',
    icon: '📅',
    category: 'social',
    rarity: 'common',
    points: 10,
    condition: { type: 'checkin', target: 1 }
  },
  streak_7: {
    id: 'streak_7',
    title: '坚持一周',
    description: '连续签到7天',
    icon: '🔥',
    category: 'social',
    rarity: 'common',
    points: 30,
    condition: { type: 'streak', target: 7 }
  },
  streak_30: {
    id: 'streak_30',
    title: '月度达人',
    description: '连续签到30天',
    icon: '🏆',
    category: 'social',
    rarity: 'rare',
    points: 100,
    condition: { type: 'streak', target: 30 }
  },
  first_follow: {
    id: 'first_follow',
    title: '结交好友',
    description: '关注第一个用户',
    icon: '👋',
    category: 'social',
    rarity: 'common',
    points: 10,
    condition: { type: 'follow', target: 1 }
  },
  followers_10: {
    id: 'followers_10',
    title: '小有名气',
    description: '获得10个粉丝',
    icon: '👥',
    category: 'social',
    rarity: 'common',
    points: 20,
    condition: { type: 'followers', target: 10 }
  },
  followers_100: {
    id: 'followers_100',
    title: '社区明星',
    description: '获得100个粉丝',
    icon: '⭐',
    category: 'social',
    rarity: 'uncommon',
    points: 50,
    condition: { type: 'followers', target: 100 }
  },

  // 交易类
  first_trade: {
    id: 'first_trade',
    title: '初次交易',
    description: '完成第一笔交易',
    icon: '💱',
    category: 'trading',
    rarity: 'common',
    points: 15,
    condition: { type: 'trade', target: 1 }
  },
  trade_10: {
    id: 'trade_10',
    title: '交易新手',
    description: '完成10笔交易',
    icon: '📊',
    category: 'trading',
    rarity: 'common',
    points: 25,
    condition: { type: 'trade', target: 10 }
  },
  trade_100: {
    id: 'trade_100',
    title: '交易达人',
    description: '完成100笔交易',
    icon: '💹',
    category: 'trading',
    rarity: 'uncommon',
    points: 50,
    condition: { type: 'trade', target: 100 }
  },
  profit_100: {
    id: 'profit_100',
    title: '小赚一笔',
    description: '单笔交易盈利超过100 USDT',
    icon: '💰',
    category: 'trading',
    rarity: 'uncommon',
    points: 30,
    condition: { type: 'profit', target: 100 }
  },

  // 创作类
  first_meme: {
    id: 'first_meme',
    title: '创作者',
    description: '创建第一个模因',
    icon: '🎨',
    category: 'creation',
    rarity: 'common',
    points: 15,
    condition: { type: 'create_meme', target: 1 }
  },
  meme_approved: {
    id: 'meme_approved',
    title: '审核通过',
    description: '模因通过官方审核',
    icon: '✅',
    category: 'creation',
    rarity: 'common',
    points: 20,
    condition: { type: 'meme_approved', target: 1 }
  },
  meme_popular: {
    id: 'meme_popular',
    title: '人气模因',
    description: '单个模因获得100个点赞',
    icon: '❤️',
    category: 'creation',
    rarity: 'uncommon',
    points: 50,
    condition: { type: 'meme_likes', target: 100 }
  },
  meme_5: {
    id: 'meme_5',
    title: '多产创作者',
    description: '创建5个模因',
    icon: '🎭',
    category: 'creation',
    rarity: 'uncommon',
    points: 40,
    condition: { type: 'create_meme', target: 5 }
  },

  // 收藏类
  collector_10: {
    id: 'collector_10',
    title: '收藏家',
    description: '收藏10个模因',
    icon: '📦',
    category: 'collection',
    rarity: 'common',
    points: 15,
    condition: { type: 'favorite', target: 10 }
  },
  collector_50: {
    id: 'collector_50',
    title: '专业收藏家',
    description: '收藏50个模因',
    icon: '🗃️',
    category: 'collection',
    rarity: 'uncommon',
    points: 40,
    condition: { type: 'favorite', target: 50 }
  },
  diverse_holder: {
    id: 'diverse_holder',
    title: '多元持有',
    description: '同时持有10种不同模因币',
    icon: '🌈',
    category: 'collection',
    rarity: 'uncommon',
    points: 35,
    condition: { type: 'hold_tokens', target: 10 }
  },

  // 游戏类
  game_win_10: {
    id: 'game_win_10',
    title: '小游戏达人',
    description: '在小游戏中累计获胜10次',
    icon: '🎮',
    category: 'social',
    rarity: 'common',
    points: 25,
    condition: { type: 'game_win', target: 10 }
  },
  lottery_legend: {
    id: 'lottery_legend',
    title: '幸运儿',
    description: '在抽奖中获得传说奖励',
    icon: '🍀',
    category: 'social',
    rarity: 'rare',
    points: 80,
    condition: { type: 'lottery_legend', target: 1 }
  }
};

// 获取所有成就列表
export const getAllAchievements = () => Object.values(ACHIEVEMENTS);

// 根据类别获取成就
export const getAchievementsByCategory = (category) => {
  return Object.values(ACHIEVEMENTS).filter(a => a.category === category);
};

// 计算用户成就进度
export const calculateAchievementProgress = (achievementId, userData) => {
  const achievement = ACHIEVEMENTS[achievementId];
  if (!achievement) return { progress: 0, current: 0, target: 0 };

  const { type, target } = achievement.condition;
  let current = 0;

  switch (type) {
    case 'checkin':
      current = userData.totalCheckIns || 0;
      break;
    case 'streak':
      current = userData.streak || 0;
      break;
    case 'follow':
      current = userData.following?.length || 0;
      break;
    case 'followers':
      current = userData.followersCount || 0;
      break;
    case 'trade':
      current = userData.tradeCount || 0;
      break;
    case 'create_meme':
      current = userData.workList?.length || 0;
      break;
    case 'meme_approved':
      current = userData.approvedMemeCount || 0;
      break;
    case 'favorite':
      current = userData.favoriteList?.length || 0;
      break;
    case 'hold_tokens':
      current = userData.tokenList?.length || 0;
      break;
    case 'game_win':
      current = userData.gameWins || 0;
      break;
    default:
      current = 0;
  }

  const progress = Math.min(100, Math.round((current / target) * 100));
  return { progress, current, target };
};

