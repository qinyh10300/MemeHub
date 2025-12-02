import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  user:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // token: { type: mongoose.Schema.Types.ObjectId, ref: 'Token', required: true },
  meme:  { type: mongoose.Schema.Types.ObjectId, ref: 'Meme', required: true },

  side: { type: String, enum: ['BUY', 'SELL'], required: true }, // 买入预约 / 卖出预约

  expectedPrice: { type: Number, required: true }, // 期望单价USDT
  amount: { type: Number, required: true }, // 预约买/卖的 Token 数量

  status: {
    type: String,
    enum: ['pending', 'COMPLETED', 'CANCELLED'],
    default: 'pending'
  },

  createdAt:  { type: Date, default: Date.now },
  updatedAt:  { type: Date, default: Date.now },
  completedAt:{ type: Date }
});

// orderSchema.index({ token: 1, side: 1, status: 1, expectedPrice: 1, createdAt: 1 });

export const Order = mongoose.model('Order', orderSchema);