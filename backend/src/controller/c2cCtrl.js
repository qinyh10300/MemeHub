import { C2CTrade } from '../models/c2cTrade.js';
import { User } from '../models/user.js';
import { Meme } from '../models/meme.js';
import { Token } from '../models/token.js';

// USDT 是特殊币种，使用 user.coins 而不是 tokenList
const USDT_TICKER = 'USDT';

// 辅助函数：从 token header 获取用户
async function getUserFromToken(token) {
  if (!token) return null;
  
  // 先尝试作为用户名查找
  let user = await User.findOne({ username: token });
  if (user) return user;
  
  // 如果是 JWT，尝试解码（简化处理）
  if (token.includes('.')) {
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      if (payload.user?.id) {
        user = await User.findById(payload.user.id);
      }
    } catch (e) {
      // 忽略解析错误
    }
  }
  
  return user;
}

// 辅助函数：根据 ticker 查找 Token（USDT 返回特殊标记）
async function findTokenByTicker(ticker) {
  if (ticker.toUpperCase() === USDT_TICKER) {
    return { _id: 'USDT', isUSDT: true };
  }
  const meme = await Meme.findOne({ ticker });
  if (!meme) return null;
  const token = await Token.findOne({ meme: meme._id });
  return token;
}

// 辅助函数：获取用户持有的某个 Token 数量
function getUserTokenAmount(user, tokenObj) {
  if (tokenObj.isUSDT) {
    return user.coins || 0;
  }
  const entry = user.tokenList.find(
    e => e.token && e.token.toString() === tokenObj._id.toString()
  );
  return entry ? entry.amount : 0;
}

// 辅助函数：修改用户的代币数量
async function changeUserToken(user, tokenObj, amount) {
  if (tokenObj.isUSDT) {
    user.coins = (user.coins || 0) + amount;
    if (user.coins < 0) user.coins = 0;
    await user.save();
    return amount;
  }
  return await user.changeToken(tokenObj, amount);
}

// 创建 C2C 交易
export const createC2CTrade = async (req, res) => {
  try {
    const token = req.headers['token'];
    const initiator = await getUserFromToken(token);
    
    if (!initiator) {
      return res.status(401).json({ code: 1010, message: '未登录或用户不存在' });
    }
    
    const { targetUsername, myToken, myAmount, theirToken, theirAmount } = req.body;
    
    if (!targetUsername) {
      return res.status(400).json({ code: 1001, message: '请输入对方用户名' });
    }
    if (!myToken || !myAmount) {
      return res.status(400).json({ code: 1002, message: '请输入您付出的币种和数量' });
    }
    if (!theirToken || !theirAmount) {
      return res.status(400).json({ code: 1003, message: '请输入对方付出的币种和数量' });
    }
    
    // 查找接收方
    const receiver = await User.findOne({ username: targetUsername });
    if (!receiver) {
      return res.status(404).json({ code: 1004, message: '对方用户不存在' });
    }
    
    if (receiver._id.equals(initiator._id)) {
      return res.status(400).json({ code: 1005, message: '不能与自己交易' });
    }
    
    // 验证发起方要付出的币种存在
    const initiatorTokenObj = await findTokenByTicker(myToken);
    if (!initiatorTokenObj) {
      return res.status(400).json({ code: 1006, message: `币种 ${myToken} 不存在` });
    }
    
    // 验证发起方有足够的代币
    const initiatorBalance = getUserTokenAmount(initiator, initiatorTokenObj);
    if (initiatorBalance < Number(myAmount)) {
      return res.status(400).json({ 
        code: 1007, 
        message: `您的 ${myToken} 余额不足，当前持有 ${initiatorBalance}，需要 ${myAmount}` 
      });
    }
    
    // 验证接收方要付出的币种存在
    const receiverTokenObj = await findTokenByTicker(theirToken);
    if (!receiverTokenObj) {
      return res.status(400).json({ code: 1008, message: `币种 ${theirToken} 不存在` });
    }
    
    const trade = new C2CTrade({
      initiator: initiator._id,
      receiver: receiver._id,
      initiatorToken: myToken.toUpperCase() === USDT_TICKER ? USDT_TICKER : myToken,
      initiatorAmount: Number(myAmount),
      receiverToken: theirToken.toUpperCase() === USDT_TICKER ? USDT_TICKER : theirToken,
      receiverAmount: Number(theirAmount),
      status: 'pending'
    });
    
    await trade.save();
    
    res.status(201).json({
      code: 0,
      message: '交易已发起，等待对方确认',
      data: {
        id: trade._id,
        to: targetUsername,
        myToken: trade.initiatorToken,
        myAmount: trade.initiatorAmount,
        theirToken: trade.receiverToken,
        theirAmount: trade.receiverAmount,
        status: trade.status,
        createdAt: trade.createdAt
      }
    });
  } catch (error) {
    console.error('[C2C] Create trade error:', error);
    res.status(500).json({ code: 1000, message: '创建交易失败', error: error.message });
  }
};

