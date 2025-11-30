import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

// 索引，加快查询速度
messageSchema.index({ sender: 1, receiver: 1 });
messageSchema.index({ createdAt: -1 });

export const Message = mongoose.model('Message', messageSchema);
