<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import axios from 'axios'
const server_ip = 'http://localhost:3000'
// 待审核、已审核列表
const pendingList = ref([])      // 待审核
const finishedList = ref([])     // 已审核

// 当前选中的模因
const current = ref(null)
const loading = ref(false);
const error = ref(null);

// 人工审核意见
const manualComment = ref('')

// AI 审核反馈
const aiResult = ref(null)

// 是否正在请求
const loadingAI = ref(false)
const submitting = ref(false)

// 模拟后端接口 —— 改成你自己的 API
async function fetchLists() {
  const { data } = await axios.get(`${server_ip}/api/review/pending-meme-list`)
//   pendingList.value = data.pending || []
  pendingList.value = data.memeIds || []
  finishedList.value = data.finished || []
// 测试用
  if (pendingList.value.length === 0)
    pendingList.value = ["691e88308f7d46e75bef82b0","691e88f18f7d46e75bef82d3"]
//   console.log("待审核列表:", pendingList.value)
//   console.log("已审核列表:", finishedList.value)
}

// 选中某个模因
function selectMeme(meme) {
  current.value = {
    memeId: meme,
    name: "none",
    ticker: "N/A",
    creator: "未知",
    image: '',
    desc: '',
  }
//   console.log("选中模因:", current.value.name)
//   console.log("选中模因:", meme)
  aiResult.value = null
  manualComment.value = ''
}

watch(
  () => current.value?.memeId,
  (newVal) => {
      fetchMemeDetails(newVal);
  }
)

const fetchMemeDetails = async (memeId) => {
  loading.value = true;
  error.value = null;

  try {
    // console.log("🟦 二次请求 memeIds:", memeId);

    // 并发请求
    const { data } = await axios.get(`http://localhost:3000/api/meme/${memeId}`);

    current.value = {
      memeId: data._id,
      name: data.title,
      ticker: data.ticker || 'N/A',
      creator: data.author?.username || "未知",
      time: new Date(data.createdAt).toLocaleString(),
      mc: data.likes,
      mcPercent: Math.min(data.likes * 10, 100),
      image: data.imageUrl ? `http://localhost:3000/${data.imageUrl.replace(/^\/+/, '')}` : '',
      desc: data.description,
    };

    // console.log("🟩 二次请求详情结果:", current.value);

  } catch (err) {
    // console.error("❌ 二次请求失败:", err);
    error.value = "Failed to load project data.";
  } finally {
    loading.value = false;
  }
};

// AI 审核
async function runAI() {
  if (!current.value) return
  loadingAI.value = true
  try {
    const { data } = await axios.post('/api/meme/ai-audit', {
      meme_id: current.value.id
    })
    aiResult.value = data
  } finally {
    loadingAI.value = false
  }
}

// 提交人工审核结果
async function submitAudit(result) {
  if (!manualComment.value.trim()) {
    alert("请填写人工审核意见后再提交。")
    return
  }
  submitting.value = true
  try {
    await axios.post('/api/meme/manual-audit', {
      meme_id: current.value.id,
      comment: manualComment.value,
      result, // "pass" / "reject"
    })
    alert("提交成功！")

    // 刷新列表
    await fetchLists()
    current.value = null
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
      <h2>待审核</h2>
      <div class="list">
        <div 
          v-for="m in pendingList" 
          :key="m" 
          class="list-item"
          :class="{ active: current?.memeId === m }"
          @click="selectMeme(m)"
        >
          <span>{{ m }}</span>
          <!-- <span>{{ console.log(current) }}</span> -->
          <span class="badge pending">待审核</span>
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
        请选择左侧列表中的模因进行审核
      </div>

      <div v-else class="detail-box">
        <h2>{{ current?.name }}</h2>

        <div class="meta">
          <p><strong>代号：</strong>{{ current?.ticker }}</p>
          <p><strong>描述：</strong>{{ current?.desc }}</p>
        </div>

        <img :src="current?.image" class="meme-image" />

        <!-- AI 审核 -->
        <div class="section">
          <h3>AI 审核</h3>

          <button 
            @click="runAI" 
            :disabled="loadingAI"
            class="btn ai-btn"
          >
            {{ loadingAI ? 'AI 正在分析...' : '运行 AI 审核' }}
          </button>

          <div v-if="aiResult" class="ai-box">
            <h4>AI 反馈：</h4>
            <pre class="ai-result">{{ aiResult }}</pre>
          </div>
        </div>

        <!-- 人工审核 -->
        <div class="section">
          <h3>人工审核意见</h3>

          <textarea 
            v-model="manualComment" 
            class="comment-box" 
            placeholder="请输入人工审核意见..."
          />

          <div class="btn-row">
            <button 
              class="btn pass"
              @click="submitAudit('pass')"
              :disabled="submitting"
            >
              审核通过
            </button>

            <button 
              class="btn reject"
              @click="submitAudit('reject')"
              :disabled="submitting"
            >
              审核不通过
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
  height: 100%;
  display: flex;
  color: #fff;
  padding: 20px 30px;
}

/* 左侧列表 */
.left-panel {
  width: 260px;
  background: #0d0d0d;
  border-right: 1px solid #222;
  padding: 20px;
  overflow-y: auto;
}

.left-panel h2 {
  font-size: 18px;
  margin-bottom: 10px;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.list-item {
  background: #111;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  transition: 0.2s;
}

.list-item:hover {
  background: #1a1a1a;
}

.list-item.active {
  background: #1f3b2b;
  border: 1px solid #147b3f;
}

.badge {
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 12px;
}

.pending {
  background: #44b800;
}

.finished {
  background: #444;
}

/* 右侧内容 */
.right-panel {
  flex: 1;
  padding: 30px;
  overflow-y: auto;
}

.placeholder {
  margin-top: 100px;
  text-align: center;
  font-size: 18px;
  color: #888;
}

.detail-box h2 {
  margin-bottom: 10px;
}

.meta p {
  margin: 4px 0;
  font-size: 14px;
}

.meme-image {
  margin-top: 15px;
  width: 320px;
  border-radius: 10px;
  border: 1px solid #333;
}

/* 各个模块 */
.section {
  margin-top: 30px;
}

.ai-box {
  background: #111;
  padding: 15px;
  border-radius: 8px;
  margin-top: 12px;
  border: 1px solid #333;
}

.ai-result {
  white-space: pre-wrap;
  color: #ccc;
  font-size: 14px;
}

/* 按钮与输入框 */
.comment-box {
  width: 100%;
  height: 100px;
  margin-top: 10px;
  padding: 12px;
  border-radius: 8px;
  background: #0f0f0f;
  border: 1px solid #333;
  color: white;
  resize: none;
}

.btn-row {
  display: flex;
  gap: 15px;
  margin-top: 15px;
}

.btn {
  padding: 10px 18px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
}

.ai-btn {
  background: #2e66ff;
}

.pass {
  background: #1dbf5b;
}

.reject {
  background: #d64545;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