// 获取我发起的交易
export const getOutgoingTrades = async (req, res) => {
  try {
    const token = req.headers['token'];
    const user = await getUserFromToken(token);
    
    if (!user) {
      return res.status(401).json({ code: 1010, message: '未登录' });
    }
    
    const trades = await C2CTrade.find({ initiator: user._id })
      .populate('receiver', 'username')
      .sort({ createdAt: -1 });
    
    const result = trades.map(t => ({
      id: t._id,
      to: t.receiver?.username || '未知用户',
      myToken: t.initiatorToken,
      myAmount: t.initiatorAmount,
      theirToken: t.receiverToken,
      theirAmount: t.receiverAmount,
      status: t.status,
      createdAt: t.createdAt
    }));
    
    res.json({ code: 0, data: result });
  } catch (error) {
    console.error('[C2C] Get outgoing trades error:', error);
    res.status(500).json({ code: 1000, message: '获取发起的交易失败', error: error.message });
  }
};

// 获取我收到的交易
export const getIncomingTrades = async (req, res) => {
  try {
    const token = req.headers['token'];
    const user = await getUserFromToken(token);
    
    if (!user) {
      return res.status(401).json({ code: 1010, message: '未登录' });
    }
    
    const trades = await C2CTrade.find({ receiver: user._id })
      .populate('initiator', 'username')
      .sort({ createdAt: -1 });
    
    // 注意：从接收方视角，initiator 付出的是 "对方付出"，receiver 付出的是 "我付出"
    const result = trades.map(t => ({
      id: t._id,
      from: t.initiator?.username || '未知用户',
      theirToken: t.initiatorToken,    // 对方（发起方）付出的
      theirAmount: t.initiatorAmount,
      myToken: t.receiverToken,        // 我（接收方）需要付出的
      myAmount: t.receiverAmount,
      status: t.status,
      createdAt: t.createdAt
    }));
    
    res.json({ code: 0, data: result });
  } catch (error) {
    console.error('[C2C] Get incoming trades error:', error);
    res.status(500).json({ code: 1000, message: '获取收到的交易失败', error: error.message });
  }
};

// 接受交易
export const acceptTrade = async (req, res) => {
  try {
    const token = req.headers['token'];
    const receiver = await getUserFromToken(token);
    
    if (!receiver) {
      return res.status(401).json({ code: 1010, message: '未登录' });
    }
    
    const tradeId = req.params.id;
    const trade = await C2CTrade.findById(tradeId);
    
    if (!trade) {
      return res.status(404).json({ code: 1004, message: '交易不存在' });
    }
    
    if (!trade.receiver.equals(receiver._id)) {
      return res.status(403).json({ code: 1011, message: '只有接收方可以接受交易' });
    }
    
    if (trade.status !== 'pending') {
      return res.status(400).json({ code: 1006, message: `交易状态为 ${trade.status}，无法接受` });
    }
    
    // 获取发起方用户
    const initiator = await User.findById(trade.initiator);
    if (!initiator) {
      return res.status(404).json({ code: 1012, message: '发起方用户不存在' });
    }
    
    // 查找双方要交换的 Token
    const initiatorTokenObj = await findTokenByTicker(trade.initiatorToken);
    const receiverTokenObj = await findTokenByTicker(trade.receiverToken);
    
    if (!initiatorTokenObj) {
      return res.status(400).json({ code: 1013, message: `币种 ${trade.initiatorToken} 不存在` });
    }
    if (!receiverTokenObj) {
      return res.status(400).json({ code: 1014, message: `币种 ${trade.receiverToken} 不存在` });
    }
    
    // 检查发起方余额是否仍然足够
    const initiatorBalance = getUserTokenAmount(initiator, initiatorTokenObj);
    if (initiatorBalance < trade.initiatorAmount) {
      trade.status = 'cancelled';
      trade.updatedAt = new Date();
      await trade.save();
      return res.status(400).json({ 
        code: 1015, 
        message: `发起方 ${trade.initiatorToken} 余额不足，交易已自动取消` 
      });
    }
    
    // 检查接收方余额是否足够
    const receiverBalance = getUserTokenAmount(receiver, receiverTokenObj);
    if (receiverBalance < trade.receiverAmount) {
      return res.status(400).json({ 
        code: 1016, 
        message: `您的 ${trade.receiverToken} 余额不足，当前持有 ${receiverBalance}，需要 ${trade.receiverAmount}` 
      });
    }
    
    // 执行代币转移
    // 1. 发起方: 减少 initiatorToken，增加 receiverToken
    await changeUserToken(initiator, initiatorTokenObj, -trade.initiatorAmount);
    await changeUserToken(initiator, receiverTokenObj, trade.receiverAmount);
    
    // 2. 接收方: 减少 receiverToken，增加 initiatorToken
    await changeUserToken(receiver, receiverTokenObj, -trade.receiverAmount);
    await changeUserToken(receiver, initiatorTokenObj, trade.initiatorAmount);
    
    // 更新交易状态
    trade.status = 'accepted';
    trade.updatedAt = new Date();
    trade.completedAt = new Date();
    await trade.save();
    
    console.log(`[C2C] Trade ${tradeId} completed:`);
    console.log(`  - ${initiator.username}: -${trade.initiatorAmount} ${trade.initiatorToken}, +${trade.receiverAmount} ${trade.receiverToken}`);
    console.log(`  - ${receiver.username}: -${trade.receiverAmount} ${trade.receiverToken}, +${trade.initiatorAmount} ${trade.initiatorToken}`);
    
    res.json({ 
      code: 0, 
      message: '交易已完成', 
      data: { 
        id: trade._id, 
        status: trade.status,
        summary: {
          initiator: {
            username: initiator.username,
            gave: { token: trade.initiatorToken, amount: trade.initiatorAmount },
            received: { token: trade.receiverToken, amount: trade.receiverAmount }
          },
          receiver: {
            username: receiver.username,
            gave: { token: trade.receiverToken, amount: trade.receiverAmount },
            received: { token: trade.initiatorToken, amount: trade.initiatorAmount }
          }
        }
      } 
    });
  } catch (error) {
    console.error('[C2C] Accept trade error:', error);
    res.status(500).json({ code: 1000, message: '接受交易失败', error: error.message });
  }
};

