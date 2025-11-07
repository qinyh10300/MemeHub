import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  content: { type: String, required: true },
  meme: { type: mongoose.Schema.Types.ObjectId, ref: 'Meme', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  reference: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
  likes: { type: Number, default: 0 },
  likeList: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] }
});

export const Comment = mongoose.model('Comment', commentSchema);