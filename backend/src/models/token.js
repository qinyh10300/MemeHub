import mongoose from 'mongoose';
import * as Const from '../configs/const.js';
import { Order } from './order.js';
import { User } from './user.js';
import { Notification } from './notification.js';


const tokenSchema = new mongoose.Schema({
  meme: { type: mongoose.Schema.Types.ObjectId, ref: 'Meme', required: true },
  price: { type: Number, default: Const.TOKEN_INIT_PRICE },
  // RUsdt: { type: Number, default: Const.TOKEN_USDT_LIQUIDITY },
  RToken: { type: Number, default: Const.TOKEN_USDT_LIQUIDITY / Const.TOKEN_INIT_PRICE },
  k : { type: Number, default: Const.TOKEN_USDT_LIQUIDITY**2 / Const.TOKEN_INIT_PRICE },
  hasPendingOrder: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  priceHistory: [
    {
      time: { type: Date, default: Date.now },
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      side: { type: String, enum: ['BUY', 'SELL'] }, // 买入 / 卖出
      amount: { type: Number },
      price: { type: Number },
      newPrice: { type: Number }
    }
  ]
});

// 为检查订单成交添加锁机制，防止并发调用
const checkingTokenSet = new Set();
tokenSchema.statics.tryLockCheck = function (tokenId) {
  const key = tokenId.toString();
  if (checkingTokenSet.has(key)) return false;
  checkingTokenSet.add(key);
  return true;
};
tokenSchema.statics.unlockCheck = function (tokenId) {
  checkingTokenSet.delete(tokenId.toString());
};