// 拒绝交易
export const rejectTrade = async (req, res) => {
  try {
    const token = req.headers['token'];
    const user = await getUserFromToken(token);
    
    if (!user) {
      return res.status(401).json({ code: 1010, message: '未登录' });
    }
    
    const tradeId = req.params.id;
    const trade = await C2CTrade.findById(tradeId);
    
    if (!trade) {
      return res.status(404).json({ code: 1004, message: '交易不存在' });
    }
    
    if (!trade.receiver.equals(user._id)) {
      return res.status(403).json({ code: 1011, message: '只有接收方可以拒绝交易' });
    }
    
    if (trade.status !== 'pending') {
      return res.status(400).json({ code: 1006, message: `交易状态为 ${trade.status}，无法拒绝` });
    }
    
    trade.status = 'rejected';
    trade.updatedAt = new Date();
    await trade.save();
    
    res.json({ code: 0, message: '交易已拒绝', data: { id: trade._id, status: trade.status } });
  } catch (error) {
    console.error('[C2C] Reject trade error:', error);
    res.status(500).json({ code: 1000, message: '拒绝交易失败', error: error.message });
  }
};

// 取消交易（发起方取消）
export const cancelTrade = async (req, res) => {
  try {
    const token = req.headers['token'];
    const user = await getUserFromToken(token);
    
    if (!user) {
      return res.status(401).json({ code: 1010, message: '未登录' });
    }
    
    const tradeId = req.params.id;
    const trade = await C2CTrade.findById(tradeId);
    
    if (!trade) {
      return res.status(404).json({ code: 1004, message: '交易不存在' });
    }
    
    if (!trade.initiator.equals(user._id)) {
      return res.status(403).json({ code: 1011, message: '只有发起方可以取消交易' });
    }
    
    if (trade.status !== 'pending') {
      return res.status(400).json({ code: 1006, message: `交易状态为 ${trade.status}，无法取消` });
    }
    
    trade.status = 'cancelled';
    trade.updatedAt = new Date();
    await trade.save();
    
    res.json({ code: 0, message: '交易已取消', data: { id: trade._id, status: trade.status } });
  } catch (error) {
    console.error('[C2C] Cancel trade error:', error);
    res.status(500).json({ code: 1000, message: '取消交易失败', error: error.message });
  }
};

export const getIncomingPendingCount = async (req, res) => {
  try {
    const token = req.headers['token'];
    const user = await getUserFromToken(token);

    if (!user) {
      return res.status(401).json({ code: 1010, message: '未登录' });
    }

    const count = await C2CTrade.countDocuments({
      receiver: user._id,
      status: 'pending'
    });

    const latest = await C2CTrade.find({
      receiver: user._id,
      status: 'pending'
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('initiator', 'username');

    const summaries = latest.map(trade => ({
      id: trade._id,
      from: trade.initiator?.username || '未知用户',
      token: trade.initiatorToken,
      amount: trade.initiatorAmount,
      createdAt: trade.createdAt
    }));

    res.json({
      code: 0,
      data: {
        total: count,
        previews: summaries
      }
    });
  } catch (error) {
    console.error('[C2C] Incoming pending count error:', error);
    res.status(500).json({ code: 1000, message: '获取交易提醒失败', error: error.message });
  }
};
