<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Filter, Plus, TrendingUp, Clock, Users as UsersIcon } from 'lucide-vue-next'
import GlassCard from './GlassCard.vue'
import NeonButton from './NeonButton.vue'
import TaskCard from './TaskCard.vue'
import { mockTasks } from '@/lib/mockData'

const router = useRouter()

const searchQuery = ref('')
const selectedCategory = ref('All')
const sortBy = ref('hot')

const categories = ['All', 'Interest', 'Emotional', 'Academic-Industry']

const filteredTasks = computed(() =>
  mockTasks.filter(task => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesCategory = selectedCategory.value === 'All' || task.category === selectedCategory.value
    return matchesSearch && matchesCategory
  })
)

const sortedTasks = computed(() =>
  [...filteredTasks.value].sort((a, b) => {
    if (sortBy.value === 'hot') return b.participants - a.participants
    if (sortBy.value === 'new') return b.id.localeCompare(a.id)
    return a.deadline.getTime() - b.deadline.getTime()
  })
)

function clearFilters() {
  searchQuery.value = ''
  selectedCategory.value = 'All'
}
</script>

<template>
  <div class="min-h-screen p-6 max-w-7xl mx-auto">
    <!-- Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
      <div>
        <h1 class="text-3xl mb-2">Explore Tasks</h1>
        <p class="text-muted-foreground">Join challenges and earn DHC rewards</p>
      </div>
      <NeonButton @click="router.push('/tasks/create')">
        <span class="flex items-center gap-2">
          <Plus class="w-5 h-5" />
          Create Task
        </span>
      </NeonButton>
    </div>

    <!-- Search & Filters -->
    <div class="mb-8 space-y-4">
      <div class="relative">
        <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search tasks..."
          class="w-full pl-12 pr-4 py-3 bg-input-background border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D1FF]"
        />
      </div>

      <div class="flex flex-wrap gap-3 items-center">
        <div class="flex items-center gap-2">
          <Filter class="w-5 h-5 text-muted-foreground" />
          <span class="text-sm text-muted-foreground">Category:</span>
        </div>
        <button
          v-for="cat in categories"
          :key="cat"
          @click="selectedCategory = cat"
          :class="[
            'px-4 py-2 rounded-lg border transition-all',
            selectedCategory === cat
              ? 'border-[#00D1FF] bg-[#00D1FF]/10 text-[#00D1FF]'
              : 'border-white/10 hover:border-white/30',
          ]"
        >
          {{ cat }}
        </button>

        <div class="ml-auto flex gap-2">
          <button
            @click="sortBy = 'hot'"
            :class="[
              'px-4 py-2 rounded-lg border transition-all flex items-center gap-2',
              sortBy === 'hot'
                ? 'border-[#00D1FF] bg-[#00D1FF]/10 text-[#00D1FF]'
                : 'border-white/10 hover:border-white/30',
            ]"
          >
            <TrendingUp class="w-4 h-4" />
            Hot
          </button>
          <button
            @click="sortBy = 'new'"
            :class="[
              'px-4 py-2 rounded-lg border transition-all flex items-center gap-2',
              sortBy === 'new'
                ? 'border-[#00D1FF] bg-[#00D1FF]/10 text-[#00D1FF]'
                : 'border-white/10 hover:border-white/30',
            ]"
          >
            <Clock class="w-4 h-4" />
            New
          </button>
          <button
            @click="sortBy = 'ending'"
            :class="[
              'px-4 py-2 rounded-lg border transition-all flex items-center gap-2',
              sortBy === 'ending'
                ? 'border-[#00D1FF] bg-[#00D1FF]/10 text-[#00D1FF]'
                : 'border-white/10 hover:border-white/30',
            ]"
          >
            <Clock class="w-4 h-4" />
            Ending Soon
          </button>
        </div>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      <GlassCard>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-[#00D1FF]/20 rounded-lg flex items-center justify-center">
            <UsersIcon class="w-5 h-5 text-[#00D1FF]" />
          </div>
          <div>
            <div class="text-2xl">{{ filteredTasks.length }}</div>
            <div class="text-sm text-muted-foreground">Active Tasks</div>
          </div>
        </div>
      </GlassCard>
      <GlassCard>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-[#7C3AED]/20 rounded-lg flex items-center justify-center">
            <TrendingUp class="w-5 h-5 text-[#7C3AED]" />
          </div>
          <div>
            <div class="text-2xl">{{ filteredTasks.reduce((sum, t) => sum + t.participants, 0) }}</div>
            <div class="text-sm text-muted-foreground">Total Participants</div>
          </div>
        </div>
      </GlassCard>
      <GlassCard>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-[#FFA500]/20 rounded-lg flex items-center justify-center">
            <span class="text-[#FFA500]">💰</span>
          </div>
          <div>
            <div class="text-2xl">{{ filteredTasks.reduce((sum, t) => sum + t.reward, 0).toLocaleString() }}</div>
            <div class="text-sm text-muted-foreground">DHC in Rewards</div>
          </div>
        </div>
      </GlassCard>
    </div>

    <!-- Task Grid -->
    <div v-if="sortedTasks.length > 0" class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      <TaskCard
        v-for="task in sortedTasks"
        :key="task.id"
        :task="task"
        @click="router.push(`/tasks/${task.id}`)"
      />
    </div>
    <GlassCard v-else>
      <div class="text-center py-12 text-muted-foreground">
        <Search class="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No tasks found matching your criteria</p>
        <button @click="clearFilters" class="mt-4 text-[#00D1FF] hover:text-[#00B8E6]">
          Clear filters
        </button>
      </div>
    </GlassCard>
  </div>
</template>
