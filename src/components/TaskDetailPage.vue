<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Users, Trophy, Clock, CheckCircle, Upload, MessageSquare, Shield } from 'lucide-vue-next'
import GlassCard from './GlassCard.vue'
import NeonButton from './NeonButton.vue'
import ReputationBadge from './ReputationBadge.vue'
import CountdownTimer from './CountdownTimer.vue'
import PaymentModal from './PaymentModal.vue'
import { mockTasks } from '@/lib/mockData'

const props = defineProps<{ id: string }>()
const router = useRouter()

const activeTab = ref<'description' | 'participants' | 'proof' | 'chat'>('description')
const showPaymentModal = ref(false)
const hasJoined = ref(false)
const showSuccess = ref(false)

const task = computed(() => mockTasks.find(t => t.id === props.id) || mockTasks[0])

function handleJoinTask() {
  if (task.value.entryFee > 0) {
    showPaymentModal.value = true
  } else {
    handlePaymentSuccess()
  }
}

function handlePaymentSuccess() {
  showPaymentModal.value = false
  hasJoined.value = true
  showSuccess.value = true
  setTimeout(() => (showSuccess.value = false), 3000)
}

const mockParticipants = [
  { name: 'CryptoMentor', avatar: '🧙', reputation: 92, joinedAt: '2 days ago' },
  { name: 'BlackHorse_Beta', avatar: '🐴', reputation: 76, joinedAt: '1 day ago' },
  { name: 'DeFiBuilder', avatar: '💎', reputation: 95, joinedAt: '5 hours ago' },
]

const mockProofs = [
  { user: 'CryptoMentor', avatar: '🧙', content: 'Completed module 1-5, certificate attached', verified: true, time: '1 hour ago' },
  { user: 'BlackHorse_Beta', avatar: '🐴', content: 'Finished all videos and quizzes', verified: false, time: '3 hours ago' },
]

const mockChat = [
  { user: 'CryptoMentor', avatar: '🧙', message: 'Great task! Looking forward to completing this.', time: '2 days ago' },
  { user: 'DeFiBuilder', avatar: '💎', message: 'Anyone want to study together?', time: '1 day ago' },
]

const tabs = [
  { id: 'description', label: 'Description' },
  { id: 'participants', label: 'Participants' },
  { id: 'proof', label: 'Proofs' },
  { id: 'chat', label: 'Chat' },
]
</script>

