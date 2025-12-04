<template>
  <div class="c2c-container">
    <!-- ========== 发起交易区域 ========== -->
    <h2 class="title">发起 C2C 交易</h2>

    <div class="form">
      <input v-model="targetUser" placeholder="对方用户名" />

      <div class="row">
        <input v-model="myToken" placeholder="我付出的币种，如 USDT 或 DOGE" />
        <input
          v-model.number="myAmount"
          type="number"
          placeholder="数量"
        />
      </div>
      <div class="token-suggestions">
        <span class="hint">常用币种：</span>
        <button
          v-for="token in commonTokens"
          :key="token.value"
          class="token-chip"
          type="button"
          @click="applyCommonToken('mine', token.value)"
        >
          {{ token.label }}
        </button>
      </div>

      <div class="row">
        <input v-model="theirToken" placeholder="对方付出的币种，如 USDT 或 CAT" />
        <input
          v-model.number="theirAmount"
          type="number"
          placeholder="数量"
        />
      </div>
      <div class="token-suggestions">
        <span class="hint">常用币种：</span>
        <button
          v-for="token in commonTokens"
          :key="`${token.value}-their`"
          class="token-chip"
          type="button"
          @click="applyCommonToken('theirs', token.value)"
        >
          {{ token.label }}
        </button>
      </div>

      <button class="submit-btn" @click="createTrade" :disabled="loading">
        {{ loading ? '发送中...' : '发起交易' }}
      </button>
    </div>

    <!-- ========== Tabs 切换 ========== -->
    <div class="tabs-wrapper">
      <div class="tabs-slider">
        <div 
          class="slider-indicator" 
          :style="{ transform: `translateX(${activeTab === 'outgoing' ? '0' : '100%'})` }"
        ></div>
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'outgoing' }"
          @click="activeTab = 'outgoing'"
        >
          我发起的
          <span v-if="outgoingTrades.length" class="badge">{{ outgoingTrades.length }}</span>
        </button>
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'incoming' }"
          @click="activeTab = 'incoming'"
        >
          我收到的
          <span v-if="pendingIncomingCount" class="badge pending">{{ pendingIncomingCount }}</span>
        </button>
      </div>
      <button class="refresh-btn" @click="refreshCurrentTab" :disabled="loading">
        <span class="refresh-icon">↻</span>
      </button>
    </div>

    <!-- ========== 我发起的交易 ========== -->
    <div v-show="activeTab === 'outgoing'" class="trade-list">
      <div v-if="outgoingTrades.length === 0" class="empty">
        暂无发起的交易
      </div>

      <div
        class="trade-card"
        v-for="trade in outgoingTrades"
        :key="trade.id"
      >
        <div class="trade-info">
          <p>
            <strong>对方:</strong> @{{ trade.to }}
          </p>
          <p>
            <strong>我付出:</strong> {{ trade.myToken }} ×
            {{ trade.myAmount }}
            <span v-if="trade.status === 'pending'" class="frozen-tip">（已冻结）</span>
          </p>
          <p>
            <strong>对方付出:</strong> {{ trade.theirToken }} ×
            {{ trade.theirAmount }}
          </p>
          <p>
            <strong>状态:</strong>
            <span :class="'status-' + trade.status">{{ statusText(trade.status) }}</span>
          </p>
          <div class="trade-times">
            <span class="time-item">
              <span class="time-label">发起:</span> {{ formatTime(trade.createdAt) }}
            </span>
            <span v-if="trade.status === 'accepted'" class="time-item">
              <span class="time-label">完成:</span> {{ formatTime(trade.completedAt || trade.updatedAt) }}
            </span>
            <span v-else-if="trade.status === 'rejected'" class="time-item">
              <span class="time-label">拒绝:</span> {{ formatTime(trade.updatedAt) }}
            </span>
            <span v-else-if="trade.status === 'cancelled'" class="time-item">
              <span class="time-label">取消:</span> {{ formatTime(trade.updatedAt) }}
            </span>
          </div>
        </div>
        <div class="actions" v-if="trade.status === 'pending'">
          <button class="btn cancel" @click="cancelTrade(trade.id)">取消</button>
        </div>
      </div>
    </div>

    <!-- ========== 我收到的交易 ========== -->
    <div v-show="activeTab === 'incoming'" class="trade-list">
      <div v-if="incomingTrades.length === 0" class="empty">
        暂无收到的交易
      </div>

      <div
        class="trade-card"
        v-for="trade in incomingTrades"
        :key="trade.id"
      >
        <div class="trade-info">
          <p>
            <strong>来自:</strong> @{{ trade.from }}
          </p>
          <p>
            <strong>对方付出:</strong> {{ trade.theirToken }} ×
            {{ trade.theirAmount }}
          </p>
          <p>
            <strong>我需付出:</strong> {{ trade.myToken }} ×
            {{ trade.myAmount }}
          </p>
          <p>
            <strong>状态:</strong>
            <span :class="'status-' + trade.status">{{ statusText(trade.status) }}</span>
          </p>
          <div class="trade-times">
            <span class="time-item">
              <span class="time-label">发起:</span> {{ formatTime(trade.createdAt) }}
            </span>
            <span v-if="trade.status === 'accepted'" class="time-item">
              <span class="time-label">完成:</span> {{ formatTime(trade.completedAt || trade.updatedAt) }}
            </span>
            <span v-else-if="trade.status === 'rejected'" class="time-item">
              <span class="time-label">拒绝:</span> {{ formatTime(trade.updatedAt) }}
            </span>
            <span v-else-if="trade.status === 'cancelled'" class="time-item">
              <span class="time-label">取消:</span> {{ formatTime(trade.updatedAt) }}
            </span>
          </div>
        </div>

        <div class="actions" v-if="trade.status === 'pending'">
          <button class="btn accept" @click="acceptTrade(trade.id)">
            接受
          </button>
          <button class="btn reject" @click="rejectTrade(trade.id)">
            拒绝
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from "vue";
import { useAuthStore } from "@/stores/auth";
import { emitTaskProgress } from '@/utils/gamificationEvents';

