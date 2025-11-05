import { Meme } from '../models/meme.js';
import { User } from '../models/user.js';
import fs from 'fs';
import path from 'path';

// 创建模因
export const createMeme = async (req, res) => {
  try {
    const { title, author } = req.body;
    const file = req.file;
    // 检查标题是否重复
    const exist = await Meme.findOne({ title });
    if (exist) {
      // 删除已上传的文件
      if (file) {
        fs.unlink(path.join(file.destination, file.filename), () => {});
      }
      return res.status(400).json({ message: '该标题已存在，请更换标题' });
    }

    // 检查是否上传图片
    if (!file) {
      return res.status(400).json({ message: '图片未上传' });
    }
    // 查找用户 ObjectId
    const user = await User.findOne({ username: author });
    if (!user) {
      if (file) {
        fs.unlink(path.join(file.destination, file.filename), () => {});
      }
      return res.status(400).json({ message: 'author_id不存在' });
    }

    // 先用原文件名创建meme，后续再重命名
    const imageUrl = `/uploads/${file.filename}`;
    const newMeme = new Meme({ title, imageUrl, ticker, author: user._id });
    await newMeme.save();

    // 只有创建成功后才重命名文件
    const ext = path.extname(file.originalname);
    const newFilename = `${title}${ext}`;
    const oldPath = path.join(file.destination, file.filename);
    const newPath = path.join(file.destination, newFilename);

    // 检查是否已存在同名文件，若存在则加时间戳
    let finalFilename = newFilename;
    let finalPath = newPath;
    if (fs.existsSync(newPath)) {
      const timestamp = Date.now();
      finalFilename = `${title}-${timestamp}${ext}`;
      finalPath = path.join(file.destination, finalFilename);
    }

    fs.renameSync(oldPath, finalPath);

    // 更新数据库中的 imageUrl
    newMeme.imageUrl = `/uploads/${finalFilename}`;
    await newMeme.save();

    res.status(201).json(newMeme);
  } catch (error) {
    // 如果有文件，出错时也删除
    if (req.file) {
      fs.unlink(path.join(req.file.destination, req.file.filename), () => {});
    }
    res.status(500).json({ message: '创建模因失败', error });
  }
};