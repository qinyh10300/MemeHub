import mongoose from 'mongoose';

const c2cTradeSchema = new mongoose.Schema({
  // Initiator
  initiator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // Receiver
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Token and amount offered by initiator
  initiatorToken: { type: String, required: true },
  initiatorAmount: { type: Number, required: true },

  // Token and amount offered by receiver
  receiverToken: { type: String, required: true },
  receiverAmount: { type: Number, required: true },

  // Status: pending(awaiting acceptance) / accepted(accepted) / rejected(rejected) / cancelled(cancelled)
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'cancelled'],
    default: 'pending'
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  completedAt: { type: Date }
});

// Index: for efficient querying of user trades
c2cTradeSchema.index({ initiator: 1, status: 1, createdAt: -1 });
c2cTradeSchema.index({ receiver: 1, status: 1, createdAt: -1 });

export const C2CTrade = mongoose.model('C2CTrade', c2cTradeSchema);

