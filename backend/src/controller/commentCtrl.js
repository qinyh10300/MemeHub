import { Meme } from '../models/meme.js';
import { User } from '../models/user.js';
import { Comment } from '../models/comment.js';
import { Notification } from '../models/notification.js';


function buildAvatarUrl(userDoc = {}, baseUrl = '') {
  const rawAvatar = userDoc.avatar?.trim();
  if (rawAvatar && rawAvatar.length > 0) {
    const isAbsolute = /^https?:\/\//i.test(rawAvatar);
    if (isAbsolute) {
      return rawAvatar;
    }
    if (rawAvatar.startsWith('//')) {
      return `${baseUrl ? baseUrl.split('://')[0] : 'http'}:${rawAvatar}`;
    }

    if (baseUrl) {
      const normalized = rawAvatar.startsWith('/') ? rawAvatar : `/${rawAvatar}`;
      return `${baseUrl}${normalized}`;
    }
    return rawAvatar;
  }

  const seed = userDoc._id?.toString() || userDoc.username || 'default';
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0; // 转为32位整数
  }
  const imgNum = Math.abs(hash % 70) + 1;
  return `https://i.pravatar.cc/150?img=${imgNum}`;
}

async function findUserByToken(token) {
  if (!token) {
    return null;
  }

  let user = await User.findOne({ username: token });
  if (user) {
    return user;
  }

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

export const commentMeme = async (req, res) => {
  try {
    const memeId = req.params.id;
    const { content, reference } = req.body;
    const token = req.headers.token;
    const username = token; // TODO:暂时用username作为token内容

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: `用户${username}不存在` });
    }

    const comment = new Comment({
      content,
      reference: reference || null,
      meme: memeId,
      user: user._id
    });
    await comment.save();

    // 加入模因评论列表
    const meme = await Meme.findById(memeId);
    if (!meme) {
      return res.status(404).json({ message: `模因${memeId}不存在` });
    }
    meme.comments.push(comment._id);
    await meme.save();

    const host = req.get('host');
    const baseUrl = host ? `${req.protocol}://${host}` : '';

    // 消息推送，如果是回复评论，则通知被回复用户
    if (reference) {
      const refComment = await Comment.findById(reference);
      // 注释则接收来自自己的回复通知
      // if (refComment && refComment.user.toString() !== user._id.toString()) {
        await Notification.create({
          user: refComment.user,
          type: 'interaction',
          message: `您的评论收到来自${user.nickname || user.username}的回复：${content.substring(0, 100)}`,
        });
      // }
    }
    else {
      // 否则通知模因作者
      if (meme.author.toString() !== user._id.toString()) {
        await Notification.create({
          user: meme.author,
          type: 'interaction',
          message: `您的模因'${meme.title.substring(0, 100)}'收到来自${user.nickname || user.username}的新评论：${content.substring(0, 100)}`,
        });
      }
    }

    res.status(201).json({
      code: 0,
      message: '创建模因评论成功',
      comment: {
        _id: comment._id,
        content: comment.content,
        reference: comment.reference,
        meme: comment.meme,
        user: user.username,
        nickname: user.nickname,
        avatar: buildAvatarUrl(user, baseUrl),
      }
    });
  } catch (error) {
    res.status(500).json({
      message: '创建模因评论失败',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...error
      }
    });
  }
};

export const getMemeComments = async (req, res) => {
  try {
    const memeId = req.params.id;
    const sortBy = req.query.sortBy === 'time' ? 'createdAt' : 'likes';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1; // 默认倒序
    const token = req.headers.token || req.headers.authorization?.replace('Bearer ', '');
    const host = req.get('host');
    const baseUrl = host ? `${req.protocol}://${host}` : '';

    // 检查meme是否存在
    const meme = await Meme.findById(memeId);
    if (!meme) {
      return res.status(404).json({ message: `模因${memeId}不存在` });
    }

    const viewUser = await findUserByToken(token);

    const comments = await Comment.find({ meme: memeId })
      .select('_id content reference user createdAt likes likeList')
      .populate('user', 'username nickname avatar')
      .sort({ [sortBy]: sortOrder })
      .lean();

    const formattedComments = comments.map((comment) => {
      const userInfo = comment.user || {};
      const userId = userInfo._id ? userInfo._id.toString() : '';
      const avatar = buildAvatarUrl(userInfo, baseUrl);
      const isLiked = viewUser
        ? Array.isArray(comment.likeList) && comment.likeList.some((id) => id.toString() === viewUser._id.toString())
        : false;

      return {
        _id: comment._id.toString(),
        content: comment.content,
        reference: comment.reference ? comment.reference.toString() : null,
        createdAt: comment.createdAt,
        likes: comment.likes || 0,
        isLiked,
        user: userInfo.username || '',
        userId,
        nickname: userInfo.nickname || '',
        avatar,
      };
    });

    res.status(200).json({
      code: 0,
      message: '获取模因评论成功',
      comments: formattedComments
    });
  } catch (error) {
    res.status(500).json({
      message: '获取模因评论ID列表失败',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...error
      }
    });
  }
};

