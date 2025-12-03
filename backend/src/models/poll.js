import mongoose from 'mongoose';

const pollSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  type: { 
    type: String, 
    enum: ['rating', 'feature', 'event', 'other'], 
    default: 'other' 
  },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  options: [{
    name: { type: String, required: true },
    ticker: { type: String },
    meme: { type: mongoose.Schema.Types.ObjectId, ref: 'Meme' },
    imageUrl: { type: String },
    votes: { type: Number, default: 0 }
  }],
  
  // 投票记录
  voters: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    optionIndex: { type: Number },
    votedAt: { type: Date, default: Date.now }
  }],
  
  status: { 
    type: String, 
    enum: ['active', 'ended', 'cancelled'], 
    default: 'active' 
  },
  
  rewards: { type: String, default: '' }, // 奖励描述
  rewardAmount: { type: Number, default: 0 }, // 铜钱奖励
  
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date, required: true },
  
  totalVotes: { type: Number, default: 0 }
}, { timestamps: true });

// 检查投票是否已结束
pollSchema.methods.checkAndUpdateStatus = async function() {
  if (this.status === 'active' && new Date() > this.endTime) {
    this.status = 'ended';
    await this.save();
  }
  return this.status;
};

export const Poll = mongoose.model('Poll', pollSchema);

