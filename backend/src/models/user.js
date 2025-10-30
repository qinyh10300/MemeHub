
import { Schema, model } from 'mongoose'; // 1. 引入 mongoose

// 定义用户数据的Schema
const userSchema = new Schema({
  // ... username, password 字段不变
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  // --- 新增字段 ---
  verificationCode: String,
  verificationCodeExpiresAt: Date,
}, { timestamps: true });

// export default model('User', userSchema);
export const User = model('User', userSchema);