<template>
  <div class="min-h-screen p-6 max-w-7xl mx-auto">
    <button @click="router.push('/tasks')" class="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
      <ArrowLeft class="w-5 h-5" />
      Back to Tasks
    </button>

    <div v-if="showSuccess" class="mb-6 glass p-4 rounded-lg border-2 border-[#00FF9D] animate-slide-in-top">
      <div class="flex items-center gap-3">
        <CheckCircle class="w-6 h-6 text-[#00FF9D]" />
        <div>
          <div class="text-[#00FF9D]">Successfully Joined!</div>
          <div class="text-sm text-muted-foreground">You can now start working on this task</div>
        </div>
      </div>
    </div>

    <div class="grid lg:grid-cols-3 gap-8">
      <!-- Main Content -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Task Header -->
        <GlassCard>
          <div class="flex items-start justify-between mb-4">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-4">
                <span :class="[
                  'px-3 py-1 rounded-full text-sm',
                  task.category === 'Interest' ? 'bg-[#00D1FF]/20 text-[#00D1FF]' :
                  task.category === 'Emotional' ? 'bg-[#7C3AED]/20 text-[#7C3AED]' :
                  'bg-[#00FF9D]/20 text-[#00FF9D]',
                ]">
                  {{ task.category }}
                </span>
                <span v-if="hasJoined" class="px-3 py-1 bg-[#00FF9D]/20 text-[#00FF9D] rounded-full text-sm flex items-center gap-1">
                  <CheckCircle class="w-4 h-4" />
                  Joined
                </span>
              </div>
              <h1 class="text-3xl mb-4">{{ task.title }}</h1>
            </div>
          </div>

          <div class="flex items-center gap-4 mb-6 pb-6 border-b border-white/10">
            <div class="flex items-center gap-3">
              <span class="text-3xl">{{ task.creator.avatar }}</span>
              <div>
                <div class="text-sm text-muted-foreground">Created by</div>
                <div>{{ task.creator.name }}</div>
                <ReputationBadge :score="task.creator.reputation" size="sm" />
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div class="text-sm text-muted-foreground mb-1">Reward</div>
              <div class="flex items-center gap-1">
                <Trophy class="w-5 h-5 text-[#FFA500]" />
                <span class="text-xl text-[#FFA500]">{{ task.reward }} DHC</span>
              </div>
            </div>
            <div>
              <div class="text-sm text-muted-foreground mb-1">Entry Fee</div>
              <div class="text-xl text-[#00D1FF]">{{ task.entryFee }} USDC</div>
            </div>
            <div>
              <div class="text-sm text-muted-foreground mb-1">Participants</div>
              <div class="flex items-center gap-1">
                <Users class="w-5 h-5" />
                <span class="text-xl">{{ task.participants }}/{{ task.maxParticipants }}</span>
              </div>
            </div>
            <div>
              <div class="text-sm text-muted-foreground mb-1">Time Left</div>
              <div class="flex items-center gap-1">
                <Clock class="w-5 h-5" />
                <CountdownTimer :end-time="task.deadline" />
              </div>
            </div>
          </div>
        </GlassCard>

        <!-- Tabs -->
        <div class="glass rounded-xl overflow-hidden">
          <div class="flex border-b border-white/10">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              @click="activeTab = tab.id as any"
              :class="[
                'flex-1 px-6 py-4 transition-colors',
                activeTab === tab.id
                  ? 'bg-[#00D1FF]/10 text-[#00D1FF] border-b-2 border-[#00D1FF]'
                  : 'text-muted-foreground hover:text-foreground',
              ]"
            >
              {{ tab.label }}
            </button>
          </div>

          <div class="p-6">
            <!-- Description Tab -->
            <div v-if="activeTab === 'description'" class="space-y-4">
              <div>
                <h3 class="mb-3">Task Description</h3>
                <p class="text-muted-foreground leading-relaxed">{{ task.description }}</p>
              </div>

              <div v-if="task.isGameTask && task.gameUrl" class="p-6 bg-gradient-to-br from-[#00D1FF]/20 to-[#7C3AED]/20 border-2 border-[#00D1FF]/40 rounded-lg">
                <div class="flex items-start gap-4">
                  <div class="text-5xl">🎮</div>
                  <div class="flex-1">
                    <h4 class="text-xl mb-2">Play the Game!</h4>
                    <p class="text-sm text-muted-foreground mb-4">
                      Launch the interactive Web3 University game. Navigate the campus, collect knowledge tokens, and complete challenges to earn your reward!
                    </p>
                    <NeonButton @click="window.open(task.gameUrl, '_blank')">
                      🚀 Launch Game
                    </NeonButton>
                  </div>
                </div>
              </div>

              <div v-if="!task.isGameTask" class="p-4 bg-[#00D1FF]/10 border border-[#00D1FF]/30 rounded-lg">
                <div class="flex items-start gap-3">
                  <Shield class="w-5 h-5 text-[#00D1FF] mt-0.5" />
                  <div class="text-sm">
                    <div class="text-[#00D1FF] mb-1">Proof Required</div>
                    <div class="text-muted-foreground">
                      You'll need to submit proof of completion (photo, link, or document) to claim your reward.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Participants Tab -->
            <div v-if="activeTab === 'participants'" class="space-y-4">
              <div v-for="(participant, i) in mockParticipants" :key="i" class="flex items-center gap-4 p-4 glass rounded-lg">
                <span class="text-3xl">{{ participant.avatar }}</span>
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <span>{{ participant.name }}</span>
                    <ReputationBadge :score="participant.reputation" size="sm" />
                  </div>
                  <div class="text-sm text-muted-foreground">Joined {{ participant.joinedAt }}</div>
                </div>
              </div>
            </div>

            <!-- Proof Tab -->
            <div v-if="activeTab === 'proof'" class="space-y-4">
              <div v-if="hasJoined" class="p-4 glass rounded-lg border-2 border-dashed border-white/20">
                <div class="text-center">
                  <Upload class="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                  <p class="text-sm text-muted-foreground mb-3">Submit your proof of completion</p>
                  <NeonButton size="sm">Upload Proof</NeonButton>
                </div>
              </div>
              <div v-for="(proof, i) in mockProofs" :key="i" class="p-4 glass rounded-lg">
                <div class="flex items-start gap-3 mb-3">
                  <span class="text-2xl">{{ proof.avatar }}</span>
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                      <span>{{ proof.user }}</span>
                      <span v-if="proof.verified" class="px-2 py-0.5 bg-[#00FF9D]/20 text-[#00FF9D] rounded text-xs flex items-center gap-1">
                        <CheckCircle class="w-3 h-3" />
                        Verified
                      </span>
                    </div>
                    <p class="text-sm text-muted-foreground">{{ proof.content }}</p>
                    <div class="text-xs text-muted-foreground mt-2">{{ proof.time }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Chat Tab -->
            <div v-if="activeTab === 'chat'" class="space-y-4">
              <div v-for="(msg, i) in mockChat" :key="i" class="flex items-start gap-3">
                <span class="text-2xl">{{ msg.avatar }}</span>
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="text-sm">{{ msg.user }}</span>
                    <span class="text-xs text-muted-foreground">{{ msg.time }}</span>
                  </div>
                  <p class="text-sm text-muted-foreground">{{ msg.message }}</p>
                </div>
              </div>
              <div class="pt-4 flex gap-3">
                <input
                  type="text"
                  placeholder="Type a message..."
                  class="flex-1 bg-input-background border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#00D1FF]"
                />
                <NeonButton size="sm">
                  <MessageSquare class="w-4 h-4" />
                </NeonButton>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sidebar -->
      <div class="lg:col-span-1">
        <div class="sticky top-6 space-y-6">
          <GlassCard v-if="!hasJoined">
            <h3 class="mb-4">Join This Task</h3>
            <div class="space-y-4">
              <div class="p-4 glass rounded-lg">
                <div class="text-sm text-muted-foreground mb-2">You'll Get</div>
                <div class="flex items-center gap-2 text-xl text-[#FFA500]">
                  <Trophy class="w-6 h-6" />
                  {{ task.reward }} DHC
                </div>
              </div>
              <NeonButton @click="handleJoinTask" class="w-full" size="lg">
                {{ task.entryFee > 0 ? `Join & Pay ${task.entryFee} USDC` : 'Join Task' }}
              </NeonButton>
            </div>
          </GlassCard>

          <GlassCard v-else>
            <h3 class="mb-4">Your Progress</h3>
            <div class="space-y-4">
              <div class="p-4 bg-[#00FF9D]/10 border border-[#00FF9D]/30 rounded-lg">
                <div class="flex items-center gap-2 text-[#00FF9D] mb-2">
                  <CheckCircle class="w-5 h-5" />
                  <span>Task Joined!</span>
                </div>
                <p class="text-sm text-muted-foreground">Upload your proof when ready to claim rewards</p>
              </div>
              <NeonButton variant="secondary" class="w-full">
                <Upload class="w-4 h-4 mr-2" />
                Submit Proof
              </NeonButton>
            </div>
          </GlassCard>

          <GlassCard>
            <h3 class="mb-4">Task Stats</h3>
            <div class="space-y-3 text-sm">
              <div class="flex justify-between">
                <span class="text-muted-foreground">Total Pool</span>
                <span>{{ task.reward * task.maxParticipants }} DHC</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">Completion Rate</span>
                <span class="text-[#00FF9D]">78%</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">Avg. Completion Time</span>
                <span>2.5 weeks</span>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>

    <PaymentModal
      :is-open="showPaymentModal"
      :amount="task.entryFee"
      currency="USDC"
      :purpose="`Join task: ${task.title}`"
      @close="showPaymentModal = false"
      @confirm="handlePaymentSuccess"
    />
  </div>
</template>
