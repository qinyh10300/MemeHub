import { Poll } from '../models/poll.js';
import { User } from '../models/user.js';
import { Meme } from '../models/meme.js';

/**
 * 获取投票列表
 */
export const getPolls = async (req, res) => {
  try {
    const { status = 'all' } = req.query;
    const username = req.headers.token;

    let query = {};
    if (status === 'active') {
      query.status = 'active';
      query.endTime = { $gt: new Date() };
    } else if (status === 'ended') {
      query.$or = [
        { status: 'ended' },
        { endTime: { $lte: new Date() } }
      ];
    }

    const polls = await Poll.find(query)
      .populate('creator', 'username nickname avatar')
      .sort({ createdAt: -1 })
      .limit(50);

    // 检查并更新过期投票的状态
    for (const poll of polls) {
      await poll.checkAndUpdateStatus();
    }

    // 获取用户投票记录
    let user = null;
    if (username) {
      user = await User.findOne({ username });
    }

    const pollsWithUserVote = polls.map(poll => {
      const userVote = user ? poll.voters.find(v => v.user?.toString() === user._id.toString()) : null;
      
      return {
        id: poll._id,
        title: poll.title,
        description: poll.description,
        type: poll.type,
        creator: poll.creator,
        options: poll.options.map((opt, index) => ({
          id: index,
          name: opt.name,
          ticker: opt.ticker,
          imageUrl: opt.imageUrl,
          votes: opt.votes
        })),
        status: poll.status,
        totalVotes: poll.totalVotes,
        rewards: poll.rewards,
        startTime: poll.startTime,
        endTime: poll.endTime,
        hasVoted: !!userVote,
        userVote: userVote?.optionIndex,
        createdAt: poll.createdAt
      };
    });

    res.json({
      code: 0,
      message: '获取投票列表成功',
      data: pollsWithUserVote
    });
  } catch (error) {
    console.error('[getPolls] Error:', error);
    res.status(500).json({ code: 1000, message: '获取投票列表失败', error: error.message });
  }
};

/**
 * 创建投票
 */
export const createPoll = async (req, res) => {
  try {
    const username = req.headers.token;
    const { title, description, type, options, duration, rewards } = req.body;

    if (!username) {
      return res.status(401).json({ code: 1001, message: '未登录' });
    }

    if (!title || !options || options.length < 2) {
      return res.status(400).json({ code: 1005, message: '标题和至少两个选项是必需的' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ code: 1002, message: '用户不存在' });
    }

    // 计算结束时间
    const durationDays = parseInt(duration) || 3;
    const endTime = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

    const poll = new Poll({
      title,
      description: description || '',
      type: type || 'other',
      creator: user._id,
      options: options.filter(opt => opt.name?.trim()).map(opt => ({
        name: opt.name.trim(),
        ticker: opt.ticker || '',
        imageUrl: opt.imageUrl || '',
        votes: 0
      })),
      rewards: rewards || '',
      endTime,
      status: 'active'
    });

    await poll.save();

    res.json({
      code: 0,
      message: '创建投票成功',
      data: { pollId: poll._id }
    });
  } catch (error) {
    console.error('[createPoll] Error:', error);
    res.status(500).json({ code: 1000, message: '创建投票失败', error: error.message });
  }
};

/**
 * 投票
 */
export const vote = async (req, res) => {
  try {
    const username = req.headers.token;
    const { pollId } = req.params;
    const { optionIndex } = req.body;

    if (!username) {
      return res.status(401).json({ code: 1001, message: '未登录' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ code: 1002, message: '用户不存在' });
    }

    const poll = await Poll.findById(pollId);
    if (!poll) {
      return res.status(404).json({ code: 1003, message: '投票不存在' });
    }

    // 检查投票是否已结束
    await poll.checkAndUpdateStatus();
    if (poll.status !== 'active') {
      return res.status(400).json({ code: 1006, message: '投票已结束' });
    }

    // 检查是否已投票
    const existingVote = poll.voters.find(v => v.user?.toString() === user._id.toString());
    if (existingVote) {
      return res.status(400).json({ code: 1007, message: '你已经投过票了' });
    }

    // 检查选项是否有效
    if (optionIndex < 0 || optionIndex >= poll.options.length) {
      return res.status(400).json({ code: 1008, message: '无效的选项' });
    }

    // 记录投票
    poll.voters.push({
      user: user._id,
      optionIndex,
      votedAt: new Date()
    });
    poll.options[optionIndex].votes += 1;
    poll.totalVotes += 1;

    await poll.save();

    // 发放奖励（如果有）
    if (poll.rewardAmount > 0) {
      // 这里可以添加铜钱奖励逻辑
    }

    res.json({
      code: 0,
      message: '投票成功',
      data: {
        totalVotes: poll.totalVotes,
        options: poll.options.map((opt, index) => ({
          id: index,
          name: opt.name,
          votes: opt.votes
        }))
      }
    });
  } catch (error) {
    console.error('[vote] Error:', error);
    res.status(500).json({ code: 1000, message: '投票失败', error: error.message });
  }
};

/**
 * 获取投票详情
 */
export const getPollDetail = async (req, res) => {
  try {
    const { pollId } = req.params;
    const username = req.headers.token;

    const poll = await Poll.findById(pollId)
      .populate('creator', 'username nickname avatar');

    if (!poll) {
      return res.status(404).json({ code: 1003, message: '投票不存在' });
    }

    await poll.checkAndUpdateStatus();

    let userVote = null;
    if (username) {
      const user = await User.findOne({ username });
      if (user) {
        const vote = poll.voters.find(v => v.user?.toString() === user._id.toString());
        userVote = vote?.optionIndex;
      }
    }

    res.json({
      code: 0,
      message: '获取投票详情成功',
      data: {
        id: poll._id,
        title: poll.title,
        description: poll.description,
        type: poll.type,
        creator: poll.creator,
        options: poll.options.map((opt, index) => ({
          id: index,
          name: opt.name,
          ticker: opt.ticker,
          imageUrl: opt.imageUrl,
          votes: opt.votes
        })),
        status: poll.status,
        totalVotes: poll.totalVotes,
        rewards: poll.rewards,
        startTime: poll.startTime,
        endTime: poll.endTime,
        hasVoted: userVote !== null,
        userVote,
        createdAt: poll.createdAt
      }
    });
  } catch (error) {
    console.error('[getPollDetail] Error:', error);
    res.status(500).json({ code: 1000, message: '获取投票详情失败', error: error.message });
  }
};

/**
 * 获取投票统计
 */
export const getPollStats = async (req, res) => {
  try {
    const activeCount = await Poll.countDocuments({ 
      status: 'active', 
      endTime: { $gt: new Date() } 
    });
    
    const endedCount = await Poll.countDocuments({
      $or: [
        { status: 'ended' },
        { endTime: { $lte: new Date() } }
      ]
    });

    const totalVoters = await Poll.aggregate([
      { $unwind: '$voters' },
      { $group: { _id: '$voters.user' } },
      { $count: 'count' }
    ]);

    res.json({
      code: 0,
      data: {
        activePolls: activeCount,
        endedPolls: endedCount,
        totalVoters: totalVoters[0]?.count || 0
      }
    });
  } catch (error) {
    console.error('[getPollStats] Error:', error);
    res.status(500).json({ code: 1000, message: '获取统计失败' });
  }
};

