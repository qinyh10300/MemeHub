
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
  status: { type: String, enum: ['active', 'banned'], default: 'active' },
  role: { type: String, enum: ['user', 'reviewer'], default: 'user' },

  verificationCode: String,
  verificationCodeExpiresAt: Date,
}, { timestamps: true });

userSchema.methods.changeToken = async function(token, amount) {
    // 检查用户是否已有该Token记录
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
};


export const User = model('User', userSchema);