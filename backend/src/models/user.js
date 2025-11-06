
import { Schema, model } from 'mongoose'; // 1. 引入 mongoose

// 定义用户数据的Schema
const userSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  nickname: { type: String },
  coins: { type: Number, default: 0 },
  work_list: [{ type: Schema.Types.ObjectId, ref: 'Meme' }],
  favorite_list: [{ type: Schema.Types.ObjectId, ref: 'Meme' }],
  status: { type: String, enum: ['active', 'banned'], default: 'active' },

  verificationCode: String,
  verificationCodeExpiresAt: Date,
}, { timestamps: true });

// export default model('User', userSchema);
export const User = model('User', userSchema);