<template>
  <div class="order-book">
    <!-- 订单簿标题 -->
    <div class="orderbook-header">
      <h3 class="title">订单簿</h3>
      <div class="depth-toggle">
        <button
          :class="['depth-btn', { active: depth === 0 }]"
          @click="depth = 0"
        >
          全部
        </button>
        <button
          :class="['depth-btn', { active: depth === 10 }]"
          @click="depth = 10"
        >
          10档
        </button>
        <button
          :class="['depth-btn', { active: depth === 20 }]"
          @click="depth = 20"
        >
          20档
        </button>
      </div>
    </div>

    <!-- 订单簿表格头部 -->
    <div class="orderbook-table-header">
      <div class="header-cell price">价格</div>
      <div class="header-cell amount">数量</div>
      <div class="header-cell total">总额</div>
    </div>

    <!-- 卖单 (红色，从高到低) -->
    <div class="sell-orders">
      <div
        v-for="(order, index) in limitedSellOrders"
        :key="'sell-' + index"
        class="order-row sell-order"
        @click="selectOrder(order)"
      >
        <div class="order-cell price sell-color">
          ${{ order.price.toFixed(6) }}
        </div>
        <div class="order-cell amount">
          {{ order.amount.toFixed(2) }}
        </div>
        <div class="order-cell total">
          ${{ (order.price * order.amount).toFixed(4) }}
        </div>
        <!-- 深度条 -->
        <div
          class="depth-bar sell-depth"
          :style="{ width: order.depthPercent + '%' }"
        ></div>
      </div>
    </div>

    <!-- 当前市场价格分隔线 -->
    <div class="current-price-line">
      <div class="current-info">
        <div class="price-info">
          <span class="price-label">最新价格</span>
          <span :class="['current-price', priceChange >= 0 ? 'positive' : 'negative']">
            ${{ currentPrice.toFixed(6) }}
          </span>
          <span :class="['price-change', priceChange >= 0 ? 'positive' : 'negative']">
            {{ priceChange >= 0 ? '+' : '' }}{{ priceChangePercent.toFixed(2) }}%
          </span>
        </div>
        <div class="volume-info">
          <span class="volume-label">成交量</span>
          <span class="volume-value">{{ formatVolume(totalVolume) }}</span>
        </div>
      </div>
    </div>

    <!-- 买单 (绿色，从低到高) -->
    <div class="buy-orders">
      <div
        v-for="(order, index) in limitedBuyOrders"
        :key="'buy-' + index"
        class="order-row buy-order"
        @click="selectOrder(order)"
      >
        <div class="order-cell price buy-color">
          ${{ order.price.toFixed(6) }}
        </div>
        <div class="order-cell amount">
          {{ order.amount.toFixed(2) }}
        </div>
        <div class="order-cell total">
          ${{ (order.price * order.amount).toFixed(4) }}
        </div>
        <!-- 深度条 -->
        <div
          class="depth-bar buy-depth"
          :style="{ width: order.depthPercent + '%' }"
        ></div>
      </div>
    </div>

    <!-- 汇总统计 -->
    <div class="orderbook-summary">
      <div class="summary-item">
        <span class="label">买量</span>
        <span class="value buy-color">{{ totalBuyVolume.toFixed(2) }}</span>
      </div>
      <div class="summary-item">
        <span class="label">卖量</span>
        <span class="value sell-color">{{ totalSellVolume.toFixed(2) }}</span>
      </div>
      <div class="summary-item">
        <span class="label">价差</span>
        <span class="value">{{ spread.toFixed(6) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';

const emit = defineEmits(['orderSelected']);

// 订单簿数据
const buyOrders = ref([]);
const sellOrders = ref([]);
const currentPrice = ref(0.000124);
const priceChange = ref(0.000002);
const priceChangePercent = ref(1.63);
const totalVolume = ref(1250000);
const depth = ref(0); // 0=全部, 10=10档, 20=20档

// 生成模拟订单簿数据
const generateOrderBookData = () => {
  const basePrice = currentPrice.value;
  const buyData = [];
  const sellData = [];

  // 生成买单 (价格从低到高)
  for (let i = 10; i >= 1; i--) {
    const price = basePrice - (i * 0.000001);
    const amount = Math.random() * 5000 + 500;
    buyData.push({
      price,
      amount,
      total: price * amount
    });
  }

  // 生成卖单 (价格从高到低)
  for (let i = 1; i <= 10; i++) {
    const price = basePrice + (i * 0.000001);
    const amount = Math.random() * 5000 + 500;
    sellData.push({
      price,
      amount,
      total: price * amount
    });
  }

  // 计算深度百分比
  const maxBuyVolume = Math.max(...buyData.map(o => o.amount));
  const maxSellVolume = Math.max(...sellData.map(o => o.amount));

  buyData.forEach(order => {
    order.depthPercent = (order.amount / maxBuyVolume) * 100;
  });

  sellData.forEach(order => {
    order.depthPercent = (order.amount / maxSellVolume) * 100;
  });

  buyOrders.value = buyData;
  sellOrders.value = sellData.reverse(); // 卖单从高到低排列
};

// 根据深度设置限制订单数量
const limitedBuyOrders = computed(() => {
  if (depth.value === 0) return buyOrders.value;
  return buyOrders.value.slice(-depth.value);
});

const limitedSellOrders = computed(() => {
  if (depth.value === 0) return sellOrders.value;
  return sellOrders.value.slice(0, depth.value);
});

// 计算总量
const totalBuyVolume = computed(() => {
  return limitedBuyOrders.value.reduce((sum, order) => sum + order.amount, 0);
});

const totalSellVolume = computed(() => {
  return limitedSellOrders.value.reduce((sum, order) => sum + order.amount, 0);
});

// 计算价差
const spread = computed(() => {
  if (sellOrders.value.length > 0 && buyOrders.value.length > 0) {
    const bestSell = sellOrders.value[sellOrders.value.length - 1];
    const bestBuy = buyOrders.value[buyOrders.value.length - 1];
    return bestSell.price - bestBuy.price;
  }
  return 0;
});

// 格式化成交量
const formatVolume = (volume) => {
  if (volume >= 1000000) {
    return (volume / 1000000).toFixed(2) + 'M';
  } else if (volume >= 1000) {
    return (volume / 1000).toFixed(2) + 'K';
  }
  return volume.toString();
};

// 选择订单 (点击时填充到交易表单)
const selectOrder = (order) => {
  emit('orderSelected', {
    price: order.price,
    amount: order.amount
  });
};

// 模拟实时更新
let updateInterval;

const startRealTimeUpdates = () => {
  updateInterval = setInterval(() => {
    // 随机更新价格
    const priceChange = (Math.random() - 0.5) * 0.000002;
    currentPrice.value = Math.max(0.000001, currentPrice.value + priceChange);

    // 随机更新部分订单
    if (buyOrders.value.length > 0) {
      const randomIndex = Math.floor(Math.random() * buyOrders.value.length);
      const order = buyOrders.value[randomIndex];
      const amountChange = (Math.random() - 0.5) * 1000;
      order.amount = Math.max(100, order.amount + amountChange);
      order.total = order.price * order.amount;
    }

    if (sellOrders.value.length > 0) {
      const randomIndex = Math.floor(Math.random() * sellOrders.value.length);
      const order = sellOrders.value[randomIndex];
      const amountChange = (Math.random() - 0.5) * 1000;
      order.amount = Math.max(100, order.amount + amountChange);
      order.total = order.price * order.amount;
    }

    // 更新成交量
    totalVolume.value += Math.floor(Math.random() * 10000);

  }, 2000); // 每2秒更新一次
};

const stopRealTimeUpdates = () => {
  if (updateInterval) {
    clearInterval(updateInterval);
  }
};

onMounted(() => {
  generateOrderBookData();
  startRealTimeUpdates();
});

onUnmounted(() => {
  stopRealTimeUpdates();
});
</script>

<style lang="scss" scoped>
.order-book {
  background: #1a1a1a;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #333;

  .orderbook-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .title {
      font-size: 14px;
      font-weight: 600;
      color: #fff;
    }

    .depth-toggle {
      display: flex;
      gap: 4px;

      .depth-btn {
        padding: 4px 8px;
        background: #0d0d0d;
        border: 1px solid #333;
        border-radius: 4px;
        color: #888;
        font-size: 11px;
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
        }
      }
    }
  }

  .orderbook-table-header {
    display: flex;
    padding: 8px 0;
    border-bottom: 1px solid #333;
    font-size: 11px;
    color: #888;

    .header-cell {
      flex: 1;
      text-align: center;

      &.price {
        flex: 1.2;
        text-align: left;
      }
    }
  }

  .sell-orders {
    max-height: 180px;
    overflow-y: auto;
    margin-bottom: 8px;
  }

  .current-price-line {
    background: #0d0d0d;
    border-radius: 8px;
    padding: 12px;
    margin: 12px 0;
    border: 1px solid #333;

    .current-info {
      .price-info {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 4px;

        .price-label {
          font-size: 11px;
          color: #888;
        }

        .current-price {
          font-size: 16px;
          font-weight: bold;

          &.positive {
            color: #00d084;
          }

          &.negative {
            color: #ff3b69;
          }
        }

        .price-change {
          font-size: 12px;

          &.positive {
            color: #00d084;
          }

          &.negative {
            color: #ff3b69;
          }
        }
      }

      .volume-info {
        display: flex;
        align-items: center;
        gap: 8px;

        .volume-label {
          font-size: 11px;
          color: #888;
        }

        .volume-value {
          font-size: 12px;
          color: #fff;
        }
      }
    }
  }

  .buy-orders {
    max-height: 180px;
    overflow-y: auto;
    margin-top: 8px;
  }

  .order-row {
    position: relative;
    display: flex;
    align-items: center;
    padding: 6px 0;
    cursor: pointer;
    transition: background-color 0.2s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.05);
    }

    .order-cell {
      flex: 1;
      text-align: center;
      font-size: 12px;
      position: relative;
      z-index: 2;

      &.price {
        flex: 1.2;
        text-align: left;
        font-weight: 500;
      }

      &.sell-color {
        color: #ff3b69;
      }

      &.buy-color {
        color: #00d084;
      }
    }

    .depth-bar {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      opacity: 0.1;
      z-index: 1;

      &.sell-depth {
        background: linear-gradient(to right, #ff3b69, transparent);
      }

      &.buy-depth {
        background: linear-gradient(to right, #00d084, transparent);
      }
    }
  }

  .orderbook-summary {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0 0;
    border-top: 1px solid #333;
    margin-top: 12px;

    .summary-item {
      display: flex;
      flex-direction: column;
      align-items: center;

      .label {
        font-size: 10px;
        color: #888;
        margin-bottom: 2px;
      }

      .value {
        font-size: 12px;
        font-weight: 600;
        color: #fff;

        &.buy-color {
          color: #00d084;
        }

        &.sell-color {
          color: #ff3b69;
        }
      }
    }
  }

  // 滚动条样式
  .sell-orders::-webkit-scrollbar,
  .buy-orders::-webkit-scrollbar {
    width: 4px;
  }

  .sell-orders::-webkit-scrollbar-track,
  .buy-orders::-webkit-scrollbar-track {
    background: transparent;
  }

  .sell-orders::-webkit-scrollbar-thumb,
  .buy-orders::-webkit-scrollbar-thumb {
    background: #333;
    border-radius: 2px;

    &:hover {
      background: #555;
    }
  }
}
</style>