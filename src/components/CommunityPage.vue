<script setup>
import { ref } from 'vue'
import { Heart, MessageCircle, Share2, Users, Trophy, TrendingUp } from 'lucide-vue-next'
import GlassCard from './GlassCard.vue'
import NeonButton from './NeonButton.vue'
import ReputationBadge from './ReputationBadge.vue'
import { mockCommunityPosts, mockUser } from '@/lib/mockData'

const newPost = ref('')

function handlePost() {
  console.log('New post:', newPost.value)
  newPost.value = ''
}

const leaderboard = [
  { rank: 1, name: 'DeFiBuilder', avatar: '💎', reputation: 95, tasksCompleted: 67 },
  { rank: 2, name: 'CryptoMentor', avatar: '🧙', reputation: 92, tasksCompleted: 58 },
  { rank: 3, name: 'MindfulSoul', avatar: '🧘', reputation: 88, tasksCompleted: 52 },
  { rank: 4, name: 'BlackHorse_Alpha', avatar: '👤', reputation: 85, tasksCompleted: 47 },
  { rank: 5, name: 'BlackHorse_Beta', avatar: '🐴', reputation: 76, tasksCompleted: 39 },
]

const trendingTopics = [
  { tag: '#Web3Development', posts: 245 },
  { tag: '#Meditation', posts: 178 },
  { tag: '#DeFi', posts: 156 },
  { tag: '#NFT', posts: 134 },
  { tag: '#Bitcoin100k', posts: 98 },
]

function hoursAgo(timestamp) {
  return Math.floor((Date.now() - timestamp.getTime()) / (1000 * 60 * 60))
}

function rankClass(rank) {
  if (rank === 1) return 'bg-[#FFA500]/20 text-[#FFA500]'
  if (rank === 2) return 'bg-[#C0C0C0]/20 text-[#C0C0C0]'
  if (rank === 3) return 'bg-[#CD7F32]/20 text-[#CD7F32]'
  return 'bg-muted/50 text-muted-foreground'
}
</script>

<template>
  <div class="min-h-screen p-6 max-w-7xl mx-auto">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl mb-2">Community</h1>
      <p class="text-muted-foreground">Connect, share, and grow with the Black Horse Guild</p>
    </div>

    <div class="grid lg:grid-cols-3 gap-8">
      <!-- Main Feed -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Create Post -->
        <GlassCard>
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 bg-gradient-to-br from-[#00D1FF] to-[#7C3AED] rounded-full flex items-center justify-center text-2xl flex-shrink-0">
              {{ mockUser.avatar }}
            </div>
            <div class="flex-1">
              <textarea
                v-model="newPost"
                placeholder="Share your thoughts, progress, or wins..."
                rows="3"
                class="w-full bg-input-background border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00D1FF] resize-none mb-3"
              />
              <div class="flex justify-between items-center">
                <div class="text-sm text-muted-foreground">
                  <span v-if="newPost.length > 0">{{ newPost.length }} characters</span>
                </div>
                <NeonButton @click="handlePost" :disabled="!newPost.trim()" size="sm">
                  Post
                </NeonButton>
              </div>
            </div>
          </div>
        </GlassCard>

        <!-- Feed Posts -->
        <GlassCard v-for="post in mockCommunityPosts" :key="post.id">
          <div class="flex items-start gap-4">
            <span class="text-3xl">{{ post.author.avatar }}</span>
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2">
                <span>{{ post.author.name }}</span>
                <ReputationBadge :score="post.author.reputation" size="sm" />
                <span class="text-sm text-muted-foreground">• {{ hoursAgo(post.timestamp) }}h ago</span>
              </div>
              <p class="mb-4">{{ post.content }}</p>

              <div class="flex items-center gap-6 text-sm text-muted-foreground">
                <button class="flex items-center gap-2 hover:text-[#FF6B6B] transition-colors">
                  <Heart class="w-4 h-4" />
                  <span>{{ post.likes }}</span>
                </button>
                <button class="flex items-center gap-2 hover:text-[#00D1FF] transition-colors">
                  <MessageCircle class="w-4 h-4" />
                  <span>{{ post.comments }}</span>
                </button>
                <button class="flex items-center gap-2 hover:text-[#00FF9D] transition-colors">
                  <Share2 class="w-4 h-4" />
                  <span>Share</span>
                </button>
              </div>
            </div>
          </div>
        </GlassCard>

        <!-- Load More -->
        <div class="text-center">
          <NeonButton variant="outline">Load More Posts</NeonButton>
        </div>
      </div>

      <!-- Sidebar -->
      <div class="lg:col-span-1 space-y-6">
        <!-- Leaderboard -->
        <GlassCard>
          <div class="flex items-center gap-2 mb-4">
            <Trophy class="w-5 h-5 text-[#FFA500]" />
            <h3>Leaderboard</h3>
          </div>
          <div class="space-y-3">
            <div
              v-for="user in leaderboard"
              :key="user.rank"
              class="flex items-center gap-3 p-3 glass rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            >
              <div :class="['w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0', rankClass(user.rank)]">
                {{ user.rank }}
              </div>
              <span class="text-2xl">{{ user.avatar }}</span>
              <div class="flex-1 min-w-0">
                <div class="truncate">{{ user.name }}</div>
                <div class="flex items-center gap-2">
                  <ReputationBadge :score="user.reputation" size="sm" />
                  <span class="text-xs text-muted-foreground">{{ user.tasksCompleted }} tasks</span>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

        <!-- Trending Topics -->
        <GlassCard>
          <div class="flex items-center gap-2 mb-4">
            <TrendingUp class="w-5 h-5 text-[#00D1FF]" />
            <h3>Trending Topics</h3>
          </div>
          <div class="space-y-3">
            <button
              v-for="(topic, i) in trendingTopics"
              :key="i"
              class="w-full flex items-center justify-between p-3 glass rounded-lg hover:bg-white/5 transition-colors text-left"
            >
              <span class="text-[#00D1FF]">{{ topic.tag }}</span>
              <span class="text-sm text-muted-foreground">{{ topic.posts }} posts</span>
            </button>
          </div>
        </GlassCard>

        <!-- Community Stats -->
        <GlassCard>
          <div class="flex items-center gap-2 mb-4">
            <Users class="w-5 h-5 text-[#7C3AED]" />
            <h3>Community Stats</h3>
          </div>
          <div class="space-y-3">
            <div class="flex justify-between">
              <span class="text-muted-foreground">Total Members</span>
              <span>8,547</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Active Today</span>
              <span class="text-[#00FF9D]">1,234</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Posts This Week</span>
              <span>3,456</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Tasks Shared</span>
              <span>892</span>
            </div>
          </div>
        </GlassCard>

        <!-- Join Discord CTA -->
        <GlassCard class="text-center bg-gradient-to-br from-[#7C3AED]/20 to-[#00D1FF]/20">
          <div class="text-4xl mb-3">💬</div>
          <h3 class="mb-2">Join our Discord</h3>
          <p class="text-sm text-muted-foreground mb-4">Connect with the community in real-time</p>
          <NeonButton variant="secondary" class="w-full">Join Discord</NeonButton>
        </GlassCard>
      </div>
    </div>
  </div>
</template>
