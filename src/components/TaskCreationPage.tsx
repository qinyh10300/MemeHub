import React, { useState } from 'react';
import { ArrowLeft, Plus, ImageIcon } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { NeonButton } from './NeonButton';
import { TaskCard } from './TaskCard';

interface TaskCreationPageProps {
  onBack: () => void;
  onSubmit: (taskData: any) => void;
}

export function TaskCreationPage({ onBack, onSubmit }: TaskCreationPageProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    reward: 100,
    entryFee: 5,
    category: 'Interest' as 'Interest' | 'Emotional' | 'Academic-Industry',
    maxParticipants: 20,
    deadline: '',
    proofRequired: true
  });

  const previewTask = {
    id: 'preview',
    ...formData,
    participants: 0,
    deadline: formData.deadline ? new Date(formData.deadline) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    creator: {
      name: 'You',
      avatar: '👤',
      reputation: 85
    },
    status: 'active' as const
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="min-h-screen p-6 max-w-7xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Back
      </button>

      <div className="mb-8">
        <h1 className="text-3xl mb-2">Create a New Task</h1>
        <p className="text-muted-foreground">Define your challenge and set rewards for participants</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            <GlassCard>
              <h3 className="text-xl mb-4">Task Details</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-2">Task Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Complete Web3 Development Course"
                    className="w-full bg-input-background border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00D1FF]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2">Description *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe what participants need to do..."
                    rows={4}
                    className="w-full bg-input-background border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00D1FF] resize-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2">Category *</label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['Interest', 'Emotional', 'Academic-Industry'] as const).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setFormData({ ...formData, category: cat })}
                        className={`px-4 py-3 rounded-lg border transition-all ${
                          formData.category === cat
                            ? 'border-[#00D1FF] bg-[#00D1FF]/10 text-[#00D1FF]'
                            : 'border-white/10 hover:border-white/30'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </GlassCard>

            <GlassCard>
              <h3 className="text-xl mb-4">Rewards & Requirements</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-2">Reward Amount (DHC) *</label>
                  <input
                    type="number"
                    value={formData.reward}
                    onChange={(e) => setFormData({ ...formData, reward: parseInt(e.target.value) })}
                    min="1"
                    className="w-full bg-input-background border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00D1FF]"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">Total DHC reward pool for completing this task</p>
                </div>

                <div>
                  <label className="block text-sm mb-2">Entry Fee (USDC) *</label>
                  <input
                    type="number"
                    value={formData.entryFee}
                    onChange={(e) => setFormData({ ...formData, entryFee: parseInt(e.target.value) })}
                    min="0"
                    className="w-full bg-input-background border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00D1FF]"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">Optional entry fee (triggers x402 payment)</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-2">Max Participants</label>
                    <input
                      type="number"
                      value={formData.maxParticipants}
                      onChange={(e) => setFormData({ ...formData, maxParticipants: parseInt(e.target.value) })}
                      min="1"
                      max="1000"
                      className="w-full bg-input-background border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00D1FF]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm mb-2">Deadline</label>
                    <input
                      type="date"
                      value={formData.deadline}
                      onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full bg-input-background border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00D1FF]"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="proofRequired"
                    checked={formData.proofRequired}
                    onChange={(e) => setFormData({ ...formData, proofRequired: e.target.checked })}
                    className="w-5 h-5 rounded border-white/10"
                  />
                  <label htmlFor="proofRequired" className="text-sm">
                    Require proof submission (photo/link/document)
                  </label>
                </div>
              </div>
            </GlassCard>

            <div className="flex gap-4">
              <NeonButton type="submit" size="lg" className="flex-1">
                <span className="flex items-center gap-2 justify-center">
                  <Plus className="w-5 h-5" />
                  Publish Task
                </span>
              </NeonButton>
              <NeonButton type="button" variant="outline" size="lg" onClick={onBack}>
                Cancel
              </NeonButton>
            </div>
          </form>
        </div>

        {/* Preview */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <h3 className="text-xl mb-4">Preview</h3>
            <p className="text-sm text-muted-foreground mb-4">This is how your task will appear</p>
            <TaskCard task={previewTask} onClick={() => {}} />
          </div>
        </div>
      </div>
    </div>
  );
}