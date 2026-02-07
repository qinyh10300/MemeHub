import React, { useState } from 'react';
import { Search, Filter, Plus, TrendingUp, Clock, Users as UsersIcon } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { NeonButton } from './NeonButton';
import { TaskCard } from './TaskCard';
import { mockTasks } from '../lib/mockData';

interface TaskFeedPageProps {
  onCreateTask: () => void;
  onTaskClick: (taskId: string) => void;
}

export function TaskFeedPage({ onCreateTask, onTaskClick }: TaskFeedPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'hot' | 'new' | 'ending'>('hot');

  const categories = ['All', 'Interest', 'Emotional', 'Academic-Industry'];

  const filteredTasks = mockTasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || task.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'hot') return b.participants - a.participants;
    if (sortBy === 'new') return b.id.localeCompare(a.id);
    return a.deadline.getTime() - b.deadline.getTime();
  });

  return (
    <div className="min-h-screen p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl mb-2">Explore Tasks</h1>
          <p className="text-muted-foreground">Join challenges and earn DHC rewards</p>
        </div>
        <NeonButton onClick={onCreateTask}>
          <span className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create Task
          </span>
        </NeonButton>
      </div>

      {/* Search & Filters */}
      <div className="mb-8 space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            className="w-full pl-12 pr-4 py-3 bg-input-background border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D1FF]"
          />
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Category:</span>
          </div>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg border transition-all ${
                selectedCategory === cat
                  ? 'border-[#00D1FF] bg-[#00D1FF]/10 text-[#00D1FF]'
                  : 'border-white/10 hover:border-white/30'
              }`}
            >
              {cat}
            </button>
          ))}

          <div className="ml-auto flex gap-2">
            <button
              onClick={() => setSortBy('hot')}
              className={`px-4 py-2 rounded-lg border transition-all flex items-center gap-2 ${
                sortBy === 'hot'
                  ? 'border-[#00D1FF] bg-[#00D1FF]/10 text-[#00D1FF]'
                  : 'border-white/10 hover:border-white/30'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Hot
            </button>
            <button
              onClick={() => setSortBy('new')}
              className={`px-4 py-2 rounded-lg border transition-all flex items-center gap-2 ${
                sortBy === 'new'
                  ? 'border-[#00D1FF] bg-[#00D1FF]/10 text-[#00D1FF]'
                  : 'border-white/10 hover:border-white/30'
              }`}
            >
              <Clock className="w-4 h-4" />
              New
            </button>
            <button
              onClick={() => setSortBy('ending')}
              className={`px-4 py-2 rounded-lg border transition-all flex items-center gap-2 ${
                sortBy === 'ending'
                  ? 'border-[#00D1FF] bg-[#00D1FF]/10 text-[#00D1FF]'
                  : 'border-white/10 hover:border-white/30'
              }`}
            >
              <Clock className="w-4 h-4" />
              Ending Soon
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#00D1FF]/20 rounded-lg flex items-center justify-center">
              <UsersIcon className="w-5 h-5 text-[#00D1FF]" />
            </div>
            <div>
              <div className="text-2xl">{filteredTasks.length}</div>
              <div className="text-sm text-muted-foreground">Active Tasks</div>
            </div>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#7C3AED]/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#7C3AED]" />
            </div>
            <div>
              <div className="text-2xl">{filteredTasks.reduce((sum, t) => sum + t.participants, 0)}</div>
              <div className="text-sm text-muted-foreground">Total Participants</div>
            </div>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FFA500]/20 rounded-lg flex items-center justify-center">
              <span className="text-[#FFA500]">💰</span>
            </div>
            <div>
              <div className="text-2xl">{filteredTasks.reduce((sum, t) => sum + t.reward, 0).toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">DHC in Rewards</div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Task Grid */}
      {sortedTasks.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task.id)}
            />
          ))}
        </div>
      ) : (
        <GlassCard>
          <div className="text-center py-12 text-muted-foreground">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No tasks found matching your criteria</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
              className="mt-4 text-[#00D1FF] hover:text-[#00B8E6]"
            >
              Clear filters
            </button>
          </div>
        </GlassCard>
      )}
    </div>
  );
}