import mongoose from 'mongoose';
import * as Const from '../configs/const.js';


const tokenSchema = new mongoose.Schema({
  meme: { type: mongoose.Schema.Types.ObjectId, ref: 'Meme', required: true },
  price: { type: Number, default: Const.TOKEN_INIT_PRICE },
  RUsdt: { type: Number, default: Const.TOKEN_USDT_LIQUIDITY },
  RToken: { type: Number, default: Const.TOKEN_USDT_LIQUIDITY / Const.TOKEN_INIT_PRICE },
  // k : { type: Number, default: Const.TOKEN_INIT_PRICE * Const.TOKEN_USDT_LIQUIDITY**2 },
  createdAt: { type: Date, default: Date.now },
  priceHistory: [
    {
      time: { type: Date, default: Date.now },
      price: { type: Number, required: true }
    }
  ]
});

export const Token = mongoose.model('Token', tokenSchema);

tokenSchema.methods.updatePrice = function () {
  // 币价计算公式为 RUsdt / RToken
  const newPrice = this.RUsdt / this.RToken;
  this.price = newPrice;
  this.priceHistory.push({
    time: new Date(),
    price: newPrice
  });
  return this.save();
};

/** 
 * 根据购买的Token数量计算USDT数量，包含手续费
 * @param {number} tokenAmount - 购买的Token数量，正数表示买入，负数表示卖出
 * @returns {number} 需要支付的USDT数量
*/
tokenSchema.methods.getPriceByAmount = function (tokenAmount) {
  const isBuy = tokenAmount > 0;
  // 根据恒定乘积公式计算需要支付的USDT数量
  const RUsdt = this.RUsdt;
  const RToken = this.RToken;
  const newRToken = RToken + tokenAmount;
  const newRUsdt = (RToken * RUsdt) / newRToken;
  const usdtAmount = RUsdt - newRUsdt;
  if (isBuy) {
    // 买入时加上手续费
    return usdtAmount * (1 + Const.FEE);
  } else {
    // 卖出时扣除手续费
    return usdtAmount * (1 - Const.FEE);
  }
};