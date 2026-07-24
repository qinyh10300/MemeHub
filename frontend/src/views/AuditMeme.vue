<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

// 待审核、已审核列表
const pendingList = ref([])      // 待审核
const finishedList = ref([])     // 已审核

// 待审核模因详细信息映射 {id: {title, ticker, ...}}
const pendingMemeDetails = ref({})

// 当前选中的模因
const current = ref(null)
const loading = ref(false);
const error = ref(null);

// 人工审核意见
const manualComment = ref('')

// AI 审核反馈
const aiResult = ref(null)
const decisionLabelMap = {
  approve: 'Recommend Approve',
  reject: 'Recommend Reject',
  manual_review: 'Recommend Manual Review'
}

// 是否正在请求
const loadingAI = ref(false)
const submitting = ref(false)

// 模拟后端接口 —— 改成你自己的 API
async function fetchLists() {
  try {
    const { data } = await axios.get(`${authStore.server_ip}/api/review/pending-meme-list`, {
      headers: {
        token: authStore.token
      }
    })
    pendingList.value = data.memeIds || []
    finishedList.value = data.finished || []

    // 获取待审核模因的详细信息
    await fetchPendingMemeDetails()
  } catch (err) {
    console.error('获取审核列表失败:', err)
  }
}

// 获取待审核模因的详细信息
async function fetchPendingMemeDetails() {
  if (pendingList.value.length === 0) return

  try {
    // 使用批量接口获取模因详情
    const { data } = await axios.post(`${authStore.server_ip}/api/meme/list`, {
      memeIds: pendingList.value
    })

    // 构建详细信息映射
    const detailsMap = {}
    if (data.memes) {
      data.memes.forEach(meme => {
        if (meme._id) {
          detailsMap[meme._id] = {
            title: meme.title || 'Untitled Meme',
            ticker: meme.ticker || 'N/A',
            author: meme.author?.username || 'Unknown',
            likes: meme.likes || 0,
            createdAt: meme.createdAt
          }
        }
      })
    }

    pendingMemeDetails.value = detailsMap
  } catch (error) {
    console.error('获取待审核模因详情失败:', error)
  }
}

// 选中某个模因
function selectMeme(meme) {
  const details = pendingMemeDetails.value[meme]
  current.value = {
    memeId: meme,
    name: details?.title || "none",
    ticker: details?.ticker || "N/A",
    creator: details?.author || "Unknown",
    image: '',
    desc: '',
  }
  aiResult.value = null
  manualComment.value = ''
}

watch(
  () => current.value?.memeId,
  (newVal) => {
    if (newVal) fetchMemeDetails(newVal);
  }
)

const fetchMemeDetails = async (memeId) => {
  loading.value = true;
  error.value = null;

  try {
    // 并发请求
    const { data } = await axios.get(`${authStore.server_ip}/api/meme/${memeId}`, {
      headers: {
        token: authStore.token
      }
    });

    current.value = {
      memeId: data._id,
      name: data.title,
      ticker: data.ticker || 'N/A',
      creator: data.author?.username || "Unknown",
      time: new Date(data.createdAt).toLocaleString(),
      mc: data.likes,
      mcPercent: Math.min(data.likes * 10, 100),
      image: data.imageUrl ? `${authStore.server_ip}${data.imageUrl}` : '', // 修正图片路径
      desc: data.description,
    };

  } catch (err) {
    error.value = "Failed to load project data.";
  } finally {
    loading.value = false;
  }
};

// AI 审核
async function runAI() {
  if (!current.value) return
  loadingAI.value = true
  aiResult.value = null
  try {
    const { data } = await axios.post(
      `${authStore.server_ip}/api/review/meme/${current.value.memeId}/ai`,
      {},
      {
        headers: {
          token: authStore.token
        }
      }
    )
    aiResult.value = {
      decision: data.result?.decision || 'manual_review',
      riskScore: data.result?.riskScore ?? null,
      summary: data.result?.summary || data.raw || 'AI did not return a summary',
      reasons: Array.isArray(data.result?.reasons) ? data.result.reasons : [],
      raw: data.raw
    }
  } catch (error) {
    console.error('AI review failed:', error)
    alert(error.response?.data?.message || 'AI review failed. Please try again later.')
  } finally {
    loadingAI.value = false
  }
}

// 提交人工审核结果
async function submitAudit(result) {
  // if (result === 'reject' && !manualComment.value.trim()) {
  //   alert("拒绝时请填写人工审核意见。")
  //   return
  // }
  if (!manualComment.value.trim()) {
     // 为了保险，通过时也要求填写一下，或者根据需求放开
     // 这里原逻辑是都要求填
    alert("Please enter a manual review note before submitting.")
     return
  }

  submitting.value = true
  try {
    // 转换 result 为后端需要的 action
    const action = result === 'pass' ? 'approve' : 'reject';

    await axios.post(`${authStore.server_ip}/api/review/meme/${current.value.memeId}`,
      {
        action: action,
        description: manualComment.value, // 后端使用 description 字段
      },
      {
        headers: {
          token: authStore.token
        }
      }
    )
    alert("Submitted successfully!")

    // 刷新列表
    await fetchLists()
    current.value = null
  } catch (error) {
    console.error('提交审核失败:', error);
    alert(error.response?.data?.message || "Submission failed. Please try again.");
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchLists()
})
</script>

