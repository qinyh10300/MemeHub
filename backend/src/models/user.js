
import { Schema, model } from 'mongoose'; // 1. 引入 mongoose

// 定义用户数据的Schema
const userSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  nickname: { type: String, unique: true, sparse: true },
  bio: { type: String, default: '' }, // 个人简介
  avatar: { type: String, default: '' }, // 头像URL
  loginToken: { type: String },
  coins: { type: Number, default: 0 },
  workList: { type: [Schema.Types.ObjectId], ref: 'Meme', default: [] },
  favoriteList: { type: [Schema.Types.ObjectId], ref: 'Meme', default: [] },
  following: { type: [Schema.Types.ObjectId], ref: 'User', default: [] }, // 关注列表
  status: { type: String, enum: ['active', 'banned'], default: 'active' },

  verificationCode: String,
  verificationCodeExpiresAt: Date,
}, { timestamps: true });

// export default model('User', userSchema);
export const User = model('User', userSchema);