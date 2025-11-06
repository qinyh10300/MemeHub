import { Meme } from '../models/meme.js';
import { User } from '../models/user.js';

import * as Const from '../configs/const.js';

import fs from 'fs';
import path from 'path';

// 创建模因
export const createMeme = async (req, res) => {
  try {
    const { title, description, author } = req.body;
    const file = req.file;
    // // 检查标题是否重复
    // const exist = await Meme.findOne({ title });
    // if (exist) {
    //   // 删除已上传的文件
    //   if (file) {
    //     fs.unlink(path.join(file.destination, file.filename), () => {});
    //   }
    //   return res.status(400).json({ message: '该标题已存在，请更换标题' });
    // }

    // 检查是否上传图片
    if (!file) {
      return res.status(400).json({ message: '图片未上传' });
    }

    // 查找用户Id
    const user = await User.findOne({ username: author });
    if (!user) {
      if (file) {
        fs.unlink(path.join(file.destination, file.filename), () => {});
      }
      return res.status(400).json({ message: 'author_id不存在' });
    }

    // 先用原文件名创建meme，后续再重命名
    const newMeme = new Meme({ title, description, author: user._id });
    await newMeme.save();

    // 只有创建成功后才重命名文件
    const ext = path.extname(file.originalname);
    const newFilename = `${newMeme._id}${ext}`;
    const oldPath = path.join(file.destination, file.filename);
    const newPath = path.join(file.destination, newFilename);

    // 检查是否已存在同名文件，若存在则删除原文件，保留新文件
    if (fs.existsSync(newPath)) {
      fs.unlinkSync(newPath); // 删除原来的同名文件
    }
    
    // 手动设置 imageUrl 并保存
    newMeme.imageUrl = `${Const.MEME_DIR}${newFilename}`;
    await newMeme.save();

    fs.renameSync(oldPath, newPath);

    res.status(201).json(
      await Meme.findById(newMeme._id)
        .select('title imageUrl description author createdAt likes')
        .populate('author', 'username -_id')
    );
  } catch (error) {
    // 如果有文件，出错时也删除
    if (req.file) {
      fs.unlink(path.join(req.file.destination, req.file.filename), () => {});
    }
    // 输出详细错误信息
    res.status(500).json({
      message: '创建模因失败',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...error
      }
    });
  }
};

export const getMemeDetail = async (req, res) => {
  try {
    const memeId = req.params.id;
    const token = req.token;
    const username = token ? token.user.username : null;// TODO:暂时用username作为token内容

    const meme = await Meme.findById(memeId)
      .select('title imageUrl description author createdAt likes comments status')
      .populate('author', 'username -_id');
    if (!meme) {
      return res.status(404).json({ message: '模因不存在' });
    }

    // 先声明变量
    let is_author = false;
    let is_liked = false;
    let is_favorited = false;

    // 当前用户关于该模因的信息
    const user = await User.findOne({ username });
    if (user) {
      is_author = meme.author.username === username;
      is_liked = meme.like_list.some(userId => userId.toString() === user._id.toString());
      is_favorited = user.favorites && user.favorites.includes(meme._id);
    }

    res.status(200).json({
      ...meme.toObject(),
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

export const getMemeList = async (req, res) => {
  try {
    // 支持 ?sortBy=time 或 ?sortBy=likes
    const sortBy = req.query.sortBy === 'hot' ? 'likes' : 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1; // 默认倒序

    const memes = await Meme.find()
      .select('_id likes createdAt')
      .sort({ [sortBy]: sortOrder });

    res.status(200).json(memes);
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