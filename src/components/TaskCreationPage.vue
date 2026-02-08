<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Plus } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import GlassCard from './GlassCard.vue'
import NeonButton from './NeonButton.vue'
import TaskCard from './TaskCard.vue'

const router = useRouter()

const formData = ref({
  title: '',
  description: '',
  reward: 100,
  entryFee: 5,
  category: 'Interest',
  maxParticipants: 20,
  deadline: '',
  proofRequired: true,
})

const previewTask = computed(() => ({
  id: 'preview',
  ...formData.value,
  participants: 0,
  deadline: formData.value.deadline
    ? new Date(formData.value.deadline)
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  creator: { name: 'You', avatar: '👤', reputation: 85 },
  status: 'active',
}))

const todayStr = new Date().toISOString().split('T')[0]

function handleSubmit() {
  toast.success('Task created successfully!', {
    description: 'Your task is now live and visible to the community',
  })
  router.push('/tasks')
}
</script>

<template>
  <div class="min-h-screen p-6 max-w-7xl mx-auto">
    <button
      @click="router.push('/tasks')"
      class="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
    >
      <ArrowLeft class="w-5 h-5" />
      Back
    </button>

    <div class="mb-8">
      <h1 class="text-3xl mb-2">Create a New Task</h1>
      <p class="text-muted-foreground">Define your challenge and set rewards for participants</p>
    </div>

    <div class="grid lg:grid-cols-3 gap-8">
      <!-- Form -->
      <div class="lg:col-span-2">
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <GlassCard>
            <h3 class="text-xl mb-4">Task Details</h3>
            <div class="space-y-4">
              <div>
                <label class="block text-sm mb-2">Task Title *</label>
                <input
                  v-model="formData.title"
                  type="text"
                  placeholder="e.g., Complete Web3 Development Course"
                  class="w-full bg-input-background border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00D1FF]"
                  required
                />
              </div>

              <div>
                <label class="block text-sm mb-2">Description *</label>
                <textarea
                  v-model="formData.description"
                  placeholder="Describe what participants need to do..."
                  rows="4"
                  class="w-full bg-input-background border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00D1FF] resize-none"
                  required
                />
              </div>

              <div>
                <label class="block text-sm mb-2">Category *</label>
                <div class="grid grid-cols-3 gap-3">
                  <button
                    v-for="cat in ['Interest', 'Emotional', 'Academic-Industry']"
                    :key="cat"
                    type="button"
                    @click="formData.category = cat"
                    :class="[
                      'px-4 py-3 rounded-lg border transition-all',
                      formData.category === cat
                        ? 'border-[#00D1FF] bg-[#00D1FF]/10 text-[#00D1FF]'
                        : 'border-white/10 hover:border-white/30',
                    ]"
                  >
                    {{ cat }}
                  </button>
                </div>
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <h3 class="text-xl mb-4">Rewards &amp; Requirements</h3>
            <div class="space-y-4">
              <div>
                <label class="block text-sm mb-2">Reward Amount (DHC) *</label>
                <input
                  v-model.number="formData.reward"
                  type="number"
                  min="1"
                  class="w-full bg-input-background border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00D1FF]"
                  required
                />
                <p class="text-xs text-muted-foreground mt-1">Total DHC reward pool for completing this task</p>
              </div>

              <div>
                <label class="block text-sm mb-2">Entry Fee (USDC) *</label>
                <input
                  v-model.number="formData.entryFee"
                  type="number"
                  min="0"
                  class="w-full bg-input-background border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00D1FF]"
                  required
                />
                <p class="text-xs text-muted-foreground mt-1">Optional entry fee (triggers x402 payment)</p>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm mb-2">Max Participants</label>
                  <input
                    v-model.number="formData.maxParticipants"
                    type="number"
                    min="1"
                    max="1000"
                    class="w-full bg-input-background border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00D1FF]"
                  />
                </div>
                <div>
                  <label class="block text-sm mb-2">Deadline</label>
                  <input
                    v-model="formData.deadline"
                    type="date"
                    :min="todayStr"
                    class="w-full bg-input-background border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00D1FF]"
                  />
                </div>
              </div>

              <div class="flex items-center gap-3">
                <input
                  v-model="formData.proofRequired"
                  type="checkbox"
                  id="proofRequired"
                  class="w-5 h-5 rounded border-white/10"
                />
                <label for="proofRequired" class="text-sm">
                  Require proof submission (photo/link/document)
                </label>
              </div>
            </div>
          </GlassCard>

          <div class="flex gap-4">
            <NeonButton type="submit" size="lg" class="flex-1">
              <span class="flex items-center gap-2 justify-center">
                <Plus class="w-5 h-5" />
                Publish Task
              </span>
            </NeonButton>
            <NeonButton type="button" variant="outline" size="lg" @click="router.push('/tasks')">
              Cancel
            </NeonButton>
          </div>
        </form>
      </div>

      <!-- Preview -->
      <div class="lg:col-span-1">
        <div class="sticky top-6">
          <h3 class="text-xl mb-4">Preview</h3>
          <p class="text-sm text-muted-foreground mb-4">This is how your task will appear</p>
          <TaskCard :task="previewTask" @click="() => {}" />
        </div>
      </div>
    </div>
  </div>
</template>