<template>
  <div class="audit-container">
    <!-- 左侧列表 -->
    <div class="left-panel">
      <h2>Pending Review</h2>
      <div class="list">
        <div
          v-for="m in pendingList"
          :key="m"
          class="list-item"
          :class="{ active: current?.memeId === m }"
          @click="selectMeme(m)"
        >
          <div class="meme-info">
            <div class="meme-title">{{ pendingMemeDetails[m]?.title || 'Loading...' }}</div>
            <div class="meme-meta">
              {{ pendingMemeDetails[m]?.author || 'Unknown' }} •
              {{ pendingMemeDetails[m]?.ticker || 'N/A' }}
            </div>
          </div>
          <span class="badge pending">Pending</span>
        </div>
      </div>

      <!-- <h2 style="margin-top: 25px;">已审核</h2>
      <div class="list">
        <div
          v-for="m in finishedList"
          :key="m"
          class="list-item"
        >
          <span>{{ m.value.name }}</span>
          <span class="badge finished">已审核</span>
        </div>
      </div> -->
    </div>

    <!-- 右侧详情 -->
    <div class="right-panel">
      <div v-if="!current" class="placeholder">
        Select a meme from the left list to review
      </div>

      <div v-else class="detail-box">
        <h2>{{ current?.name }}</h2>

        <div class="meta">
          <p><strong>Ticker:</strong>{{ current?.ticker }}</p>
          <p><strong>Description:</strong>{{ current?.desc }}</p>
        </div>

        <img :src="current?.image" class="meme-image" />

        <!-- AI Review -->
        <div class="section">
          <h3>AI Review</h3>

          <button
            @click="runAI"
            :disabled="loadingAI || !current"
            class="btn ai-btn"
          >
            {{ loadingAI ? 'AI is analyzing...' : 'Run AI Review' }}
          </button>

          <div v-if="aiResult" class="ai-box">
            <h4>AI Feedback:</h4>
            <div class="ai-summary">
              <p><strong>Decision:</strong>{{ decisionLabelMap[aiResult.decision] || aiResult.decision }}</p>
              <p v-if="aiResult.riskScore !== null"><strong>Risk Score:</strong>{{ (aiResult.riskScore * 100).toFixed(1) }}%</p>
              <p><strong>Summary:</strong>{{ aiResult.summary }}</p>
              <div v-if="aiResult.reasons.length" class="ai-reasons">
                <strong>Reasons:</strong>
                <ul>
                  <li v-for="reason in aiResult.reasons" :key="reason">{{ reason }}</li>
                </ul>
              </div>
            </div>
            <details class="ai-raw">
              <summary>View Raw Response</summary>
              <pre>{{ aiResult.raw }}</pre>
            </details>
          </div>
        </div>

        <!-- Manual Review -->
        <div class="section">
          <h3>Manual Review Notes</h3>

          <textarea
            v-model="manualComment"
            class="comment-box"
            placeholder="Enter manual review notes..."
          />

          <div class="btn-row">
            <button
              class="btn pass"
              @click="submitAudit('pass')"
              :disabled="submitting"
            >
              Approve
            </button>

            <button
              class="btn reject"
              @click="submitAudit('reject')"
              :disabled="submitting"
            >
              Reject
            </button>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.audit-container {
  width: 100%;
  height: 100vh;
  display: flex;
  color: #fff;
  background: #000000;
  padding: 0;
}