// 获取全局刷新提醒方法
const refreshAlerts = inject('refreshAlerts', () => {});

const authStore = useAuthStore();
const completedTradeIds = new Set();
const commonTokens = [
  { label: 'USDT', value: 'USDT' }
];

// 当前 Tab
const activeTab = ref('outgoing');

// 表单字段
const targetUser = ref("");
const myToken = ref("");
const myAmount = ref(null);
const theirToken = ref("");
const theirAmount = ref(null);

// 交易列表
const outgoingTrades = ref([]);
const incomingTrades = ref([]);

// 状态
const loading = ref(false);

// 待处理的收到交易数量
const pendingIncomingCount = computed(() => {
  return incomingTrades.value.filter(t => t.status === 'pending').length;
});

// 获取 token
function getToken() {
  return authStore.username || authStore.token;
}

// 状态文本
function statusText(status) {
  const map = {
    pending: '待确认',
    accepted: '已完成',
    rejected: '已拒绝',
    cancelled: '已取消'
  };
  return map[status] || status;
}

const markTradeCompleted = (tradeId) => {
  if (!tradeId || completedTradeIds.has(tradeId)) return;
  completedTradeIds.add(tradeId);
  emitTaskProgress('growth-trade', 1, { username: authStore.username || 'guest' });
};

const trackCompletedTrades = (trades = []) => {
  trades.forEach((trade) => {
    if (trade?.status === 'accepted') {
      markTradeCompleted(trade.id);
    }
  });
};

