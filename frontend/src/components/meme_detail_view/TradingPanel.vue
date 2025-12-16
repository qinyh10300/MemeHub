<template>
  <div class="trading-panel">
    <!-- 交易类型选择 -->
    <div class="trade-tabs">
      <button
        :class="['tab-btn', { active: tradeType === 'buy' }]"
        @click="tradeType = 'buy'"
      >
        买入
      </button>
      <button
        :class="['tab-btn', { active: tradeType === 'sell' }]"
        @click="tradeType = 'sell'"
      >
        卖出
      </button>
    </div>

    <!-- 订单类型选择 -->
    <div class="order-type-selector">
      <button
        :class="['order-type-btn', { active: orderType === 'market' }]"
        @click="orderType = 'market'"
      >
        市价单
      </button>
      <button
        :class="['order-type-btn', { active: orderType === 'limit' }]"
        @click="orderType = 'limit'"
      >
        限价单
      </button>
    </div>

    <!-- 当前价格显示 -->
    <div class="current-price">
      <span class="price-label">当前价格</span>
      <span class="price-value">${{ currentPrice.toFixed(6) }}</span>
    </div>

    <!-- 交易表单 -->
    <div class="trade-form">
      <!-- 价格输入 (仅限价单显示) -->
      <div v-if="orderType === 'limit'" class="form-group">
        <label class="form-label">期望价格</label>
        <div class="input-group">
          <span class="input-prefix">$</span>
          <input
            v-model.number="price"
            type="number"
            step="0.000001"
            :placeholder="currentPrice.toFixed(6)"
            class="form-input"
          />
        </div>
        <p class="form-hint">
          {{ tradeType === 'buy' ? '当市价 ≤ 此价格时自动买入' : '当市价 ≥ 此价格时自动卖出' }}
        </p>
      </div>

      <!-- 数量输入 -->
      <div class="form-group">
        <label class="form-label">数量</label>
        <div class="input-group">
          <input
            v-model.number="amount"
            type="number"
            step="0.0001"
            min="0.0001"
            placeholder="输入数量"
            class="form-input"
          />
          <span class="input-suffix">{{ tokenSymbol }}</span>
        </div>
      </div>

      <!-- 预估总额 -->
      <div class="form-group">
        <label class="form-label">
          {{ orderType === 'market' ? '预估总额' : '总额' }}
          <span v-if="orderType === 'market'" class="hint">(含手续费)</span>
        </label>
        <div class="input-group">
          <span class="input-prefix">$</span>
          <input
            :value="totalAmount.toFixed(6)"
            type="text"
            readonly
            class="form-input readonly"
          />
        </div>
        <p class="quote-hint">
          <span v-if="quoteLoading">根据池子实时计算中...</span>
          <!-- <span v-else-if="quoteError" class="error-text">{{ quoteError }}</span> -->
          <span v-else>以恒定乘积分布估算，实际下单时可能有滑点</span>
        </p>
      </div>

      <!-- 快速选择按钮 -->
      <!-- <div class="quick-select">
        <button
          v-for="percent in [25, 50, 75, 100]"
          :key="percent"
          class="quick-btn"
          @click="selectPercent(percent)"
        >
          {{ percent }}%
        </button>
      </div> -->

      <!-- 可用余额显示 -->
      <div class="balance-info">
        <div class="balance-item">
          <span class="balance-label">可用余额</span>
          <span class="balance-value">${{ availableBalance.toFixed(2) }} USDT</span>
        </div>
        <div class="balance-item">
          <span class="balance-label">持有代币</span>
          <span class="balance-value">{{ availableToken.toFixed(0) }} {{ tokenSymbol }}</span>
        </div>
      </div>

      <!-- 交易按钮 -->
      <button
        :class="['trade-btn', tradeType]"
        @click="executeTrade"
        :disabled="!canTrade || isLoading"
      >
        <span v-if="isLoading" class="loading-spinner"></span>
        <span v-else>
          {{ orderType === 'limit' ? '预约' : '' }}{{ tradeType === 'buy' ? '买入' : '卖出' }} {{ tokenSymbol }}
        </span>
      </button>

      <!-- 交易提示 -->
      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>
      <div v-if="successMessage" class="success-message">
        {{ successMessage }}
      </div>
    </div>

    <!-- 我的挂单 -->
    <div v-if="myOrders.length > 0" class="my-orders">
      <h3 class="section-title">我的挂单</h3>
      <div class="order-list">
        <div v-for="order in myOrders" :key="order._id" class="order-item">
          <div class="order-info">
            <span :class="['order-type', order.side.toLowerCase()]">
              {{ order.side === 'BUY' ? '买入' : '卖出' }}
            </span>
            <span class="order-amount">{{ order.amount }} {{ tokenSymbol }}</span>
            <span class="order-price">@ ${{ order.expectedPrice.toFixed(6) }}</span>
          </div>
          <div class="order-actions">
            <span class="order-status">{{ orderStatusText(order.status) }}</span>
            <button 
              v-if="order.status === 'pending'" 
              class="cancel-btn"
              @click="cancelOrder(order._id)"
              :disabled="cancellingOrder === order._id"
            >
              {{ cancellingOrder === order._id ? '取消中...' : '取消' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 最近交易记录 -->
    <!-- <div class="recent-trades">
      <h3 class="section-title">交易历史</h3>
      <div class="trade-history">
        <div v-if="priceHistory.length === 0" class="empty-history">
          暂无交易记录
        </div>
        <div v-for="(trade, index) in priceHistory.slice(0, 8)" :key="index" class="trade-item">
          <div class="trade-info">
            <span :class="['trade-type', trade.side?.toLowerCase()]">
              {{ trade.side === 'BUY' ? '买入' : '卖出' }}
            </span>
            <span class="trade-amount">{{ trade.amount }} {{ tokenSymbol }}</span>
          </div>
          <div class="trade-price">
            ${{ trade.price?.toFixed(6) || '0.000000' }}
          </div>
          <div class="trade-time">
            {{ formatTime(trade.time) }}
          </div>
        </div>
      </div>
    </div> -->
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const props = defineProps({
  selectedOrder: {
    type: Object,
    default: null
  },
  memeId: {
    type: String,
    default: ''
  }
});

const route = useRoute();
const authStore = useAuthStore();
const server_ip = authStore.server_ip;
const memeId = computed(() => props.memeId || route.params.id);

// 交易表单状态
const tradeType = ref('buy'); // 'buy' | 'sell'
const orderType = ref('market'); // 'market' | 'limit'
const price = ref(0);
const amount = ref(0);
const availableBalance = ref(0); // USDT 余额
const availableToken = ref(0); // 代币余额
const tokenSymbol = ref('MEME');
const currentPrice = ref(0.0001);
const errorMessage = ref('');
const successMessage = ref('');
const isLoading = ref(false);
const cancellingOrder = ref(null);
const quoteAmount = ref(0);
const quoteLoading = ref(false);
const quoteError = ref('');
let quoteTimer = null;
let quoteRequestId = 0;

// 交易历史和挂单
const priceHistory = ref([]);
const myOrders = ref([]);

// 获取 token
function getToken() {
  return authStore.username || authStore.token;
}

const FEE_RATE = 0.003; // 与后端 token 模型保持一致的手续费估算

const getEffectivePrice = () => {
  const referencePrice = currentPrice.value || 0;
  if (orderType.value === 'market') {
    return referencePrice;
  }
  if (price.value && price.value > 0) {
    return price.value;
  }
  return referencePrice;
};

// 计算总额
const fallbackTotal = computed(() => {
  const qty = Math.max(0, amount.value || 0);
  const unitPrice = getEffectivePrice();
  if (!qty || !unitPrice) return 0;
  const gross = qty * unitPrice;
  return tradeType.value === 'buy' ? gross * (1 + FEE_RATE) : gross * (1 - FEE_RATE);
});

const totalAmount = computed(() => {
  if (quoteAmount.value > 0) {
    return quoteAmount.value;
  }
  return fallbackTotal.value;
});

// 检查是否可以交易
const canTrade = computed(() => {
  if (!amount.value || amount.value <= 0) return false;
  if (orderType.value === 'limit' && (!price.value || price.value <= 0)) return false;

  if (tradeType.value === 'buy') {
    return totalAmount.value <= availableBalance.value;
  } else {
    return amount.value <= availableToken.value;
  }
});

// 选择百分比
const selectPercent = (percent) => {
  if (tradeType.value === 'buy') {
    const targetPrice = getEffectivePrice() || 0.0001;
    const balancePortion = (availableBalance.value * percent) / 100;
    const maxAmount = balancePortion / (targetPrice * (1 + FEE_RATE));
    amount.value = Math.max(0.0001, Number(maxAmount.toFixed(4)));
  } else {
    const portion = (availableToken.value * percent) / 100;
    amount.value = Math.max(0.0001, Number(portion.toFixed(4)));
  }
  scheduleQuoteUpdate();
};

const scheduleQuoteUpdate = () => {
  if (quoteTimer) clearTimeout(quoteTimer);
  quoteTimer = setTimeout(fetchQuoteAmount, 250);
};

const fetchQuoteAmount = async () => {
  quoteError.value = '';
  const qty = Math.max(0, Number(amount.value) || 0);
  if (!memeId.value || qty <= 0) {
    quoteAmount.value = 0;
    quoteLoading.value = false;
    return;
  }
  if (!memeId.value || qty <= 0) {
    quoteAmount.value = 0;
    quoteLoading.value = false;
    return;
  }

  const params = new URLSearchParams();
  const signedAmount = tradeType.value === 'buy' ? qty : -qty;
  params.append('amount', signedAmount.toString());
  if (orderType.value === 'limit' && price.value > 0) {
    params.append('expectedPrice', price.value.toString());
  }

  const requestId = ++quoteRequestId;
  quoteLoading.value = true;
  try {
    const res = await fetch(`${server_ip}/api/meme/${memeId.value}/token/price?${params.toString()}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.message) {
      throw new Error(data?.message || '获取预估总额失败');
    }
    if (requestId !== quoteRequestId) return;
    const priceValue = Number(data.price);
    quoteAmount.value = Number.isFinite(priceValue) ? Math.abs(priceValue) : 0;
  } catch (error) {
    if (requestId !== quoteRequestId) return;
    quoteError.value = error.message || '无法获取预估总额';
    quoteAmount.value = 0;
  } finally {
    if (requestId === quoteRequestId) {
      quoteLoading.value = false;
    }
  }
};

// 获取用户余额和代币持有量
const fetchUserBalance = async () => {
  try {
    const token = getToken();
    if (!token) return;

    // 获取用户信息（包含 coins）
    const userRes = await fetch(`${server_ip}/api/user/${token}`, {
      headers: { 'token': token }
    });
    const userData = await userRes.json();
    if (userRes.ok && userData.code === 0) {
      availableBalance.value = userData.data.coins || 0;
    } else {
      console.warn('获取用户余额失败:', userData.message);
      availableBalance.value = 0;
    }

    // 获取用户持有的该代币数量
    if (memeId.value) {
      const tokenRes = await fetch(`${server_ip}/api/meme/${memeId.value}`, {
        headers: { 'token': token }
      });
      const tokenData = await tokenRes.json();
      if (tokenRes.ok) {
        tokenSymbol.value = tokenData.ticker || 'MEME';
        // 从用户的 tokenList 中查找
        const holdingRes = await fetch(`${server_ip}/api/token/by-ticker/${encodeURIComponent(tokenData.ticker)}`, {
          headers: { 'token': token }
        });
        const holdingData = await holdingRes.json();
        if (holdingRes.ok && holdingData.code === 0) {
          availableToken.value = holdingData.data.amount || 0;
        } else {
          console.warn('获取代币持有量失败:', holdingData.message);
          availableToken.value = 0;
        }
      }
    }
  } catch (error) {
    console.error('获取用户余额失败:', error);
  }
};

const PRICE_HISTORY_INTERVAL = '1h';
const PRICE_HISTORY_DURATION = 24 * 60 * 60 * 1000; // 24小时

// 获取当前价格和交易历史
const fetchPriceData = async () => {
  try {
    if (!memeId.value) return;

    const now = Date.now();
    const startTime = now - PRICE_HISTORY_DURATION;
    const params = new URLSearchParams({
      startTime: startTime.toString(),
      endTime: now.toString(),
      interval: PRICE_HISTORY_INTERVAL
    });

    const res = await fetch(`${server_ip}/api/meme/${memeId.value}/token/price-history?${params.toString()}`);
    const data = await res.json();
    if (res.ok && data.code === 0 && Array.isArray(data.data)) {
      const history = data.data;
      if (history.length > 0) {
        const latest = history[history.length - 1];
        const derivedPrice = Number(latest.close ?? latest.price ?? latest.open);
        currentPrice.value = Number.isFinite(derivedPrice) ? derivedPrice : currentPrice.value;
      }

      priceHistory.value = history
        .slice()
        .reverse()
        .map(item => ({
          side: (item.close ?? 0) >= (item.open ?? 0) ? 'BUY' : 'SELL',
          amount: item.volume ?? 0,
          price: item.close ?? item.price ?? 0,
          time: item.timestamp ?? item.time ?? Date.now()
        }));
    }
  } catch (error) {
    console.error('获取价格数据失败:', error);
  }
};

// 获取我的挂单
const fetchMyOrders = async () => {
  try {
    const token = getToken();
    if (!token || !memeId.value) return;

    const res = await fetch(`${server_ip}/api/user/${token}/orders`, {
      headers: { 'token': token }
    });
    const data = await res.json();
    if (res.ok && data.code === 0) {
      // 过滤出当前模因的挂单
      const allOrders = data.data || [];
      myOrders.value = allOrders.filter(order => order.memeId === memeId.value);
    }
  } catch (error) {
    console.error('获取挂单失败:', error);
  }
};

// 执行交易
const executeTrade = async () => {
  errorMessage.value = '';
  successMessage.value = '';
  isLoading.value = true;

  try {
    const token = getToken();
    if (!token) {
      errorMessage.value = '请先登录';
      return;
    }

    let endpoint = '';
    let body = {};

    if (orderType.value === 'market') {
      // 市价单
      endpoint = tradeType.value === 'buy' 
        ? `${server_ip}/api/meme/${memeId.value}/token/buy`
        : `${server_ip}/api/meme/${memeId.value}/token/sell`;
      body = { amount: Number(amount.value) };
    } else {
      // 限价单（预约）
      endpoint = tradeType.value === 'buy'
        ? `${server_ip}/api/meme/${memeId.value}/token/buy-reservation`
        : `${server_ip}/api/meme/${memeId.value}/token/sell-reservation`;
      body = { 
        amount: Number(amount.value),
        expectedPrice: price.value
      };
    }
    console.log('交易请求体:', endpoint, body);
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'token': token
      },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (res.ok) {
      successMessage.value = data.message || '交易成功！';
      // 重置表单
      amount.value = 0;
      if (orderType.value === 'limit') {
        price.value = 0;
      }
      // 刷新数据
      await Promise.all([
        fetchUserBalance(),
        fetchPriceData(),
        fetchMyOrders()
      ]);
    } else {
      errorMessage.value = data.message || '交易失败，请重试';
    }

  } catch (error) {
    errorMessage.value = error.message || '网络错误，请重试';
    console.error('交易错误:', error);
  } finally {
    isLoading.value = false;
  }
};

// 取消挂单
const cancelOrder = async (orderId) => {
  cancellingOrder.value = orderId;
  try {
    const token = getToken();
    const res = await fetch(`${server_ip}/api/order/${orderId}/cancel`, {
      method: 'POST',
      headers: { 'token': token }
    });
    const data = await res.json();
    if (res.ok) {
      successMessage.value = '挂单已取消';
      await fetchMyOrders();
      await fetchUserBalance();
    } else {
      errorMessage.value = data.message || '取消失败';
    }
  } catch (error) {
    errorMessage.value = '取消失败';
  } finally {
    cancellingOrder.value = null;
  }
};

// 订单状态文本
const orderStatusText = (status) => {
  const map = {
    'pending': '挂单中',
    'COMPLETED': '已成交',
    'CANCELLED': '已取消'
  };
  return map[status] || status;
};

// 格式化时间
const formatTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = Date.now();
  const diff = now - date.getTime();

  if (diff < 60000) {
    return '刚刚';
  } else if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`;
  } else if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)}小时前`;
  } else {
    return date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
};

// 监听订单选择（从订单簿点击）
watch(() => props.selectedOrder, (newOrder) => {
  if (newOrder) {
    orderType.value = 'limit';
    tradeType.value = newOrder.side === 'SELL' ? 'sell' : 'buy';
    price.value = newOrder.price;
    amount.value = newOrder.amount;
    scheduleQuoteUpdate();
  }
});

// 监听模因 ID 变化，刷新数据
watch(
  () => memeId.value,
  (newId, oldId) => {
    if (!newId || newId === oldId) return;
    fetchUserBalance();
    fetchPriceData();
    fetchMyOrders();
    quoteAmount.value = 0;
    scheduleQuoteUpdate();
  }
);

watch([amount, price, orderType, tradeType], () => {
  scheduleQuoteUpdate();
});

// 监听交易类型切换，清除消息
watch([tradeType, orderType], () => {
  errorMessage.value = '';
  successMessage.value = '';
});

// 组件挂载时初始化
onMounted(async () => {
  await Promise.all([
    fetchUserBalance(),
    fetchPriceData(),
    fetchMyOrders()
  ]);
  scheduleQuoteUpdate();
});
</script>

<style lang="scss" scoped>
.trading-panel {
  background: #1a1a1a;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #333;

  .trade-tabs {
    display: flex;
    margin-bottom: 16px;
    background: #0d0d0d;
    border-radius: 8px;
    padding: 4px;

    .tab-btn {
      flex: 1;
      padding: 12px;
      background: transparent;
      border: none;
      border-radius: 6px;
      color: #888;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover:not(.active) {
        color: #fff;
      }

      &.active {
        color: #fff;
      }

      &:first-child.active {
        background: #00d084;
        color: #000;
      }

      &:last-child.active {
        background: #ff3b69;
        color: #fff;
      }
    }
  }

  .order-type-selector {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;

    .order-type-btn {
      flex: 1;
      padding: 8px 12px;
      background: #0d0d0d;
      border: 1px solid #333;
      border-radius: 6px;
      color: #888;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        color: #fff;
        border-color: #555;
      }

      &.active {
        background: #65c281;
        color: #000;
        border-color: #65c281;
        font-weight: 600;
      }
    }
  }

  .current-price {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    background: linear-gradient(135deg, rgba(101, 194, 129, 0.1), rgba(0, 208, 132, 0.05));
    border: 1px solid rgba(101, 194, 129, 0.2);
    border-radius: 8px;
    margin-bottom: 16px;

    .price-label {
      font-size: 12px;
      color: #888;
    }

    .price-value {
      font-size: 18px;
      font-weight: 700;
      color: #65c281;
    }
  }

  .trade-form {
    .form-group {
      margin-bottom: 16px;

      .form-label {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: #888;
        margin-bottom: 6px;

        .hint {
          font-size: 10px;
          color: #666;
        }
      }

      .form-hint {
        font-size: 11px;
        color: #666;
        margin-top: 4px;
      }

      .quote-hint {
        margin-top: 6px;
        font-size: 12px;
        color: #7d8597;

        .error-text {
          color: #ff6b6b;
        }
      }

      .input-group {
        position: relative;
        display: flex;
        align-items: center;

        .input-prefix {
          position: absolute;
          left: 12px;
          color: #888;
          font-size: 14px;
          z-index: 1;
        }

        .input-suffix {
          position: absolute;
          right: 12px;
          color: #888;
          font-size: 12px;
        }

        .form-input {
          flex: 1;
          width: 100%;
          padding: 10px 12px 10px 24px;
          background: #0d0d0d;
          border: 1px solid #333;
          border-radius: 8px;
          color: #fff;
          font-size: 14px;
          transition: all 0.2s ease;

          &:focus {
            outline: none;
            border-color: #65c281;
            background: #1a1a1a;
          }

          &.readonly {
            background: #0a0a0a;
            color: #666;
            cursor: not-allowed;
          }
        }
      }
    }

    .quick-select {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;

      .quick-btn {
        flex: 1;
        padding: 6px;
        background: #0d0d0d;
        border: 1px solid #333;
        border-radius: 6px;
        color: #888;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          color: #fff;
          border-color: #555;
          background: #1a1a1a;
        }
      }
    }

    .balance-info {
      margin-bottom: 16px;
      padding: 12px;
      background: #0d0d0d;
      border-radius: 8px;

      .balance-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;

        &:last-child {
          margin-bottom: 0;
        }

        .balance-label {
          font-size: 12px;
          color: #888;
        }

        .balance-value {
          font-size: 14px;
          color: #fff;
          font-weight: 600;
        }
      }
    }

    .trade-btn {
      width: 100%;
      padding: 14px;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;

      .loading-spinner {
        width: 16px;
        height: 16px;
        border: 2px solid transparent;
        border-top-color: currentColor;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      &.buy {
        background: #00d084;
        color: #000;

        &:hover:not(:disabled) {
          background: #00b575;
        }

        &:disabled {
          background: #333;
          color: #666;
          cursor: not-allowed;
        }
      }

      &.sell {
        background: #ff3b69;
        color: #fff;

        &:hover:not(:disabled) {
          background: #e63257;
        }

        &:disabled {
          background: #333;
          color: #666;
          cursor: not-allowed;
        }
      }
    }

    .error-message {
      margin-top: 12px;
      padding: 10px;
      background: rgba(255, 59, 105, 0.1);
      border: 1px solid #ff3b69;
      border-radius: 6px;
      color: #ff3b69;
      font-size: 13px;
    }

    .success-message {
      margin-top: 12px;
      padding: 10px;
      background: rgba(0, 208, 132, 0.1);
      border: 1px solid #00d084;
      border-radius: 6px;
      color: #00d084;
      font-size: 13px;
    }
  }

  .my-orders {
    margin-top: 24px;
    padding-top: 20px;
    border-top: 1px solid #333;

    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: #fff;
      margin-bottom: 12px;
    }

    .order-list {
      .order-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 12px;
        background: #0d0d0d;
        border-radius: 8px;
        margin-bottom: 8px;

        &:last-child {
          margin-bottom: 0;
        }

        .order-info {
          display: flex;
          align-items: center;
          gap: 8px;

          .order-type {
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 600;

            &.buy {
              background: rgba(0, 208, 132, 0.2);
              color: #00d084;
            }

            &.sell {
              background: rgba(255, 59, 105, 0.2);
              color: #ff3b69;
            }
          }

          .order-amount {
            font-size: 13px;
            color: #fff;
          }

          .order-price {
            font-size: 12px;
            color: #888;
          }
        }

        .order-actions {
          display: flex;
          align-items: center;
          gap: 10px;

          .order-status {
            font-size: 11px;
            color: #ffaa00;
          }

          .cancel-btn {
            padding: 4px 10px;
            background: transparent;
            border: 1px solid #ff3b69;
            border-radius: 4px;
            color: #ff3b69;
            font-size: 11px;
            cursor: pointer;
            transition: all 0.2s;

            &:hover:not(:disabled) {
              background: rgba(255, 59, 105, 0.1);
            }

            &:disabled {
              opacity: 0.5;
              cursor: not-allowed;
            }
          }
        }
      }
    }
  }

  .recent-trades {
    margin-top: 24px;
    padding-top: 20px;
    border-top: 1px solid #333;

    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: #fff;
      margin-bottom: 12px;
    }

    .trade-history {
      .empty-history {
        text-align: center;
        color: #666;
        font-size: 13px;
        padding: 20px;
      }

      .trade-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 0;
        border-bottom: 1px solid #2a2a2a;

        &:last-child {
          border-bottom: none;
        }

        .trade-info {
          display: flex;
          align-items: center;
          gap: 8px;

          .trade-type {
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 600;

            &.buy {
              background: rgba(0, 208, 132, 0.2);
              color: #00d084;
            }

            &.sell {
              background: rgba(255, 59, 105, 0.2);
              color: #ff3b69;
            }
          }

          .trade-amount {
            font-size: 12px;
            color: #fff;
          }
        }

        .trade-price {
          font-size: 12px;
          color: #888;
          font-weight: 600;
        }

        .trade-time {
          font-size: 10px;
          color: #666;
        }
      }
    }
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
