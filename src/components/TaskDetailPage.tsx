import React, { useState } from 'react';
import { ArrowLeft, Users, Trophy, Clock, CheckCircle, Upload, MessageSquare, Shield } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { NeonButton } from './NeonButton';
import { ReputationBadge } from './ReputationBadge';
import { CountdownTimer } from './CountdownTimer';
import { PaymentModal } from './PaymentModal';
import { mockTasks } from '../lib/mockData';

interface TaskDetailPageProps {
  taskId: string;
  onBack: () => void;
}

export function TaskDetailPage({ taskId, onBack }: TaskDetailPageProps) {
  const [activeTab, setActiveTab] = useState<'description' | 'participants' | 'proof' | 'chat'>('description');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const task = mockTasks.find(t => t.id === taskId) || mockTasks[0];

  const handleJoinTask = () => {
    if (task.entryFee > 0) {
      setShowPaymentModal(true);
    } else {
      handlePaymentSuccess();
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    setHasJoined(true);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const mockParticipants = [
    { name: 'CryptoMentor', avatar: '🧙', reputation: 92, joinedAt: '2 days ago' },
    { name: 'BlackHorse_Beta', avatar: '🐴', reputation: 76, joinedAt: '1 day ago' },
    { name: 'DeFiBuilder', avatar: '💎', reputation: 95, joinedAt: '5 hours ago' },
  ];

  const mockProofs = [
    { user: 'CryptoMentor', avatar: '🧙', content: 'Completed module 1-5, certificate attached', verified: true, time: '1 hour ago' },
    { user: 'BlackHorse_Beta', avatar: '🐴', content: 'Finished all videos and quizzes', verified: false, time: '3 hours ago' },
  ];

  const mockChat = [
    { user: 'CryptoMentor', avatar: '🧙', message: 'Great task! Looking forward to completing this.', time: '2 days ago' },
    { user: 'DeFiBuilder', avatar: '💎', message: 'Anyone want to study together?', time: '1 day ago' },
  ];

  return (
    <div className="min-h-screen p-6 max-w-7xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Tasks
      </button>

      {showSuccess && (
        <div className="mb-6 glass p-4 rounded-lg border-2 border-[#00FF9D] animate-in slide-in-from-top">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-[#00FF9D]" />
            <div>
              <div className="text-[#00FF9D]">Successfully Joined!</div>
              <div className="text-sm text-muted-foreground">You can now start working on this task</div>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Task Header */}
          <GlassCard>
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    task.category === 'Interest' ? 'bg-[#00D1FF]/20 text-[#00D1FF]' :
                    task.category === 'Emotional' ? 'bg-[#7C3AED]/20 text-[#7C3AED]' :
                    'bg-[#00FF9D]/20 text-[#00FF9D]'
                  }`}>
                    {task.category}
                  </span>
                  {hasJoined && (
                    <span className="px-3 py-1 bg-[#00FF9D]/20 text-[#00FF9D] rounded-full text-sm flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      Joined
                    </span>
                  )}
                </div>
                <h1 className="text-3xl mb-4">{task.title}</h1>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{task.creator.avatar}</span>
                <div>
                  <div className="text-sm text-muted-foreground">Created by</div>
                  <div>{task.creator.name}</div>
                  <ReputationBadge score={task.creator.reputation} size="sm" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Reward</div>
                <div className="flex items-center gap-1">
                  <Trophy className="w-5 h-5 text-[#FFA500]" />
                  <span className="text-xl text-[#FFA500]">{task.reward} DHC</span>
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Entry Fee</div>
                <div className="text-xl text-[#00D1FF]">{task.entryFee} USDC</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Participants</div>
                <div className="flex items-center gap-1">
                  <Users className="w-5 h-5" />
                  <span className="text-xl">{task.participants}/{task.maxParticipants}</span>
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Time Left</div>
                <div className="flex items-center gap-1">
                  <Clock className="w-5 h-5" />
                  <CountdownTimer endTime={task.deadline} />
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Tabs */}
          <div className="glass rounded-xl overflow-hidden">
            <div className="flex border-b border-white/10">
              {[
                { id: 'description', label: 'Description' },
                { id: 'participants', label: 'Participants' },
                { id: 'proof', label: 'Proofs' },
                { id: 'chat', label: 'Chat' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 px-6 py-4 transition-colors ${
                    activeTab === tab.id
                      ? 'bg-[#00D1FF]/10 text-[#00D1FF] border-b-2 border-[#00D1FF]'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-6">
              {activeTab === 'description' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="mb-3">Task Description</h3>
                    <p className="text-muted-foreground leading-relaxed">{task.description}</p>
                  </div>
                  
                  {task.isGameTask && task.gameUrl && (
                    <div className="p-6 bg-gradient-to-br from-[#00D1FF]/20 to-[#7C3AED]/20 border-2 border-[#00D1FF]/40 rounded-lg">
                      <div className="flex items-start gap-4">
                        <div className="text-5xl">🎮</div>
                        <div className="flex-1">
                          <h4 className="text-xl mb-2">Play the Game!</h4>
                          <p className="text-sm text-muted-foreground mb-4">
                            Launch the interactive Web3 University game. Navigate the campus, collect knowledge tokens, and complete challenges to earn your reward!
                          </p>
                          <NeonButton
                            onClick={() => window.open(task.gameUrl, '_blank')}
                            variant="primary"
                          >
                            🚀 Launch Game
                          </NeonButton>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {!task.isGameTask && (
                    <div className="p-4 bg-[#00D1FF]/10 border border-[#00D1FF]/30 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 text-[#00D1FF] mt-0.5" />
                        <div className="text-sm">
                          <div className="text-[#00D1FF] mb-1">Proof Required</div>
                          <div className="text-muted-foreground">
                            You'll need to submit proof of completion (photo, link, or document) to claim your reward.
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'participants' && (
                <div className="space-y-4">
                  {mockParticipants.map((participant, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 glass rounded-lg">
                      <span className="text-3xl">{participant.avatar}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span>{participant.name}</span>
                          <ReputationBadge score={participant.reputation} size="sm" />
                        </div>
                        <div className="text-sm text-muted-foreground">Joined {participant.joinedAt}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'proof' && (
                <div className="space-y-4">
                  {hasJoined && (
                    <div className="p-4 glass rounded-lg border-2 border-dashed border-white/20">
                      <div className="text-center">
                        <Upload className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mb-3">Submit your proof of completion</p>
                        <NeonButton size="sm">
                          Upload Proof
                        </NeonButton>
                      </div>
                    </div>
                  )}
                  {mockProofs.map((proof, i) => (
                    <div key={i} className="p-4 glass rounded-lg">
                      <div className="flex items-start gap-3 mb-3">
                        <span className="text-2xl">{proof.avatar}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span>{proof.user}</span>
                            {proof.verified && (
                              <span className="px-2 py-0.5 bg-[#00FF9D]/20 text-[#00FF9D] rounded text-xs flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Verified
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{proof.content}</p>
                          <div className="text-xs text-muted-foreground mt-2">{proof.time}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'chat' && (
                <div className="space-y-4">
                  {mockChat.map((msg, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="text-2xl">{msg.avatar}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm">{msg.user}</span>
                          <span className="text-xs text-muted-foreground">{msg.time}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{msg.message}</p>
                      </div>
                    </div>
                  ))}
                  <div className="pt-4 flex gap-3">
                    <input
                      type="text"
                      placeholder="Type a message..."
                      className="flex-1 bg-input-background border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#00D1FF]"
                    />
                    <NeonButton size="sm">
                      <MessageSquare className="w-4 h-4" />
                    </NeonButton>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-6">
            {!hasJoined ? (
              <GlassCard>
                <h3 className="mb-4">Join This Task</h3>
                <div className="space-y-4">
                  <div className="p-4 glass rounded-lg">
                    <div className="text-sm text-muted-foreground mb-2">You'll Get</div>
                    <div className="flex items-center gap-2 text-xl text-[#FFA500]">
                      <Trophy className="w-6 h-6" />
                      {task.reward} DHC
                    </div>
                  </div>
                  <NeonButton onClick={handleJoinTask} className="w-full" size="lg">
                    {task.entryFee > 0 ? `Join & Pay ${task.entryFee} USDC` : 'Join Task'}
                  </NeonButton>
                </div>
              </GlassCard>
            ) : (
              <GlassCard>
                <h3 className="mb-4">Your Progress</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-[#00FF9D]/10 border border-[#00FF9D]/30 rounded-lg">
                    <div className="flex items-center gap-2 text-[#00FF9D] mb-2">
                      <CheckCircle className="w-5 h-5" />
                      <span>Task Joined!</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Upload your proof when ready to claim rewards</p>
                  </div>
                  <NeonButton variant="secondary" className="w-full">
                    <Upload className="w-4 h-4 mr-2" />
                    Submit Proof
                  </NeonButton>
                </div>
              </GlassCard>
            )}

            <GlassCard>
              <h3 className="mb-4">Task Stats</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Pool</span>
                  <span>{task.reward * task.maxParticipants} DHC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Completion Rate</span>
                  <span className="text-[#00FF9D]">78%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg. Completion Time</span>
                  <span>2.5 weeks</span>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onConfirm={handlePaymentSuccess}
        amount={task.entryFee}
        currency="USDC"
        purpose={`Join task: ${task.title}`}
      />
    </div>
  );
}