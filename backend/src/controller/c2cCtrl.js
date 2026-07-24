import { C2CTrade } from '../models/c2cTrade.js';
import { User } from '../models/user.js';
import { Meme } from '../models/meme.js';
import { Token } from '../models/token.js';

// USDT (Coins) is a virtual currency, mapped to user.coins
const VIRTUAL_COIN_TICKERS = ['USDT', 'COINS'];

const isVirtualCoinTicker = (ticker = '') => {
  return VIRTUAL_COIN_TICKERS.includes(String(ticker).toUpperCase());
};

const normalizeTickerForStorage = (ticker = '') => {
  const upper = String(ticker).toUpperCase();
  return isVirtualCoinTicker(upper) ? 'COINS' : upper;
};

// Helper function: get user from token header
async function getUserFromToken(token) {
  if (!token) return null;

  // Try to find by username first
  let user = await User.findOne({ username: token });
  if (user) return user;

  // If it's a JWT, try to decode it (simplified handling)
  if (token.includes('.')) {
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      if (payload.user?.id) {
        user = await User.findById(payload.user.id);
      }
    } catch (e) {
      // Ignore parse errors
    }
  }

  return user;
}

// Helper function: find Token by ticker (USDT returns special marker)
async function findTokenByTicker(ticker = '') {
  if (!ticker) return null;
  const upper = ticker.toUpperCase();
  if (isVirtualCoinTicker(upper)) {
    return { _id: 'COINS', isUSDT: true };
  }
  const meme =
    (await Meme.findOne({ ticker })) ||
    (await Meme.findOne({ ticker: upper }));
  if (!meme) return null;
  const token = await Token.findOne({ meme: meme._id });
  return token;
}

// Helper function: get user's token amount
function getUserTokenAmount(user, tokenObj) {
  if (tokenObj.isUSDT) {
    return user.coins || 0;
  }
  const entry = user.tokenList.find(
    e => e.token && e.token.toString() === tokenObj._id.toString()
  );
  return entry ? entry.amount : 0;
}

// Helper function: modify user's token amount
async function changeUserToken(user, tokenObj, amount) {
  if (tokenObj.isUSDT) {
    user.coins = (user.coins || 0) + amount;
    if (user.coins < 0) user.coins = 0;
    await user.save();
    return amount;
  }
  return await user.changeToken(tokenObj, amount);
}

