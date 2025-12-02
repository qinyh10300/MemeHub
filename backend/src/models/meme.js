import mongoose from 'mongoose';
import * as Const from '../configs/const.js';

const memeSchema = new mongoose.Schema({
  title: { type: String, required: true, maxlength: Const.MEME_TITLE_MAX_LENGTH},
  ticker: { type: String, required: true, maxlength: Const.MEME_TICKER_MAX_LENGTH },
  imageUrl: { type: String },
  description: { type: String, default: '作者很懒，没有填写简介' },
  withToken: { type: Boolean, default: false },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  likes: { type: Number, default: 0 },
  likeList: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },
  favorites: { type: Number, default: 0 },
  comments: { type: [mongoose.Schema.Types.ObjectId], ref: 'Comment', default: [] },
  status: { type: String, enum: ['pending', 'active', 'banned'], default: 'pending' },
});

export const Meme = mongoose.model('Meme', memeSchema);