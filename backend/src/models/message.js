import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['text', 'sticker'], default: 'text' },
  content: { type: String, default: '' },
  stickerUrl: { type: String, default: '' },
  stickerMeta: {
    prompt: { type: String },
    primaryEmoji: { type: String },
    tagline: { type: String },
    palette: [{ type: String }],
    style: { type: String }
  },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date },
  isDeleted: { type: Boolean, default: false },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deletedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

// 索引，加快查询速度
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, isRead: false, isDeleted: false });

export const Message = mongoose.model('Message', messageSchema);