// Create C2C trade
export const createC2CTrade = async (req, res) => {
  try {
    const token = req.headers['token'];
    const initiator = await getUserFromToken(token);

    if (!initiator) {
      return res.status(401).json({ code: 1010, message: 'Not logged in or user does not exist' });
    }

    const { targetUsername, myToken, myAmount, theirToken, theirAmount } = req.body;
    const sanitizedMyToken = (myToken || '').trim();
    const sanitizedTheirToken = (theirToken || '').trim();

    if (!targetUsername) {
      return res.status(400).json({ code: 1001, message: 'Please enter recipient\'s username' });
    }
    if (!myToken || myAmount === undefined || myAmount < 0) {
      return res.status(400).json({ code: 1002, message: 'Please enter the token and amount you offer, amount must be >= 0' });
    }
    if (!theirToken || theirAmount === undefined || theirAmount < 0) {
      return res.status(400).json({ code: 1003, message: 'Please enter the token and amount they offer, amount must be >= 0' });
    }

    // Find receiver
    const receiver = await User.findOne({ username: targetUsername });
    if (!receiver) {
      return res.status(404).json({ code: 1004, message: 'Recipient user does not exist' });
    }

    if (receiver._id.equals(initiator._id)) {
      return res.status(400).json({ code: 1005, message: 'Cannot trade with yourself' });
    }

    // Verify initiator's token exists
    const initiatorTokenObj = await findTokenByTicker(sanitizedMyToken);
    if (!initiatorTokenObj) {
      return res.status(400).json({ code: 1006, message: `Token ${sanitizedMyToken} does not exist` });
    }

    // Verify initiator has enough tokens
    const initiatorBalance = getUserTokenAmount(initiator, initiatorTokenObj);
    if (initiatorBalance < Number(myAmount)) {
      return res.status(400).json({
        code: 1007,
        message: `Your ${myToken} balance is insufficient, current: ${initiatorBalance}, required: ${myAmount}`
      });
    }

    // Verify receiver's token exists
    const receiverTokenObj = await findTokenByTicker(sanitizedTheirToken);
    if (!receiverTokenObj) {
      return res.status(400).json({ code: 1008, message: `Token ${sanitizedTheirToken} does not exist` });
    }

    // Freeze initiator's tokens (deduct from balance, transfer to receiver on completion, return on cancellation)
    await changeUserToken(initiator, initiatorTokenObj, -Number(myAmount));
    console.log(`[C2C] Frozen ${initiator.username}'s ${myAmount} ${myToken}`);

    const normalizedInitiatorTicker = normalizeTickerForStorage(sanitizedMyToken);
    const normalizedReceiverTicker = normalizeTickerForStorage(sanitizedTheirToken);

    const trade = new C2CTrade({
      initiator: initiator._id,
      receiver: receiver._id,
      initiatorToken: normalizedInitiatorTicker,
      initiatorAmount: Number(myAmount),
      receiverToken: normalizedReceiverTicker,
      receiverAmount: Number(theirAmount),
      status: 'pending'
    });

    await trade.save();

    res.status(201).json({
      code: 0,
      message: 'Trade created, waiting for confirmation (tokens frozen)',
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
    res.status(500).json({ code: 1000, message: 'Failed to create trade', error: error.message });
  }
};

// Get outgoing trades
export const getOutgoingTrades = async (req, res) => {
  try {
    const token = req.headers['token'];
    const user = await getUserFromToken(token);

    if (!user) {
      return res.status(401).json({ code: 1010, message: 'Not logged in' });
    }

    const trades = await C2CTrade.find({ initiator: user._id })
      .populate('receiver', 'username')
      .sort({ createdAt: -1 });

    const result = trades.map(t => ({
      id: t._id,
      to: t.receiver?.username || 'Unknown user',
      myToken: t.initiatorToken,
      myAmount: t.initiatorAmount,
      theirToken: t.receiverToken,
      theirAmount: t.receiverAmount,
      status: t.status,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      completedAt: t.completedAt
    }));

    res.json({ code: 0, data: result });
  } catch (error) {
    console.error('[C2C] Get outgoing trades error:', error);
    res.status(500).json({ code: 1000, message: 'Failed to get outgoing trades', error: error.message });
  }
};

// Get incoming trades
export const getIncomingTrades = async (req, res) => {
  try {
    const token = req.headers['token'];
    const user = await getUserFromToken(token);

    if (!user) {
      return res.status(401).json({ code: 1010, message: 'Not logged in' });
    }

    const trades = await C2CTrade.find({ receiver: user._id })
      .populate('initiator', 'username')
      .sort({ createdAt: -1 });

    // Note: From receiver's perspective, initiator pays "their offer", receiver pays "my offer"
    const result = trades.map(t => ({
      id: t._id,
      from: t.initiator?.username || 'Unknown user',
      theirToken: t.initiatorToken,    // What the other party (initiator) offers
      theirAmount: t.initiatorAmount,
      myToken: t.receiverToken,        // What I (receiver) need to offer
      myAmount: t.receiverAmount,
      status: t.status,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      completedAt: t.completedAt
    }));

    res.json({ code: 0, data: result });
  } catch (error) {
    console.error('[C2C] Get incoming trades error:', error);
    res.status(500).json({ code: 1000, message: 'Failed to get incoming trades', error: error.message });
  }
};

// Accept trade
export const acceptTrade = async (req, res) => {
  try {
    const token = req.headers['token'];
    const receiver = await getUserFromToken(token);

    if (!receiver) {
      return res.status(401).json({ code: 1010, message: 'Not logged in' });
    }

    const tradeId = req.params.id;
    const trade = await C2CTrade.findById(tradeId);

    if (!trade) {
      return res.status(404).json({ code: 1004, message: 'Trade does not exist' });
    }

    if (!trade.receiver.equals(receiver._id)) {
      return res.status(403).json({ code: 1011, message: 'Only receiver can accept the trade' });
    }

    if (trade.status !== 'pending') {
      return res.status(400).json({ code: 1006, message: `Trade status is ${trade.status}, cannot accept` });
    }

    // Get initiator user
    const initiator = await User.findById(trade.initiator);
    if (!initiator) {
      return res.status(404).json({ code: 1012, message: 'Initiator user does not exist' });
    }

    // Find tokens to be exchanged
    const initiatorTokenObj = await findTokenByTicker(trade.initiatorToken);
    const receiverTokenObj = await findTokenByTicker(trade.receiverToken);

    if (!initiatorTokenObj) {
      return res.status(400).json({ code: 1013, message: `Token ${trade.initiatorToken} does not exist` });
    }
    if (!receiverTokenObj) {
      return res.status(400).json({ code: 1014, message: `Token ${trade.receiverToken} does not exist` });
    }

    // Initiator's tokens were frozen when creating the trade, no need to check again

    // Check if receiver has enough balance
    const receiverBalance = getUserTokenAmount(receiver, receiverTokenObj);
    if (receiverBalance < trade.receiverAmount) {
      return res.status(400).json({
        code: 1016,
        message: `Your ${trade.receiverToken} balance is insufficient, current: ${receiverBalance}, required: ${trade.receiverAmount}`
      });
    }

    // Execute token transfer
    // Initiator's tokens are frozen, directly transfer to receiver
    // 1. Initiator: add receiverToken (what receiver offers)
    await changeUserToken(initiator, receiverTokenObj, trade.receiverAmount);

    // 2. Receiver: subtract receiverToken, add initiatorToken (frozen by initiator)
    await changeUserToken(receiver, receiverTokenObj, -trade.receiverAmount);
    await changeUserToken(receiver, initiatorTokenObj, trade.initiatorAmount);

    // Update trade status
    trade.status = 'accepted';
    trade.updatedAt = new Date();
    trade.completedAt = new Date();
    await trade.save();

    console.log(`[C2C] Trade ${tradeId} completed:`);
    console.log(`  - ${initiator.username}: -${trade.initiatorAmount} ${trade.initiatorToken}(frozen), +${trade.receiverAmount} ${trade.receiverToken}`);
    console.log(`  - ${receiver.username}: -${trade.receiverAmount} ${trade.receiverToken}, +${trade.initiatorAmount} ${trade.initiatorToken}`);

    res.json({
      code: 0,
      message: 'Trade completed',
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
    res.status(500).json({ code: 1000, message: 'Failed to accept trade', error: error.message });
  }
};

// Reject trade
export const rejectTrade = async (req, res) => {
  try {
    const token = req.headers['token'];
    const user = await getUserFromToken(token);

    if (!user) {
      return res.status(401).json({ code: 1010, message: 'Not logged in' });
    }

    const tradeId = req.params.id;
    const trade = await C2CTrade.findById(tradeId);

    if (!trade) {
      return res.status(404).json({ code: 1004, message: 'Trade does not exist' });
    }

    if (!trade.receiver.equals(user._id)) {
      return res.status(403).json({ code: 1011, message: 'Only receiver can reject the trade' });
    }

    if (trade.status !== 'pending') {
      return res.status(400).json({ code: 1006, message: `Trade status is ${trade.status}, cannot reject` });
    }

    // Unfreeze tokens: return to initiator
    const initiator = await User.findById(trade.initiator);
    if (initiator) {
      const initiatorTokenObj = await findTokenByTicker(trade.initiatorToken);
      if (initiatorTokenObj) {
        await changeUserToken(initiator, initiatorTokenObj, trade.initiatorAmount);
        console.log(`[C2C] Trade rejected, returned ${initiator.username}'s ${trade.initiatorAmount} ${trade.initiatorToken}`);
      }
    }

    trade.status = 'rejected';
    trade.updatedAt = new Date();
    await trade.save();

    res.json({ code: 0, message: 'Trade rejected', data: { id: trade._id, status: trade.status } });
  } catch (error) {
    console.error('[C2C] Reject trade error:', error);
    res.status(500).json({ code: 1000, message: 'Failed to reject trade', error: error.message });
  }
};

// Cancel trade (initiator cancels)
export const cancelTrade = async (req, res) => {
  try {
    const token = req.headers['token'];
    const user = await getUserFromToken(token);

    if (!user) {
      return res.status(401).json({ code: 1010, message: 'Not logged in' });
    }

    const tradeId = req.params.id;
    const trade = await C2CTrade.findById(tradeId);

    if (!trade) {
      return res.status(404).json({ code: 1004, message: 'Trade does not exist' });
    }

    if (!trade.initiator.equals(user._id)) {
      return res.status(403).json({ code: 1011, message: 'Only initiator can cancel the trade' });
    }

    if (trade.status !== 'pending') {
      return res.status(400).json({ code: 1006, message: `Trade status is ${trade.status}, cannot cancel` });
    }

    // Unfreeze tokens: return to initiator
    const initiatorTokenObj = await findTokenByTicker(trade.initiatorToken);
    if (initiatorTokenObj) {
      await changeUserToken(user, initiatorTokenObj, trade.initiatorAmount);
      console.log(`[C2C] Unfroze and returned ${user.username}'s ${trade.initiatorAmount} ${trade.initiatorToken}`);
    }

    trade.status = 'cancelled';
    trade.updatedAt = new Date();
    await trade.save();

    res.json({ code: 0, message: 'Trade cancelled, tokens returned', data: { id: trade._id, status: trade.status } });
  } catch (error) {
    console.error('[C2C] Cancel trade error:', error);
    res.status(500).json({ code: 1000, message: 'Failed to cancel trade', error: error.message });
  }
};

export const getIncomingPendingCount = async (req, res) => {
  try {
    const token = req.headers['token'];
    const user = await getUserFromToken(token);

    if (!user) {
      return res.status(401).json({ code: 1010, message: 'Not logged in' });
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
      from: trade.initiator?.username || 'Unknown user',
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
    res.status(500).json({ code: 1000, message: 'Failed to get trade alerts', error: error.message });
  }
};
