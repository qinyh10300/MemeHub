import mongoose from 'mongoose';
import * as Const from '../configs/const.js';

const memeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  imageUrl: { type: String },
  description: { type: String, default: '作者很懒，没有填写简介' },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  likes: { type: Number, default: 0 },
  likeList: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },
  comments: { type: [mongoose.Schema.Types.ObjectId], ref: 'Comment', default: [] },
  status: { type: String, enum: ['inreview', 'active', 'banned'], default: 'active' },
});

export const Meme = mongoose.model('Meme', memeSchema);