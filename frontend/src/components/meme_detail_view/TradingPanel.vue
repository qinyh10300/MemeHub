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

    <!-- 交易表单 -->
    <div class="trade-form">
      <!-- 价格输入 (仅限价单显示) -->
      <div v-if="orderType === 'limit'" class="form-group">
        <label class="form-label">价格</label>
        <div class="input-group">
          <span class="input-prefix">$</span>
          <input
            v-model.number="price"
            type="number"
            step="0.000001"
            placeholder="0.000000"
            class="form-input"
          />
        </div>
      </div>

      <!-- 数量输入 -->
      <div class="form-group">
        <label class="form-label">数量</label>
        <div class="input-group">
          <input
            v-model.number="amount"
            type="number"
            step="0.001"
            placeholder="0.000"
            class="form-input"
          />
        </div>
      </div>

      <!-- 总额 (自动计算) -->
      <div class="form-group">
        <label class="form-label">总额</label>
        <div class="input-group">
          <span class="input-prefix">$</span>
          <input
            :value="totalAmount.toFixed(6)"
            type="text"
            readonly
            class="form-input readonly"
          />
        </div>
      </div>

      <!-- 快速选择按钮 -->
      <div class="quick-select">
        <button
          v-for="percent in [25, 50, 75, 100]"
          :key="percent"
          class="quick-btn"
          @click="selectPercent(percent)"
        >
          {{ percent }}%
        </button>
      </div>

      <!-- 可用余额显示 -->
      <div class="balance-info">
        <div class="balance-item">
          <span class="balance-label">可用余额</span>
          <span class="balance-value">${{ availableBalance.toFixed(2) }}</span>
        </div>
        <div class="balance-item">
          <span class="balance-label">可卖出</span>
          <span class="balance-value">{{ availableToken.toFixed(2) }} {{ tokenSymbol }}</span>
        </div>
      </div>

      <!-- 交易按钮 -->
      <button
        :class="['trade-btn', tradeType]"
        @click="executeTrade"
        :disabled="!canTrade"
      >
        {{ tradeType === 'buy' ? '买入' : '卖出' }} {{ tokenSymbol }}
      </button>

      <!-- 交易提示 -->
      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>
    </div>

    <!-- 最近交易记录 -->
    <div class="recent-trades">
      <h3 class="section-title">最近交易</h3>
      <div class="trade-history">
        <div v-for="(trade, index) in recentTrades.slice(0, 5)" :key="index" class="trade-item">
          <div class="trade-info">
            <span :class="['trade-type', trade.type]">
              {{ trade.type === 'buy' ? '买入' : '卖出' }}
            </span>
            <span class="trade-amount">{{ trade.amount }} {{ tokenSymbol }}</span>
          </div>
          <div class="trade-price">
            ${{ trade.price.toFixed(6) }}
          </div>
          <div class="trade-time">
            {{ formatTime(trade.time) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useAuthStore } from '@/stores/auth';

const props = defineProps({
  selectedOrder: {
    type: Object,
    default: null
  }
});

const authStore = useAuthStore();
const server_ip = authStore.server_ip;

// 交易表单状态
const tradeType = ref('buy'); // 'buy' | 'sell'
const orderType = ref('market'); // 'market' | 'limit'
const price = ref(0);
const amount = ref(0);
const availableBalance = ref(10000); // 模拟余额
const availableToken = ref(1000); // 模拟代币余额
const tokenSymbol = ref('MEME');
const errorMessage = ref('');

// 最近交易记录
const recentTrades = ref([
  { type: 'buy', amount: 100, price: 0.000123, time: Date.now() - 60000 },
  { type: 'sell', amount: 50, price: 0.000125, time: Date.now() - 120000 },
  { type: 'buy', amount: 200, price: 0.000120, time: Date.now() - 180000 },
  { type: 'sell', amount: 75, price: 0.000126, time: Date.now() - 240000 },
  { type: 'buy', amount: 150, price: 0.000122, time: Date.now() - 300000 },
]);

// 计算总额
const totalAmount = computed(() => {
  if (orderType.value === 'market') {
    // 市价单使用估算价格
    const estimatedPrice = 0.000124; // 模拟当前市价
    return amount.value * estimatedPrice;
  }
  return amount.value * price.value;
});

// 检查是否可以交易
const canTrade = computed(() => {
  if (amount.value <= 0) return false;

  if (tradeType.value === 'buy') {
    return totalAmount.value <= availableBalance.value;
  } else {
    return amount.value <= availableToken.value;
  }
});

// 选择百分比
const selectPercent = (percent) => {
  if (tradeType.value === 'buy') {
    const targetAmount = (availableBalance.value * percent / 100) / (price.value || 0.000124);
    amount.value = Number(targetAmount.toFixed(3));
  } else {
    amount.value = Number((availableToken.value * percent / 100).toFixed(3));
  }
};

// 执行交易
const executeTrade = async () => {
  errorMessage.value = '';

  try {
    const orderData = {
      type: tradeType.value,
      orderType: orderType.value,
      amount: amount.value,
      price: orderType.value === 'market' ? 'market' : price.value,
      total: totalAmount.value
    };

    // 模拟API调用
    console.log('提交订单:', orderData);

    // 实际项目中应该调用后端API
    // const response = await fetch(`${server_ip}/api/trade`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'token': authStore.user_token
    //   },
    //   body: JSON.stringify(orderData)
    // });

    // 更新余额 (模拟)
    if (tradeType.value === 'buy') {
      availableBalance.value -= totalAmount.value;
      availableToken.value += amount.value;
    } else {
      availableBalance.value += totalAmount.value;
      availableToken.value -= amount.value;
    }

    // 添加到交易历史
    recentTrades.value.unshift({
      type: tradeType.value,
      amount: amount.value,
      price: orderType.value === 'market' ? 0.000124 : price.value,
      time: Date.now()
    });

    // 限制历史记录数量
    if (recentTrades.value.length > 10) {
      recentTrades.value = recentTrades.value.slice(0, 10);
    }

    // 重置表单
    amount.value = 0;
    if (orderType.value === 'limit') {
      price.value = 0;
    }

    console.log('交易成功!');

  } catch (error) {
    errorMessage.value = error.message || '交易失败，请重试';
    console.error('交易错误:', error);
  }
};

// 格式化时间
const formatTime = (timestamp) => {
  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 60000) {
    return '刚刚';
  } else if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`;
  } else {
    return new Date(timestamp).toLocaleTimeString();
  }
};

// 监听订单选择
watch(() => props.selectedOrder, (newOrder) => {
  if (newOrder) {
    price.value = newOrder.price;
    amount.value = newOrder.amount;
    orderType.value = 'limit'; // 自动切换到限价单
  }
});

// 组件挂载时初始化
onMounted(() => {
  // 可以在这里获取当前市场价格
  // price.value = await getCurrentPrice();
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

      &.active {
        &.buy {
          background: #00d084;
          color: #000;
        }
        &.sell {
          background: #ff3b69;
          color: #fff;
        }
      }
    }
  }

  .order-type-selector {
    display: flex;
    gap: 8px;
    margin-bottom: 20px;

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

  .trade-form {
    .form-group {
      margin-bottom: 16px;

      .form-label {
        display: block;
        font-size: 12px;
        color: #888;
        margin-bottom: 6px;
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
      margin-bottom: 20px;

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
      margin-bottom: 20px;
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
      padding: 8px;
      background: rgba(255, 59, 105, 0.1);
      border: 1px solid #ff3b69;
      border-radius: 6px;
      color: #ff3b69;
      font-size: 12px;
    }
  }

  .recent-trades {
    margin-top: 24px;

    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: #fff;
      margin-bottom: 12px;
    }

    .trade-history {
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
</style>