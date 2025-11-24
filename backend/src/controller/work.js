import { Meme } from '../models/meme.js';
import { User } from '../models/user.js';
import { Comment } from '../models/comment.js';

import * as Const from '../configs/const.js';

import fs from 'fs';
import path from 'path';
import pkg from 'jsonwebtoken';

const { verify } = pkg;

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

// 创建模因
export const createMeme = async (req, res) => {
  try {
    const { title, ticker, description } = req.body;
    const file = req.file;
    const token = req.headers.token;
    const username = token;// TODO:暂时用username作为token内容
    // 检查title和ticker是否已存在
    const existTitle = await Meme.findOne({ title });
    if (existTitle) {
      if (file) fs.unlink(path.join(file.destination, file.filename), () => {});
      return res.status(400).json({ code: 1007, message: '该标题已存在，请更换标题' });
    }
    const existTicker = await Meme.findOne({ ticker });
    if (existTicker) {
      if (file) fs.unlink(path.join(file.destination, file.filename), () => {});
      return res.status(400).json({ code: 1008, message: '该ticker已存在，请更换ticker' });
    }

    // 检查是否上传图片
    if (!file) {
      return res.status(400).json({ code: 1009, message: '图片未上传' });
    }

    // 查找作者的用户Id
    const user = await User.findOne({ username });
    if (!user) {
      if (file) {
        fs.unlink(path.join(file.destination, file.filename), () => {});
      }
      return res.status(401).json({ code: 1002, message: '用户不存在，请先登录' });
    }

    // 先用原文件名创建meme，后续再重命名
    const newMeme = new Meme({ title, ticker, description, author: user._id });
    await newMeme.save();

    // 只有创建成功后才重命名文件
    const ext = path.extname(file.originalname);
    const newFilename = `${newMeme._id}${ext}`;
    const oldPath = path.join(file.destination, file.filename);
    const newPath = path.join(file.destination, newFilename);

    // 加入用户作品列表
    user.workList.push(newMeme._id);
    await user.save();

    // 检查是否已存在同名文件，若存在则删除原文件，保留新文件
    if (fs.existsSync(newPath)) {
      fs.unlinkSync(newPath); // 删除原来的同名文件
    }
    
    // 手动设置 imageUrl 并保存（确保路径以 / 开头）
    newMeme.imageUrl = `/${Const.MEME_DIR}${newFilename}`;
    await newMeme.save();

    fs.renameSync(oldPath, newPath);

    const memeData = await Meme.findById(newMeme._id)
      .select('title imageUrl description author createdAt likes ticker _id')
      .populate('author', 'username -_id')
      .lean();

    res.status(201).json({
      code: 0,
      message: '创建模因成功',
      data: memeData
    });
  } catch (error) {
    // 如果有文件，出错时也删除
    if (req.file) {
      fs.unlink(path.join(req.file.destination, req.file.filename), () => {});
    }
    // 输出详细错误信息
    console.error('创建模因失败:', error);
    res.status(500).json({
      code: 5000,
      message: '创建模因失败',
      error: process.env.NODE_ENV === 'development' ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    });
  }
};

export const getMemeDetail = async (req, res) => {
  try {
    const memeId = req.params.id;
    const token = req.headers.token;
    const username = token;// TODO:暂时用username作为token内容

    const meme = await Meme.findById(memeId)
      .select('title imageUrl ticker description author createdAt likes favorites status likeList')
      .populate('author', 'username nickname avatar bio -_id');
    if (!meme) {
      return res.status(404).json({ message: '模因不存在' });
    }

    // 当前用户关于该模因的信息
    let is_author = false;
    let is_liked = false;
    let is_favorited = false;

    const user = await User.findOne({ username });
    if (user) {
      is_author = meme.author.username === username;

      // console.log('likeList:', meme.likeList);
      // console.log('user._id:', user._id);
      // is_liked = Array.isArray(meme.likeList) && meme.likeList.includes(user._id);
      is_liked = Array.isArray(meme.likeList) && meme.likeList.some(id => id.toString() === user._id.toString());
      is_favorited = Array.isArray(user.favoriteList) && user.favoriteList.includes(meme._id);
    }

    const memeObj = meme.toObject();
    delete memeObj.likeList;
    res.status(200).json({
      ...memeObj,
      userinfo: {
        is_author,
        is_liked,
        is_favorited
      }
    });
  } catch (error) {
    res.status(500).json({
      message: '获取模因详情失败',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...error
      }
    });
  }
};

