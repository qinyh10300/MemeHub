
import { Schema, model } from 'mongoose'; // 1. 引入 mongoose

// 定义用户数据的Schema
const userSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  nickname: { type: String },
  loginToken: { type: String },
  coins: { type: Number, default: 0 },
  workList: { type: [Schema.Types.ObjectId], ref: 'Meme', default: [] },
  favoriteList: { type: [Schema.Types.ObjectId], ref: 'Meme', default: [] },
  status: { type: String, enum: ['active', 'banned'], default: 'active' },

  verificationCode: String,
  verificationCodeExpiresAt: Date,
}, { timestamps: true });

// export default model('User', userSchema);
export const User = model('User', userSchema);