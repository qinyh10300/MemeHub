import { Message } from '../models/message.js';
import { User } from '../models/user.js';
import pkg from 'jsonwebtoken';
import { generateStickerAsset } from '../services/stickerGenerator.js';
const { verify } = pkg;

const RECALL_WINDOW_MINUTES = parseInt(process.env.MESSAGE_RECALL_WINDOW_MINUTES, 10) || 5;
const RECALL_WINDOW_MS = RECALL_WINDOW_MINUTES * 60 * 1000;
const STICKER_GENERATION_DISABLED_MESSAGE =
  process.env.STICKER_GENERATION_DISABLED_MESSAGE || 'AI生成表情包功能已暂时关闭';
const STICKER_GENERATION_DISABLED = `${process.env.STICKER_GENERATION_DISABLED}` === 'true';

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

function buildStickerUrl(pathValue = '', baseUrl = '') {
  if (!pathValue) return '';
  if (/^https?:\/\//i.test(pathValue)) return pathValue;
  if (pathValue.startsWith('//')) return `${baseUrl ? baseUrl.split('://')[0] : 'http'}:${pathValue}`;
  const normalized = pathValue.startsWith('/') ? pathValue : `/${pathValue}`;
  return baseUrl ? `${baseUrl}${normalized}` : normalized;
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
    const {
      receiverId,
      content = '',
      type = 'text',
      stickerUrl = '',
      stickerMeta = null
    } = req.body;
    const token = req.headers.token;
    
    const sender = await findUserByToken(token);
    if (!sender) return res.status(401).json({ message: '用户未登录' });

    const normalizedType = ['text', 'sticker'].includes(type) ? type : 'text';

    if (normalizedType === 'text') {
      if (!content || !content.trim()) {
        return res.status(400).json({ message: '消息内容不能为空' });
      }
    }

    if (normalizedType === 'sticker') {
      if (!stickerUrl || typeof stickerUrl !== 'string') {
        return res.status(400).json({ message: '表情包地址不能为空' });
      }
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) return res.status(404).json({ message: '接收者不存在' });

    const message = new Message({
      sender: sender._id,
      receiver: receiver._id,
      type: normalizedType,
      content: normalizedType === 'text' ? content : '',
      stickerUrl: normalizedType === 'sticker' ? stickerUrl : '',
      stickerMeta: normalizedType === 'sticker' ? stickerMeta : undefined
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

    const unreadIds = [];
    messages.forEach(msg => {
      if (!msg.isRead && !msg.isDeleted && msg.receiver?._id?.toString() === sender._id.toString()) {
        unreadIds.push(msg._id);
      }
    });
    let readAt = null;
    if (unreadIds.length) {
      readAt = new Date();
      await Message.updateMany(
        { _id: { $in: unreadIds } },
        { isRead: true, readAt }
      );
    }

    // 处理头像URL
    const host = req.get('host');
    const baseUrl = host ? `${req.protocol}://${host}` : '';

    const formattedMessages = messages.map(msg => {
      const plain = msg.toObject();
      if (readAt && unreadIds.find(id => id.toString() === msg._id.toString())) {
        plain.isRead = true;
        plain.readAt = readAt;
      }
      if (plain.isDeleted) {
        plain.content = '';
        plain.stickerUrl = '';
      }
      plain.stickerUrl = buildStickerUrl(plain.stickerUrl, baseUrl);
      return {
        ...plain,
        sender: {
          ...msg.sender.toObject(),
          avatar: buildAvatarUrl(msg.sender, baseUrl)
        },
        receiver: {
          ...msg.receiver.toObject(),
          avatar: buildAvatarUrl(msg.receiver, baseUrl)
        }
      };
    });

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
            type: msg.type,
            content: msg.type === 'sticker'
              ? '[表情包]'
              : (msg.isDeleted ? '' : msg.content),
            createdAt: msg.createdAt,
            isRead: msg.isRead,
            isSelf: isSender
          },
          unreadCount: 0
        });
      }

      if (!isSender && !msg.isRead && !msg.isDeleted) {
        const existing = conversationMap.get(otherId);
        existing.unreadCount += 1;
      }
    });

    const conversations = Array.from(conversationMap.values());

    res.status(200).json({ code: 0, data: conversations });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '获取会话列表失败', error: error.message });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const token = req.headers.token;
    const currentUser = await findUserByToken(token);
    if (!currentUser) return res.status(401).json({ message: '用户未登录' });

    const total = await Message.countDocuments({
      receiver: currentUser._id,
      isRead: false,
      isDeleted: false
    });

    const recent = await Message.find({
      receiver: currentUser._id,
      isRead: false,
      isDeleted: false
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('sender', 'username nickname avatar');

    const summaries = recent.map(msg => ({
      messageId: msg._id,
      sender: {
        _id: msg.sender._id,
        username: msg.sender.username,
        nickname: msg.sender.nickname,
        avatar: msg.sender.avatar
      },
      preview: msg.type === 'sticker' ? '[表情包]' : msg.content,
      createdAt: msg.createdAt
    }));

    res.status(200).json({
      code: 0,
      data: {
        total,
        previews: summaries
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '获取未读消息失败', error: error.message });
  }
};

// 撤回消息
export const deleteMessage = async (req, res) => {
  try {
    const token = req.headers.token;
    const currentUser = await findUserByToken(token);
    if (!currentUser) return res.status(401).json({ message: '用户未登录' });

    const { messageId } = req.params;
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: '消息不存在' });

    if (message.sender.toString() !== currentUser._id.toString()) {
      return res.status(403).json({ message: '只能撤回自己发送的消息' });
    }

    if (message.isDeleted) {
      return res.status(400).json({ message: '消息已撤回' });
    }

    const age = Date.now() - new Date(message.createdAt).getTime();
    if (age > RECALL_WINDOW_MS) {
      return res.status(400).json({ message: `只能在${RECALL_WINDOW_MINUTES}分钟内撤回` });
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    message.deletedBy = currentUser._id;
    await message.save();

    res.status(200).json({ code: 0, message: '撤回成功' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '撤回消息失败', error: error.message });
  }
};

export const generateSticker = async (req, res) => {
  try {
    const token = req.headers.token;
    const currentUser = await findUserByToken(token);
    if (!currentUser) return res.status(401).json({ message: '用户未登录' });

    if (STICKER_GENERATION_DISABLED) {
      return res.status(503).json({
        code: 2001,
        message: STICKER_GENERATION_DISABLED_MESSAGE
      });
    }

    const { prompt } = req.body;
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ message: '请输入想要生成的表情关键词' });
    }

    const result = await generateStickerAsset(prompt.trim(), currentUser);
    const host = req.get('host');
    const baseUrl = host ? `${req.protocol}://${host}` : '';
    const absoluteUrl = buildStickerUrl(result.url, baseUrl);

    res.status(200).json({
      code: 0,
      data: {
        url: absoluteUrl,
        path: result.url,
        meta: result.meta
      }
    });
  } catch (error) {
    console.error('[Sticker] generate error:', error);
    res.status(500).json({ message: '生成表情包失败', error: error.message });
  }
};
