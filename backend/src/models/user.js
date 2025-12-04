
import { Schema, model } from 'mongoose'; // 1. 引入 mongoose

// 定义用户数据的Schema
const userSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  nickname: { type: String, unique: true, sparse: true },
  bio: { type: String, default: '' }, // 个人简介
  avatar: { type: String, default: '' }, // 头像URL
  loginToken: { type: String },
  coins: { type: Number, default: 100 },
  workList: { type: [Schema.Types.ObjectId], ref: 'Meme', default: [] },
  favoriteList: { type: [Schema.Types.ObjectId], ref: 'Meme', default: [] },
  tokenList: [
    { 
      token: { type: Schema.Types.ObjectId, ref: 'Token' },
      amount: { type: Number, default: 0 } 
    }
  ],
  following: { type: [Schema.Types.ObjectId], ref: 'User', default: [] }, // 关注列表
  status: { type: String, enum: ['ACTIVE', 'BANNED'], default: 'ACTIVE' },
  role: { type: String, enum: ['user', 'reviewer'], default: 'user' },

  verificationCode: String,
  verificationCodeExpiresAt: Date,
}, { timestamps: true });

userSchema.methods = {
  /** 
   * 修改用户金币数量
   */
  async changeCoins(amount) {
    console.log(`Changing coins by amount ${amount} for user ${this._id}`);
    this.coins += amount;
    if (this.coins < 0) {
      this.coins = 0;
    }
    await this.save();
  },
  /**
   * 修改用户持有的Token数量
   * @param {ObjectId} token 
   * @param {Number} amount - 正数表示增加，负数表示减少
   * @returns {Number} 实际变动的数量，正数或负数
   */
  async changeToken(token, amount) {
    console.log(`Changing token ${token._id} by amount ${amount} for user ${this._id}`);
    const userTokenEntry = this.tokenList.find(entry => entry.token.toString() === token._id.toString());
    if (userTokenEntry) {
      // 更新后的tokenAmount不能小于0
      if (userTokenEntry.amount + amount < 0) {
        amount = -userTokenEntry.amount;
      }
      userTokenEntry.amount += amount;
    }
    else {
      this.tokenList.push({ token: token._id, amount: amount });
    }
    // 如果amount为0，则移除该记录
    this.tokenList = this.tokenList.filter(entry => entry.amount !== 0);
    await this.save();
    return amount;
  }
};


export const User = model('User', userSchema);