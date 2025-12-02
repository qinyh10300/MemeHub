import mongoose from 'mongoose';

const c2cTradeSchema = new mongoose.Schema({
  // 发起方
  initiator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // 接收方
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // 发起方付出的币种和数量
  initiatorToken: { type: String, required: true },
  initiatorAmount: { type: Number, required: true },
  
  // 接收方付出的币种和数量
  receiverToken: { type: String, required: true },
  receiverAmount: { type: Number, required: true },
  
  // 状态: pending(待接受) / accepted(已接受) / rejected(已拒绝) / cancelled(已取消)
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'cancelled'],
    default: 'pending'
  },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  completedAt: { type: Date }
});

// 索引：方便查询用户的交易
c2cTradeSchema.index({ initiator: 1, status: 1, createdAt: -1 });
c2cTradeSchema.index({ receiver: 1, status: 1, createdAt: -1 });

export const C2CTrade = mongoose.model('C2CTrade', c2cTradeSchema);