/* 左侧列表 */
.left-panel {
  width: 320px;
  background: #0d0d0d;
  border-right: 1px solid #2a2a2a;
  padding: 30px 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.left-panel h2 {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 20px;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 8px;
}

.left-panel h2::before {
  content: "📋";
  font-size: 18px;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.list-item {
  background: #1a1a1a;
  padding: 16px;
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  position: relative;
}

.list-item:hover {
  background: #242424;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.list-item.active {
  background: linear-gradient(135deg, #1a2f1f, #1f3b2b);
  border-color: #65c281;
  box-shadow: 0 4px 16px rgba(101, 194, 129, 0.2);
}

.meme-info {
  flex: 1;
  margin-right: 12px;
  min-width: 0;
}

.meme-title {
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

.meme-meta {
  font-size: 13px;
  color: #aaa;
  display: flex;
  align-items: center;
  gap: 6px;
}

.meme-meta::before {
  content: "•";
  color: #666;
}

.badge {
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.pending {
  background: linear-gradient(135deg, #65c281, #4fad6e);
  color: #000;
  box-shadow: 0 2px 8px rgba(101, 194, 129, 0.3);
}

.finished {
  background: #444;
  color: #ccc;
}

/* 右侧内容 */
.right-panel {
  flex: 1;
  padding: 40px;
  overflow-y: auto;
  background: #000000;
}

.placeholder {
  margin-top: 120px;
  text-align: center;
  font-size: 18px;
  color: #888;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.placeholder::before {
  content: "📝";
  font-size: 48px;
  opacity: 0.5;
}

.detail-box {
  max-width: 800px;
  margin: 0 auto;
}

.detail-box h2 {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 16px;
  color: #fff;
  line-height: 1.2;
}

.meta {
  background: #1a1a1a;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 24px;
  border: 1px solid #2a2a2a;
}

.meta p {
  margin: 8px 0;
  font-size: 15px;
  color: #ccc;
  display: flex;
  align-items: center;
  gap: 8px;
}

.meta strong {
  color: #65c281;
  font-weight: 600;
  min-width: 80px;
}

.meme-image {
  margin-top: 24px;
  width: 100%;
  max-width: 400px;
  border-radius: 16px;
  border: 2px solid #2a2a2a;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  transition: transform 0.3s ease;
}

.meme-image:hover {
  transform: scale(1.02);
}

/* 各个模块 */
.section {
  margin-top: 40px;
  background: #1a1a1a;
  padding: 24px;
  border-radius: 16px;
  border: 1px solid #2a2a2a;
}

.section h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section:nth-of-type(1) h3::before {
  content: "🤖";
}

.section:nth-of-type(2) h3::before {
  content: "✏️";
}

.ai-box {
  background: #0f0f0f;
  padding: 20px;
  border-radius: 12px;
  margin-top: 16px;
  border: 1px solid #2a2a2a;
  position: relative;
}

.ai-box h4 {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #65c281;
}

.ai-result {
  white-space: pre-wrap;
  color: #ccc;
  font-size: 14px;
  line-height: 1.6;
  font-family: 'Consolas', 'Monaco', monospace;
  background: #000;
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid #65c281;
}

.ai-summary p {
  margin: 4px 0;
}

.ai-reasons ul {
  margin: 8px 0 0;
  padding-left: 18px;
  color: #bbb;
  font-size: 13px;
}

.ai-raw {
  margin-top: 12px;
  font-size: 12px;
  color: #888;
}

.ai-raw pre {
  margin-top: 8px;
  background: rgba(255, 255, 255, 0.03);
  padding: 12px;
  border-radius: 8px;
  white-space: pre-wrap;
}

/* 按钮与输入框 */
.comment-box {
  width: 100%;
  min-height: 120px;
  margin-top: 16px;
  padding: 16px;
  border-radius: 12px;
  background: #0f0f0f;
  border: 2px solid #2a2a2a;
  color: white;
  resize: vertical;
  font-size: 14px;
  font-family: inherit;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.comment-box:focus {
  outline: none;
  border-color: #65c281;
  box-shadow: 0 0 0 3px rgba(101, 194, 129, 0.1);
}

.comment-box::placeholder {
  color: #666;
}

.btn-row {
  display: flex;
  gap: 16px;
  margin-top: 20px;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  font-size: 15px;
  transition: all 0.3s ease;
  flex: 1;
  position: relative;
  overflow: hidden;
}

.btn::before {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.btn:hover::before {
  left: 100%;
}

.ai-btn {
  background: linear-gradient(135deg, #2e66ff, #1e4fd8);
  color: white;
  box-shadow: 0 4px 12px rgba(46, 102, 255, 0.3);
}

.ai-btn:hover {
  background: linear-gradient(135deg, #1e4fd8, #163fb8);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(46, 102, 255, 0.4);
}

.pass {
  background: linear-gradient(135deg, #65c281, #4fad6e);
  color: #000;
  box-shadow: 0 4px 12px rgba(101, 194, 129, 0.3);
}

.pass:hover {
  background: linear-gradient(135deg, #4fad6e, #3fa05f);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(101, 194, 129, 0.4);
}

.reject {
  background: linear-gradient(135deg, #ff6b6b, #d64545);
  color: white;
  box-shadow: 0 4px 12px rgba(214, 69, 69, 0.3);
}

.reject:hover {
  background: linear-gradient(135deg, #d64545, #b83a3a);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(214, 69, 69, 0.4);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.btn:disabled::before {
  display: none;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .audit-container {
    flex-direction: column;
    height: auto;
  }

  .left-panel {
    width: 100%;
    max-height: 300px;
    border-right: none;
    border-bottom: 1px solid #2a2a2a;
  }

  .right-panel {
    padding: 20px;
  }

  .btn-row {
    flex-direction: column;
  }
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #0f0f0f;
}

::-webkit-scrollbar-thumb {
  background: #2a2a2a;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #3a3a3a;
}
</style>