tokenSchema.methods = {
  /**
   * 修改Token的RToken数量 
   * @param {Number} amount - 正数表示增加，负数表示减少
  */
  async changeRToken(amount) {
    // 保证RToken必须大于0
    if (this.RToken + amount <= 0) {
      throw new Error('Token池中Token数量不足');
    }
    this.RToken += amount;
  },

  /** 
   * 根据购买的Token数量计算USDT数量，包含手续费
   * @param {number} tokenAmount - 购买的Token数量，正数表示买入，负数表示卖出
   * @param {number} expectedPrice - 用户期望的单价，若合法（>0.1）则按照该价格计算，否则按照当前价格计算
   * @returns {number} 需要支付的USDT数量(正数)
  */
  getPriceByAmount(tokenAmount, expectedPrice=0) {
    const isBuy = tokenAmount > 0;
    const RToken = this.RToken;
    const k = this.k;
    // 检查买入数量是否超过池中数量
    if (isBuy && Math.abs(tokenAmount) >= RToken) {
      throw new Error('无法买入池中所有Token');
    }
    // 检查用户期望价格是否合法
    const isExpectedPriceValid = expectedPrice >= Const.TOKEN_INIT_PRICE;
    let newRToken = 0;
    let oldRToken = RToken;
    let oldRUsdt = k/RToken;
    if (isExpectedPriceValid) {
      oldRToken = Math.sqrt(k / expectedPrice);
      oldRUsdt = k / oldRToken;
      newRToken = oldRToken - tokenAmount;
    } else {
      newRToken = oldRToken - tokenAmount;
    }
    // 根据恒定乘积公式计算需要支付的USDT数量
    const newRUsdt = k / newRToken;
    const usdtAmount = newRUsdt - oldRUsdt;
    if (isBuy) {
      // 买入时加上手续费
      return usdtAmount * (1 + Const.FEE);
    } else {
      // 卖出时扣除手续费
      return -1 * usdtAmount * (1 - Const.FEE);
    }
  },

  /**
   * 更新Token价格及价格历史记录
   * @param {ObjectId} userId 交易用户
   * @param {Number} amount 交易数量 
   * @param {Number} price  交易USDT金额
   */
  async updatePrice(userId=null, amount=0, price=0) {
    // 币价计算公式为 RUsdt / RToken = (k/RToken)/RToken
    const newPrice = this.k / (this.RToken * this.RToken);
    this.price = newPrice;
    this.priceHistory.push({
      time: new Date(),
      user: userId,
      side: amount > 0 ? 'BUY' : 'SELL',
      amount: Math.abs(amount),
      price: Math.abs(price),
      newPrice: newPrice
    });
  },

  /** 
   * 检查是否有未完成的订单可以成交，只要第一个货币满足期望价格即成交整个订单
   * 买单：期望价格 >= 当前价格则成交，优先成交价高者、较早者，检查用户余额决定可成交数量
   * 卖单：期望价格 <= 当前价格则成交，优先成交价低者、较早者
   */
  async checkOrderFulfillment() {
    const tokenId = this._id;
    const TokenModel = this.constructor;

    // 抢锁：有别的检查在跑就直接退出
    if (!TokenModel.tryLockCheck(tokenId)) {
      return;
    }
    const session = await mongoose.startSession();
    try{
      // 查找所有未完成的订单
      const memeId = this.meme;
      const pendingOrders = await Order.find({ meme: memeId, status: 'PENDING' });
      // 区分买入和卖出订单
      const buyOrders = pendingOrders.filter(order => order.side === 'BUY');
      const sellOrders = pendingOrders.filter(order => order.side === 'SELL');
      // 排序：买单按期望价格从高到低，卖单按期望价格从低到高，价格相同者日期小优先
      buyOrders.sort((a, b) => b.expectedPrice - a.expectedPrice || a.createdAt - b.createdAt);
      sellOrders.sort((a, b) => a.expectedPrice - b.expectedPrice || a.createdAt - b.createdAt);
      // console.log(`Buy Orders: ${buyOrders.length}, Sell Orders: ${sellOrders.length}`);

      const currentPrice = this.price;
      // 检查首个买单期望价格（首个不满足其余必然不满足）
      const firstBuyOrder = buyOrders[0] || null;
      if (firstBuyOrder) {
        const expectedPrice = firstBuyOrder.expectedPrice;
        const expectedAmount = firstBuyOrder.amount;
        const user = await User.findById(firstBuyOrder.user);
        // console.log(`Expected Price: ${expectedPrice}, Current Price: ${currentPrice}`);
        if (expectedPrice >= currentPrice) {
          // 直接成交
          // 不返还额外预支的coin
          // 检查是否买入数量超过池中数量
          const maxAmount = this.RToken - Const.MIN_RTOKEN;
          const actualAmount = Math.min(expectedAmount, maxAmount);
          const usdtReturn = firstBuyOrder.coins - this.getPriceByAmount(actualAmount, expectedPrice);
          if (usdtReturn > 0) {
            await user.changeCoins(usdtReturn, session);
          }
          // 更新token
          await this.changeRToken(-actualAmount, session);
          const usdtCost = this.getPriceByAmount(actualAmount);
          await this.updatePrice(user._id, actualAmount, usdtCost, session);
          firstBuyOrder.status = 'COMPLETED';
          firstBuyOrder.completedAt = new Date();
          
          await firstBuyOrder.save({session});
          // 消息推送
          const notification = new Notification({
            user: user._id,
            type: 'coin',
            message: `您预约购买的${actualAmount}个${this.meme}已成功成交，花费${firstBuyOrder.coins} USDT。`
          });
          await notification.save({session});
        }
      }
      // 检查首个卖单期望价格（首个不满足其余必然不满足）
      const firstSellOrder = sellOrders[0];
      if (firstSellOrder) {
        const expectedPrice = firstSellOrder.expectedPrice;
        const expectedAmount = firstSellOrder.amount;
        const user = await User.findById(firstSellOrder.user);
        if (expectedPrice <= currentPrice) {
          // 直接成交
          await user.changeCoins(firstSellOrder.coins, session);
          await this.changeRToken(expectedAmount, session);
          const usdtGain = this.getPriceByAmount(-expectedAmount);
          await this.updatePrice(user._id, -expectedAmount, usdtGain, session);
          firstSellOrder.status = 'COMPLETED';
          firstSellOrder.completedAt = new Date();
          await firstSellOrder.save({session});
          
          // 消息推送
          const notification = new Notification({
            user: user._id,
            type: 'coin',
            message: `您预约出售的${expectedAmount}个${this.meme}已成功成交，获得${firstSellOrder.coins} USDT。`
          });
          await notification.save({session});
        }
      }
      this.hasPendingOrder = !!(await Order.exists({ meme: memeId, status: 'PENDING' }));
      await this.save({session});
    }
    finally { // 释放锁
      await session.endSession();
      TokenModel.unlockCheck(tokenId);
    }
  }
};

export const Token = mongoose.model('Token', tokenSchema);