export const getListComment = async (req, res) => {
  try {
    console.log('req.body:', req.body);
    const commentIds = req.body.commentIds;
    const token = req.headers.token;
    const username = token; // TODO:暂时用username作为token内容、
    const host = req.get('host');
    const baseUrl = host ? `${req.protocol}://${host}` : '';

    const view_user = await User.findOne({ username });
    if (!view_user) {
      return res.status(404).json({ message: `用户${username}不存在` });
    }

    // 查询所有存在的 comment
    const comments = await Comment.find({ _id: { $in: commentIds } })
      .select('_id content reference user createdAt likes likeList')
      .populate({
        path: 'reference',
        select: '_id content user createdAt likes',
        populate: {
          path: 'user',
          select: 'username nickname avatar bio -_id'
        }
      })
      .populate('user', 'username nickname avatar bio -_id')
      .lean();
    
    let is_liked = false;
    let is_author = false;
    // 构建返回列表，按请求顺序，缺失的comment补null
    const commentMap = new Map(comments.map(comment => [comment._id.toString(), comment]));
    const result = commentIds.map(id => {
      const comment = commentMap.get(id);
      if (comment) {
        // 处理 reference
        if (!comment.reference) {
          comment.reference = null;
        } else {
          // 处理 reference.user
          if (!comment.reference.user) {
            comment.reference.user = null;
          }
        }
        // 处理 user
        if (!comment.user) {
          comment.user = null;
        } else {
          comment.user.avatar = buildAvatarUrl(comment.user, baseUrl);
        }
        if (comment.reference?.user) {
          comment.reference.user.avatar = buildAvatarUrl(comment.reference.user, baseUrl);
        }
        is_liked = Array.isArray(comment.likeList) && comment.likeList.some(id => id.toString() === view_user._id.toString());
        is_author = comment.user && (comment.user.username === username);
        comment.userinfo = {
          is_liked,
          is_author
        };
        delete comment.likeList;
        return comment;
      } else {
        return { content: null };
      }
    });

    res.status(200).json({
      message: '获取评论列表成功',
      comments: result
    });
  } catch (error) {
    res.status(500).json({
      message: '获取评论列表失败',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...error
      }
    });
  }
};

export const likeComment = async (req, res) => {
  try {
    const commentId = req.params.id;
    const token = req.headers.token;
    const username = token; // TODO:暂时用username作为token内容
    // 查找评论
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: `评论${commentId}不存在` });
    }
    // 查找用户
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: `用户${username}不存在` });
    }
    // 检查用户是否已点赞
    const isLiked = comment.likeList.includes(user._id);
    if (isLiked) {
      // 取消点赞
      comment.likeList.pull(user._id);
    } else {
      // 点赞
      comment.likeList.push(user._id);
    }
    // 更新点赞数
    comment.likes = comment.likeList.length;
    await comment.save();

    // 消息推送，如果点赞评论的用户不是评论作者，则通知评论作者
    if (!isLiked && comment.user.toString() !== user._id.toString()) {
      await Notification.create({
        user: comment.user,
        type: 'interaction',
        message: `您的评论收到来自${user.nickname || user.username}的点赞`,
      });
    }

    res.status(200).json({
      message: isLiked ? `取消点赞评论${commentId}` : `点赞评论${commentId}`,
      comment: {
        _id: comment._id,
        content: comment.content,
        likes: comment.likes
      }
    });
  } catch (error) {
    res.status(500).json({
      message: '点赞评论失败',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...error
      }
    });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const commentId = req.params.id;
    const token = req.headers.token;
    const username = token; // TODO:暂时用username作为token内容

    // 查找评论
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: `评论${commentId}不存在` });
    }

    // 查找用户
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: `用户${username}不存在` });
    }

    // 检查用户权限
    if (comment.user.toString() !== user._id.toString()) {
      return res.status(403).json({ message: `没有权限删除评论${commentId}` });
    }

    // 从模因的评论列表中移除
    const meme = await Meme.findById(comment.meme);
    if (meme) {
      meme.comments.pull(comment._id);
      await meme.save();
    }

    // 删除评论
    await Comment.findByIdAndDelete(commentId);
    res.status(200).json({ message: `评论${commentId}已删除` });
  } catch (error) {
    res.status(500).json({
      message: '删除评论失败',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...error
      }
    });
  }
};