// 格式化时间
function formatTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  
  // 1分钟内
  if (diff < 60 * 1000) {
    return '刚刚';
  }
  // 1小时内
  if (diff < 60 * 60 * 1000) {
    return `${Math.floor(diff / 60000)} 分钟前`;
  }
  // 今天
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }
  // 昨天
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `昨天 ${date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
  }
  // 更早
  return date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// 获取服务器地址
function getServerUrl() {
  return authStore.serverIp || 'http://localhost:3000';
}

const applyCommonToken = (target, tokenValue) => {
  if (target === 'mine') {
    myToken.value = tokenValue;
  } else if (target === 'theirs') {
    theirToken.value = tokenValue;
  }
};

// 刷新当前 Tab
function refreshCurrentTab() {
  if (activeTab.value === 'outgoing') {
    fetchOutgoing();
  } else {
    fetchIncoming();
  }
}

// 发起交易
async function createTrade() {
  if (!targetUser.value) {
    return alert("请输入对方用户名");
  }
  if (!myToken.value || myAmount.value === null || myAmount.value < 0) {
    return alert("请输入您付出的币种和数量，且数量必须大于等于 0");
  }
  if (!theirToken.value || theirAmount.value === null || theirAmount.value < 0) {
    return alert("请输入对方付出的币种和数量，且数量必须大于等于 0");
  }
  
  loading.value = true;
  try {
    const res = await fetch(`${getServerUrl()}/api/c2c/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'token': getToken()
      },
      body: JSON.stringify({
        targetUsername: targetUser.value,
        myToken: myToken.value,
        myAmount: myAmount.value,
        theirToken: theirToken.value,
        theirAmount: theirAmount.value
      })
    });
    
    const data = await res.json();
    if (data.code === 0) {
      alert('交易已发起，等待对方确认');
      // 清空表单
      targetUser.value = "";
      myToken.value = "";
      myAmount.value = null;
      theirToken.value = "";
      theirAmount.value = null;
      // 刷新列表
      fetchOutgoing();
    } else {
      alert(data.message || '发起交易失败');
    }
  } catch (error) {
    console.error('Create trade error:', error);
    alert('网络错误，请稍后重试');
  } finally {
    loading.value = false;
  }
}

// 获取我发起的交易
async function fetchOutgoing() {
  try {
    const res = await fetch(`${getServerUrl()}/api/c2c/outgoing`, {
      headers: { 'token': getToken() }
    });
    const data = await res.json();
    if (data.code === 0) {
      outgoingTrades.value = data.data || [];
      trackCompletedTrades(outgoingTrades.value);
    }
  } catch (error) {
    console.error('Fetch outgoing trades error:', error);
  }
}

// 获取我收到的交易
async function fetchIncoming() {
  try {
    const res = await fetch(`${getServerUrl()}/api/c2c/incoming`, {
      headers: { 'token': getToken() }
    });
    const data = await res.json();
    if (data.code === 0) {
      incomingTrades.value = data.data || [];
      trackCompletedTrades(incomingTrades.value);
    }
  } catch (error) {
    console.error('Fetch incoming trades error:', error);
  }
}

// 接受交易
async function acceptTrade(id) {
  if (!confirm('确定接受这笔交易吗？')) return;
  
  try {
    const res = await fetch(`${getServerUrl()}/api/c2c/${id}/accept`, {
      method: 'POST',
      headers: { 'token': getToken() }
    });
    const data = await res.json();
    if (data.code === 0) {
      alert('交易已接受');
      markTradeCompleted(id);
      fetchIncoming();
      fetchOutgoing();
      refreshAlerts(); // 刷新侧边栏提醒
    } else {
      alert(data.message || '操作失败');
    }
  } catch (error) {
    console.error('Accept trade error:', error);
    alert('网络错误');
  }
}

// 拒绝交易
async function rejectTrade(id) {
  if (!confirm('确定拒绝这笔交易吗？')) return;
  
  try {
    const res = await fetch(`${getServerUrl()}/api/c2c/${id}/reject`, {
      method: 'POST',
      headers: { 'token': getToken() }
    });
    const data = await res.json();
    if (data.code === 0) {
      alert('交易已拒绝');
      fetchIncoming();
      refreshAlerts(); // 刷新侧边栏提醒
    } else {
      alert(data.message || '操作失败');
    }
  } catch (error) {
    console.error('Reject trade error:', error);
    alert('网络错误');
  }
}

// 取消交易
async function cancelTrade(id) {
  if (!confirm('确定取消这笔交易吗？')) return;
  
  try {
    const res = await fetch(`${getServerUrl()}/api/c2c/${id}/cancel`, {
      method: 'POST',
      headers: { 'token': getToken() }
    });
    const data = await res.json();
    if (data.code === 0) {
      alert('交易已取消');
      fetchOutgoing();
    } else {
      alert(data.message || '操作失败');
    }
  } catch (error) {
    console.error('Cancel trade error:', error);
    alert('网络错误');
  }
}

// 页面加载时获取交易列表
onMounted(() => {
  fetchOutgoing();
  fetchIncoming();
});
</script>

