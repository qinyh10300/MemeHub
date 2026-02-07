import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, Users, Trophy, TrendingUp } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { NeonButton } from './NeonButton';
import { ReputationBadge } from './ReputationBadge';
import { mockCommunityPosts, mockUser } from '../lib/mockData';

export function CommunityPage() {
  const [newPost, setNewPost] = useState('');

  const handlePost = () => {
    // In a real app, this would send the post to the backend
    console.log('New post:', newPost);
    setNewPost('');
  };

  const leaderboard = [
    { rank: 1, name: 'DeFiBuilder', avatar: '💎', reputation: 95, tasksCompleted: 67 },
    { rank: 2, name: 'CryptoMentor', avatar: '🧙', reputation: 92, tasksCompleted: 58 },
    { rank: 3, name: 'MindfulSoul', avatar: '🧘', reputation: 88, tasksCompleted: 52 },
    { rank: 4, name: 'BlackHorse_Alpha', avatar: '👤', reputation: 85, tasksCompleted: 47 },
    { rank: 5, name: 'BlackHorse_Beta', avatar: '🐴', reputation: 76, tasksCompleted: 39 }
  ];

  const trendingTopics = [
    { tag: '#Web3Development', posts: 245 },
    { tag: '#Meditation', posts: 178 },
    { tag: '#DeFi', posts: 156 },
    { tag: '#NFT', posts: 134 },
    { tag: '#Bitcoin100k', posts: 98 }
  ];

  return (
    <div className="min-h-screen p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl mb-2">Community</h1>
        <p className="text-muted-foreground">Connect, share, and grow with the Black Horse Guild</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-6">
          {/* Create Post */}
          <GlassCard>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#00D1FF] to-[#7C3AED] rounded-full flex items-center justify-center text-2xl flex-shrink-0">
                {mockUser.avatar}
              </div>
              <div className="flex-1">
                <textarea
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  placeholder="Share your thoughts, progress, or wins..."
                  rows={3}
                  className="w-full bg-input-background border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00D1FF] resize-none mb-3"
                />
                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    {newPost.length > 0 && `${newPost.length} characters`}
                  </div>
                  <NeonButton
                    onClick={handlePost}
                    disabled={!newPost.trim()}
                    size="sm"
                  >
                    Post
                  </NeonButton>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Feed Posts */}
          {mockCommunityPosts.map(post => (
            <GlassCard key={post.id}>
              <div className="flex items-start gap-4">
                <span className="text-3xl">{post.author.avatar}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span>{post.author.name}</span>
                    <ReputationBadge score={post.author.reputation} size="sm" />
                    <span className="text-sm text-muted-foreground">
                      • {Math.floor((Date.now() - post.timestamp.getTime()) / (1000 * 60 * 60))}h ago
                    </span>
                  </div>
                  <p className="mb-4">{post.content}</p>
                  
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <button className="flex items-center gap-2 hover:text-[#FF6B6B] transition-colors">
                      <Heart className="w-4 h-4" />
                      <span>{post.likes}</span>
                    </button>
                    <button className="flex items-center gap-2 hover:text-[#00D1FF] transition-colors">
                      <MessageCircle className="w-4 h-4" />
                      <span>{post.comments}</span>
                    </button>
                    <button className="flex items-center gap-2 hover:text-[#00FF9D] transition-colors">
                      <Share2 className="w-4 h-4" />
                      <span>Share</span>
                    </button>
                  </div>
                </div>
              </div>
            </GlassCard>
          ))}

          {/* Load More */}
          <div className="text-center">
            <NeonButton variant="outline">
              Load More Posts
            </NeonButton>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Leaderboard */}
          <GlassCard>
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-[#FFA500]" />
              <h3>Leaderboard</h3>
            </div>
            <div className="space-y-3">
              {leaderboard.map((user) => (
                <div key={user.rank} className="flex items-center gap-3 p-3 glass rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
                  <div className={`
                    w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0
                    ${user.rank === 1 ? 'bg-[#FFA500]/20 text-[#FFA500]' :
                      user.rank === 2 ? 'bg-[#C0C0C0]/20 text-[#C0C0C0]' :
                      user.rank === 3 ? 'bg-[#CD7F32]/20 text-[#CD7F32]' :
                      'bg-muted/50 text-muted-foreground'
                    }
                  `}>
                    {user.rank}
                  </div>
                  <span className="text-2xl">{user.avatar}</span>
                  <div className="flex-1 min-w-0">
                    <div className="truncate">{user.name}</div>
                    <div className="flex items-center gap-2">
                      <ReputationBadge score={user.reputation} size="sm" />
                      <span className="text-xs text-muted-foreground">{user.tasksCompleted} tasks</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Trending Topics */}
          <GlassCard>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-[#00D1FF]" />
              <h3>Trending Topics</h3>
            </div>
            <div className="space-y-3">
              {trendingTopics.map((topic, i) => (
                <button
                  key={i}
                  className="w-full flex items-center justify-between p-3 glass rounded-lg hover:bg-white/5 transition-colors text-left"
                >
                  <span className="text-[#00D1FF]">{topic.tag}</span>
                  <span className="text-sm text-muted-foreground">{topic.posts} posts</span>
                </button>
              ))}
            </div>
          </GlassCard>

          {/* Community Stats */}
          <GlassCard>
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-[#7C3AED]" />
              <h3>Community Stats</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Members</span>
                <span>8,547</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Active Today</span>
                <span className="text-[#00FF9D]">1,234</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Posts This Week</span>
                <span>3,456</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tasks Shared</span>
                <span>892</span>
              </div>
            </div>
          </GlassCard>

          {/* Join Discord CTA */}
          <GlassCard className="text-center bg-gradient-to-br from-[#7C3AED]/20 to-[#00D1FF]/20">
            <div className="text-4xl mb-3">💬</div>
            <h3 className="mb-2">Join our Discord</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Connect with the community in real-time
            </p>
            <NeonButton variant="secondary" className="w-full">
              Join Discord
            </NeonButton>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
