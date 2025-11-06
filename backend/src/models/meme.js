import mongoose from 'mongoose';
import * as Const from '../configs/const.js';

const memeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  imageUrl: { type: String },
  description: { type: String },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  likes: { type: Number, default: 0 },
  like_list: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  status: { type: String, enum: ['inreview', 'active', 'banned'], default: 'active' },
});

export const Meme = mongoose.model('Meme', memeSchema);