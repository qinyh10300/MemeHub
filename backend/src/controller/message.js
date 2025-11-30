import { Message } from '../models/message.js';
import { User } from '../models/user.js';
import pkg from 'jsonwebtoken';
const { verify } = pkg;

// 辅助函数：构建头像URL
function buildAvatarUrl(userDoc = {}, baseUrl = '') {
  const rawAvatar = userDoc.avatar?.trim();
  if (rawAvatar && rawAvatar.length > 0) {
    const isAbsolute = /^https?:\/\//i.test(rawAvatar);
    if (isAbsolute) return rawAvatar;
    if (rawAvatar.startsWith('//')) return `${baseUrl ? baseUrl.split('://')[0] : 'http'}:${rawAvatar}`;
    if (baseUrl) {
      const normalized = rawAvatar.startsWith('/') ? rawAvatar : `/${rawAvatar}`;
      return `${baseUrl}${normalized}`;
    }
    return rawAvatar;
  }
  // 默认头像逻辑
  const seed = userDoc._id?.toString() || userDoc.username || 'default';
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  const imgNum = Math.abs(hash % 70) + 1;
  return `https://i.pravatar.cc/150?img=${imgNum}`;
}

async function findUserByToken(token) {
  if (!token) return null;

  let user = await User.findOne({ username: token });
  if (user) return user;

  try {
    const decoded = verify(token, process.env.JWT_SECRET);
    const userId = decoded?.user?.id;
    if (userId) {
      user = await User.findById(userId);
      return user;
    }
  } catch (error) {
    return null;
  }

  return null;
}

// 发送消息
export const sendMessage = async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    const token = req.headers.token;
    
    const sender = await findUserByToken(token);
    if (!sender) return res.status(401).json({ message: '用户未登录' });

    if (!content || !content.trim()) {
      return res.status(400).json({ message: '消息内容不能为空' });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) return res.status(404).json({ message: '接收者不存在' });

    const message = new Message({
      sender: sender._id,
      receiver: receiver._id,
      content: content
    });

    await message.save();

    res.status(201).json({ code: 0, message: '发送成功', data: message });
  } catch (error) {
    res.status(500).json({ message: '发送消息失败', error: error.message });
  }
};

// 获取与特定用户的聊天记录
export const getHistory = async (req, res) => {
  try {
    const { targetId } = req.params;
    const token = req.headers.token;
    const sender = await findUserByToken(token);
    if (!sender) return res.status(401).json({ message: '用户未登录' });

    const messages = await Message.find({
      $or: [
        { sender: sender._id, receiver: targetId },
        { sender: targetId, receiver: sender._id }
      ]
    })
    .sort({ createdAt: 1 }) // 按时间正序
    .populate('sender', 'username nickname avatar')
    .populate('receiver', 'username nickname avatar');

    // 处理头像URL
    const host = req.get('host');
    const baseUrl = host ? `${req.protocol}://${host}` : '';

    const formattedMessages = messages.map(msg => ({
      ...msg.toObject(),
      sender: {
        ...msg.sender.toObject(),
        avatar: buildAvatarUrl(msg.sender, baseUrl)
      },
      receiver: {
        ...msg.receiver.toObject(),
        avatar: buildAvatarUrl(msg.receiver, baseUrl)
      }
    }));

    res.status(200).json({ code: 0, data: formattedMessages });
  } catch (error) {
    res.status(500).json({ message: '获取聊天记录失败', error: error.message });
  }
};

// 获取会话列表 (最近联系人)
export const getConversations = async (req, res) => {
  try {
    const token = req.headers.token;
    const currentUser = await findUserByToken(token);
    if (!currentUser) return res.status(401).json({ message: '用户未登录' });

    // 聚合查询：找出所有我发送或接收的消息，按对方ID分组，取最新一条
    // 这是一个简化版的逻辑，先查出所有相关消息，然后在内存中处理（对于小规模数据够用）
    const messages = await Message.find({
      $or: [{ sender: currentUser._id }, { receiver: currentUser._id }]
    })
    .sort({ createdAt: -1 })
    .populate('sender', 'username nickname avatar')
    .populate('receiver', 'username nickname avatar');

    const conversationMap = new Map();
    const host = req.get('host');
    const baseUrl = host ? `${req.protocol}://${host}` : '';

    messages.forEach(msg => {
      const isSender = msg.sender._id.toString() === currentUser._id.toString();
      const otherUser = isSender ? msg.receiver : msg.sender;
      const otherId = otherUser._id.toString();

      if (!conversationMap.has(otherId)) {
        conversationMap.set(otherId, {
          user: {
            _id: otherUser._id,
            username: otherUser.username,
            nickname: otherUser.nickname,
            avatar: buildAvatarUrl(otherUser, baseUrl)
          },
          lastMessage: {
            content: msg.content,
            createdAt: msg.createdAt,
            isRead: msg.isRead,
            isSelf: isSender
          }
        });
      }
    });

    const conversations = Array.from(conversationMap.values());

    res.status(200).json({ code: 0, data: conversations });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '获取会话列表失败', error: error.message });
  }
};