<style scoped>
.c2c-container {
  padding: 20px;
  color: white;
  height: 100%;
  overflow-y: auto;
}

.title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 16px;
}

.form input {
  width: 100%;
  padding: 10px 14px;
  margin-bottom: 10px;
  border-radius: 10px;
  background: #1a1a1a;
  border: 1px solid #333;
  color: white;
  font-size: 14px;
}

.form input:focus {
  outline: none;
  border-color: #2b9547;
}

.row {
  display: flex;
  gap: 10px;
}

.token-suggestions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin: 4px 0 12px;

  .hint {
    font-size: 12px;
    color: #9aa0a6;
  }

  .token-chip {
    padding: 4px 10px;
    border-radius: 6px;
    border: 1px solid #333;
    background: transparent;
    color: #ddd;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: #2a2a2a;
      border-color: #444;
      color: #fff;
    }
  }
}

.submit-btn {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #2b9547, #1e7a35);
  color: white;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  font-size: 15px;
  font-weight: 500;
  transition: all 0.2s;
}

.submit-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #33a852, #259a42);
  transform: translateY(-1px);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Tabs 样式 */
.tabs-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 24px 0 16px;
}

.tabs-slider {
  flex: 1;
  display: flex;
  position: relative;
  background: #1a1a1a;
  border-radius: 12px;
  padding: 4px;
}

.slider-indicator {
  position: absolute;
  top: 4px;
  left: 4px;
  width: calc(50% - 4px);
  height: calc(100% - 8px);
  background: linear-gradient(135deg, #2b9547, #1e7a35);
  border-radius: 8px;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 0;
}

.tab-btn {
  flex: 1;
  padding: 10px 16px;
  background: transparent;
  color: #888;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  position: relative;
  z-index: 1;
  transition: color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.tab-btn.active {
  color: white;
}

.tab-btn:hover:not(.active) {
  color: #aaa;
}

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: #333;
  border-radius: 9px;
  font-size: 11px;
  color: #888;
}

.tab-btn.active .badge {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.badge.pending {
  background: #ff6b35;
  color: white;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.refresh-btn {
  width: 40px;
  height: 40px;
  padding: 0;
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  background: #222;
  border-color: #444;
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.refresh-icon {
  font-size: 18px;
  color: #888;
}

.refresh-btn:hover .refresh-icon {
  color: #fff;
}

/* 交易列表 */
.trade-list {
  min-height: 200px;
}

.trade-card {
  background: #111;
  padding: 14px;
  margin-bottom: 12px;
  border-radius: 12px;
  border: 1px solid #222;
  transition: border-color 0.2s;
}

.trade-card:hover {
  border-color: #333;
}

.trade-info p {
  margin: 6px 0;
  font-size: 14px;
}

.trade-info strong {
  color: #888;
  font-weight: normal;
}

.status-pending {
  color: #ffaa00;
  font-weight: 500;
}

.status-accepted {
  color: #4caf50;
  font-weight: 500;
}

.status-rejected {
  color: #ff4444;
  font-weight: 500;
}

.status-cancelled {
  color: #666;
  font-weight: 500;
}

.actions {
  display: flex;
  gap: 10px;
  margin-top: 12px;
}

.btn {
  padding: 10px 16px;
  border-radius: 10px;
  color: white;
  border: none;
  cursor: pointer;
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.accept {
  background: linear-gradient(135deg, #207820, #186018);
}

.accept:hover {
  background: linear-gradient(135deg, #259925, #1e7a1e);
}

.reject {
  background: linear-gradient(135deg, #aa1e1e, #881818);
}

.reject:hover {
  background: linear-gradient(135deg, #cc2222, #aa1e1e);
}

.cancel {
  background: #333;
}

.cancel:hover {
  background: #444;
}

.empty {
  text-align: center;
  opacity: 0.5;
  font-size: 14px;
  padding: 40px 20px;
}

/* 冻结提示 */
.frozen-tip {
  color: #ffaa00;
  font-size: 12px;
  margin-left: 4px;
}

/* 交易时间 */
.trade-times {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.time-item {
  font-size: 12px;
  color: #888;
}

.time-label {
  color: #666;
  margin-right: 4px;
}
</style>