export const getListMeme = async (req, res) => {
  try {
    const memeIds = req.body.memeIds;
    const token = req.headers.token;
    const username = token; // TODO:暂时用username作为token内容

    // 查询所有存在的 meme
    const memes = await Meme.find({ _id: { $in: memeIds } })
      .select('_id title imageUrl ticker description author createdAt likes')
      .populate('author', 'username nickname avatar bio -_id')
      .lean();

    // 构建返回列表，按请求顺序，缺失的id补404
    const memeMap = new Map(memes.map(meme => [meme._id.toString(), meme]));
    const result = memeIds.map(id => {
      const meme = memeMap.get(id);
      if (meme) {
        return meme;
      } else {
        return { _id: null };
      }
    });

    res.status(200).json({ memes: result });
  } catch (error) {
    res.status(500).json({
      message: '获取模因列表详情失败',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...error
      }
    });
  }
};

export const getMemeList = async (req, res) => {
  try {
    // 支持 ?sortBy=time 或 ?sortBy=likes
    const sortBy = req.query.sortBy === 'hot' ? 'likes' : 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1; // 默认倒序

    const memes = await Meme.find()
      .select('_id likes createdAt')
      .sort({ [sortBy]: sortOrder });

    // res.status(200).json(memes);
    
    const memeIds = memes.map(meme => meme._id);
    res.status(200).json({ memeIds });
  } catch (error) {
    res.status(500).json({
      message: '获取模因列表失败',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...error
      }
    });
  }
};

export const deleteMeme = async (req, res) => {
  try {
    const memeId = req.params.id;
    const token = req.headers.token;
    const username = token; // TODO:暂时用username作为token内容

    // 删除评论区
    const comments = await Comment.find({ meme: memeId });
    for (const comment of comments) {
      await Comment.findByIdAndDelete(comment._id);
    }

    // 查找模因
    const meme = await Meme.findById(memeId);
    if (!meme) {
      return res.status(404).json({ message: `模因${memeId}不存在` });
    }

    // 检查用户权限
    const user = await User.findOne({ username });
    if (!user || meme.author.toString() !== user._id.toString()) {
      return res.status(403).json({ message: `没有权限删除模因${memeId}` });
    }
    
    // 从用户作品列表中移除
    user.workList.pull(meme._id);
    await user.save();

    // 删除模因
    await Meme.findByIdAndDelete(memeId);
    res.status(200).json({ message: `模因${memeId}已删除` });
  } catch (error) {
    res.status(500).json({
      message: '删除模因失败',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...error
      }
    });
  }
};

export const likeMeme = async (req, res) => {
  try {
    const memeId = req.params.id;
    const token = req.headers.token;
    const username = token; // TODO:暂时用username作为token内容

    // 查找模因
    const meme = await Meme.findById(memeId);
    if (!meme) {
      return res.status(404).json({ message: `模因${memeId}不存在` });
    }

    // 查找用户
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: `用户${username}不存在` });
    }

    // 检查用户是否已点赞
    const isLiked = meme.likeList.includes(user._id);
    if (isLiked) {
      // 取消点赞
      meme.likeList.pull(user._id);
    } else {
      // 点赞
      meme.likeList.push(user._id);
    }
    // 更新点赞数
    meme.likes = meme.likeList.length;
    await meme.save();

    res.status(200).json({
      message: isLiked ? `取消点赞模因${memeId}` : `点赞模因${memeId}`,
      meme: {
        _id: meme._id,
        title: meme.title,
        likes: meme.likes,
        imageUrl: meme.imageUrl
      }
    });
  } catch (error) {
    res.status(500).json({
      message: '点赞模因失败',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...error
      }
    });
  }
};

export const favoriteMeme = async (req, res) => {
  try {
    const memeId = req.params.id;
    const token = req.headers.token;
    const username = token; // TODO:暂时用username作为token内容
    // 查找模因
    const meme = await Meme.findById(memeId);
    if (!meme) {
      return res.status(404).json({ message: `模因${memeId}不存在` });
    }
    // 查找用户
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: `用户${username}不存在` });
    }
    // 检查用户是否已收藏
    const isFavorited = user.favoriteList.includes(meme._id);
    if (isFavorited) {
      // 取消收藏
      user.favoriteList.pull(meme._id);
      meme.favorites = Math.max(0, meme.favorites - 1);
    }
    else {
      // 收藏
      user.favoriteList.push(meme._id);
      meme.favorites += 1;
    }
    await user.save();
    await meme.save();

    res.status(200).json({
      message: isFavorited ? `取消收藏模因${memeId}` : `收藏模因${memeId}`,
      meme: {
        _id: meme._id,
        title: meme.title,
        imageUrl: meme.imageUrl
      }
    });
  } catch (error) {
    res.status(500).json({
      message: '收藏模因失败',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...error
      }
    });
  }
};

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
