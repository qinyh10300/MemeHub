import { User } from '../models/user.js';

// 生成随机昵称的工具函数
export async function generateNickname() {
  let nickname;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 10; // 最多尝试10次，避免无限循环

  // 循环生成昵称，直到找到一个唯一的
  while (!isUnique && attempts < maxAttempts) {
    // 生成一个 8 位随机数字
    const randomNum = Math.floor(10000000 + Math.random() * 90000000);
    // 返回格式：用户 + 8位随机数字
    nickname = `用户${randomNum}`;
    
    // 检查昵称是否已存在
    const existingUser = await User.findOne({ nickname });
    if (!existingUser) {
      isUnique = true;
    }
    attempts++;
  }

  // 如果尝试多次后仍然重复，使用时间戳确保唯一性
  if (!isUnique) {
    const timestamp = Date.now();
    nickname = `用户${timestamp}`;
  }

  return nickname;
}

