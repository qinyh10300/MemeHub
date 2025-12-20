<template>
  <div class="trading-chart">
    <!-- 价格信息头部 -->
    <div class="price-header">
      <div class="price-info">
        <div class="current-price">
          ${{ currentPrice.toFixed(4) }}
          <span :class="['price-change', priceChange >= 0 ? 'positive' : 'negative']">
            {{ priceChange >= 0 ? '+' : '' }}{{ priceChange.toFixed(4) }}
            ({{ priceChangePercent >= 0 ? '+' : '' }}{{ priceChangePercent.toFixed(2) }}%)
          </span>
        </div>
        <div class="price-stats">
          <div class="stat-item">
            <span class="label">24h High</span>
            <span class="value">${{ high24h.toFixed(4) }}</span>
          </div>
          <div class="stat-item">
            <span class="label">24h Low</span>
            <span class="value">${{ low24h.toFixed(4) }}</span>
          </div>
          <div class="stat-item">
            <span class="label">24h Volume</span>
            <span class="value">{{ formatVolume(volume24h) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 时间周期选择器 -->
    <div class="timeframe-selector">
      <button
        v-for="timeframe in timeframes"
        :key="timeframe.value"
        :class="['timeframe-btn', { active: active === timeframe.value }]"
        @click="changeTimeframe(timeframe.value)"
      >
        {{ timeframe.label }}
      </button>
    </div>

    <!-- K线图容器 (固定大小) -->
    <div class="chart-container">
      <div v-if="loading" class="loading-overlay">
        <div class="loading-spinner">加载中...</div>
      </div>
      <div v-if="error" class="error-overlay">
        <div class="error-message">{{ error }}</div>
        <button @click="changeTimeframe(active)" class="retry-btn">重试</button>
      </div>
      <div id="chart_box" class="chart"></div>
    </div>

    <!-- 技术指标选择器 -->
    <div class="indicator-selector">
      <div class="indicator-group">
        <span class="indicator-label">指标:</span>
        <button
          :class="['indicator-btn', { active: selectedIndicators.MA }]"
          @click="toggleIndicator('MA')"
        >
          MA
        </button>
      <!-- </div>
      <div class="indicator-group">
        <span class="indicator-label">副图指标:</span> -->
        <button
          :class="['indicator-btn', { active: selectedIndicators.VOL }]"
          @click="toggleIndicator('VOL')"
        >
          VOL
        </button>
        <button
          :class="['indicator-btn', { active: selectedIndicators.MACD }]"
          @click="toggleIndicator('MACD')"
        >
          MACD
        </button>
        <button
          :class="['indicator-btn', { active: selectedIndicators.RSI }]"
          @click="toggleIndicator('RSI')"
        >
          RSI
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from "vue";
import { init } from "klinecharts";
import axios from "axios";
import { useAuthStore } from "@/stores/auth";
let autoRefreshTimer = null;
const props = defineProps({
  memeId: {
    type: String,
    required: true
  }
});

const authStore = useAuthStore();

const resolveApiBase = () => {
  const base =
    authStore.server_ip ||
    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
  return (base || 'http://localhost:3000').replace(/\/$/, '');
};

const API_BASE = `${resolveApiBase()}/api`;

const active = ref("5M");
const currentPrice = ref(0);
const priceChange = ref(0);
const priceChangePercent = ref(0);
const high24h = ref(0);
const low24h = ref(0);
const volume24h = ref(0);
const loading = ref(false);
const error = ref(null);
const selectedIndicators = ref({
  MA: false,  // 默认不显示MA，可在主图叠加
  VOL: true,  // 默认显示成交量
  MACD: false,
  RSI: false
});

let chart;

// 时间周期选项
const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const timeframeConfigs = {
  '1M': { value: '1M', label: '1分', interval: '1m', durationMs: 1 * HOUR },
  '5M': { value: '5M', label: '5分', interval: '5m', durationMs: 6 * HOUR },
  '15M': { value: '15M', label: '15分', interval: '15m', durationMs: 24 * HOUR },
  '30M': { value: '30M', label: '30分', interval: '30m', durationMs: 3 * DAY },
  '1H': { value: '1H', label: '1小时', interval: '1h', durationMs: 7 * DAY },
  '4H': { value: '4H', label: '4小时', interval: '4h', durationMs: 30 * DAY },
  '1D': { value: '1D', label: '1天', interval: '1d', durationMs: 120 * DAY },
  '1W': { value: '1W', label: '1周', interval: '1w', durationMs: 365 * DAY }
};

const timeframes = Object.values(timeframeConfigs);

// 数值格式化
const formatVolume = (volume = 0) => {
  if (volume === null || volume === undefined) return '--';
  if (Math.abs(volume) >= 1_000_000) {
    return (volume / 1_000_000).toFixed(2) + 'M';
  }
  if (Math.abs(volume) >= 1_000) {
    return (volume / 1_000).toFixed(2) + 'K';
  }
  return volume.toFixed(2);
};

const startAutoRefresh = () => {
  stopAutoRefresh();

  const config = timeframeConfigs[active.value];
  if (!config) return;

  // interval 对应的毫秒数
  // const intervalMs = (() => {
  //   switch (active.value) {
  //     case '1M': return 1 * MINUTE;
  //     case '5M': return 5 * MINUTE;
  //     case '15M': return 15 * MINUTE;
  //     case '30M': return 30 * MINUTE;
  //     case '1H': return 1 * HOUR;
  //     case '4H': return 4 * HOUR;
  //     case '1D': return 1 * DAY;
  //     case '1W': return 7 * DAY;
  //     default: return 5 * MINUTE;
  //   }
  // })();
  const intervalMs = 5000; // 固定每5秒刷新


  autoRefreshTimer = setInterval(() => {
    // 等价于自动“点击”当前周期按钮
    changeTimeframe(active.value);
  }, intervalMs);
};

const stopAutoRefresh = () => {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer);
    autoRefreshTimer = null;
  }
};

// 获取价格历史数据
const fetchPriceHistory = async (timeframe) => {
  if (!props.memeId) return;

  loading.value = true;
  error.value = null;

  try {
    const config = timeframeConfigs[timeframe] || timeframeConfigs['1M'];
    const now = Date.now();
    const lookback = config?.durationMs || 7 * DAY;
    const startTime = now - lookback;
    const interval = config?.interval || '1h';

    const response = await axios.get(`${API_BASE}/meme/${props.memeId}/token/price-history`, {
      params: {
        startTime,
        endTime: now,
        interval
      }
    });
    response.data.data[0]["open"] = 0.1; // TODO: 临时修复后端数据问题，后端需要修复

    // 获取模因最新价格
    const params = new URLSearchParams();
    params.append('amount', 1);
    const latestPrice = await axios.get(`${API_BASE}/meme/${props.memeId}/token/price?${params.toString()}`);
    // 获取5h之前的价格作为对比
    const fiveHoursAgoPrice = await axios.get(`${API_BASE}/meme/${props.memeId}/token/price-history`, {
      params: {
        startTime: now - 5 * HOUR,
        endTime: now - 5 * HOUR + 2 * MINUTE,
        interval: '1M'
      }
    });
    // console.log("response.data: ", response.data)
    // console.log("latestPrice: ", latestPrice.data.price)
    // console.log("response.data: ", response.data.data[0]['open'])
    // console.log("fiveHoursAgoPrice: ", fiveHoursAgoPrice.data.data);

    if (response.data && response.data.code === 0) {
      const priceHistory = response.data.data;
      return processPriceData(priceHistory, latestPrice.data?.price, fiveHoursAgoPrice.data?.data);
    }
    throw new Error(response.data?.message || '获取价格历史失败');
  } catch (err) {
    console.error('获取价格历史失败:', err);
    error.value = err.message || '获取价格历史失败';
    return null;
  } finally {
    loading.value = false;
  }
};

const processPriceData = (priceHistory = [], latestPrice = null, fiveHoursAgoPrice = null) => {
  if (!Array.isArray(priceHistory) || priceHistory.length === 0) {
    error.value = '暂无可用的 K 线数据';
    return null;
  }

  const klineData = priceHistory.map(item => {
    const timestamp = Number(item.timestamp || item.time || Date.now());
    const open = Number(item.open ?? item.price ?? item.close ?? 0);
    const high = Number(item.high ?? open);
    const low = Number(item.low ?? open);
    const close = Number(item.close ?? high ?? open);
    const volume = Number(item.volume ?? 0);
    return {
      timestamp,
      open,
      high,
      low,
      close,
      volume
    };
  });

  
  updatePriceStats(klineData, latestPrice, fiveHoursAgoPrice);
  return klineData;
};

const updatePriceStats = (klineData, latestPrice, fiveHoursAgoPrice) => {
  if (!klineData.length) return;

    const latest = latestPrice;
    const previous = fiveHoursAgoPrice[0];
    // const latest = klineData[klineData.length - 1].close;
    // const previous = klineData[0];

    currentPrice.value = latest;
    priceChange.value = latest - previous.close;
    priceChangePercent.value = previous.close !== 0 ? (priceChange.value / previous.close) * 100 : 0;

  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const lastDayData = klineData.filter(item => item.timestamp >= dayAgo);
  const scope = lastDayData.length ? lastDayData : klineData;

  high24h.value = Math.max(...scope.map(d => d.high));
  low24h.value = Math.min(...scope.map(d => d.low));
  volume24h.value = scope.reduce((sum, d) => sum + (d.volume || 0), 0);
};


// 切换技术指标
const toggleIndicator = (indicator) => {
  selectedIndicators.value[indicator] = !selectedIndicators.value[indicator];
  updateIndicators();
};

// 更新技术指标显示
const updateIndicators = () => {
  if (!chart) return;

  // 先移除所有指标
  try {
    chart.removeIndicator('MA');
    chart.removeIndicator('VOL');
    chart.removeIndicator('MACD');
    chart.removeIndicator('RSI');
  } catch (e) {
    // 忽略移除不存在的指标的错误
  }

  const pane_height = 80;
  const pane_minHeight = 60;
  // MA和VOL都在主图区域显示
  if (selectedIndicators.value.MA) {
    // chart.createIndicator('MA', true); // MA在主图显示
    chart.createIndicator(
      {
        name: 'MA',
        shortName: 'MA',
        precision: 2,
      },
      true,
      {
        id: 'pane-ma',
        height: pane_height,
        minHeight: pane_minHeight,
        dragEnabled: true,
        order: 1,
        state: 'normal',
        axis: {
          position: 'left'
        }
      }
    )
  }

  if (selectedIndicators.value.VOL) {
    chart.createIndicator('VOL', true,
      {
        id: 'pane-vol',
        height: pane_height,
        minHeight: pane_minHeight,
        dragEnabled: true,
        order: 2,
        state: 'normal',
        axis: {
          position: 'left'
        }
      }
    ); // VOL也在主图区域显示
  }

  // MACD和RSI在副图显示
  if (selectedIndicators.value.MACD) {
    chart.createIndicator('MACD', true,
      {
        id: 'pane-macd',
        height: pane_height,
        minHeight: pane_minHeight,
        dragEnabled: true,
        order: 3,
        state: 'normal',
        axis: {
          position: 'left'
        }
      }
    );
  }

  if (selectedIndicators.value.RSI) {
    chart.createIndicator('RSI', true,
      {
        id: 'pane-rsi',
        height: pane_height,
        minHeight: pane_minHeight,
        dragEnabled: true,
        order: 4,
        state: 'normal',
        axis: {
          position: 'left'
        }
      }
    );
  }
};

// 切换时间周期
// const changeTimeframe = async (timeframe) => {
//   active.value = timeframe;
//   const newData = await fetchPriceHistory(timeframe);
//   if (chart && Array.isArray(newData) && newData.length) {
//     chart.applyNewData(newData);
//   }
// };
const changeTimeframe = async (timeframe) => {
  active.value = timeframe;

  const newData = await fetchPriceHistory(timeframe);
  if (chart && Array.isArray(newData) && newData.length) {
    chart.applyNewData(newData);
  }

  // ⭐ 每次手动/自动切换周期，都重新对齐刷新节奏
  startAutoRefresh();
};

// 计算图表高度

// 监听memeId变化，重新加载数据
watch(() => props.memeId, async (newMemeId) => {
  if (newMemeId && chart) {
    const initialData = await fetchPriceHistory(active.value);
    if (initialData) {
      chart.applyNewData(initialData);
    }
  }
});

onMounted(async () => {
  // 初始化图表
  chart = init("chart_box");

  // 设置图表样式
  const styles = {
    grid: {
      show: true,
      horizontal: {
        show: true,
        size: 1,
        color: 'rgba(255, 255, 255, 0.1)',
        style: 'dashed'
      },
      vertical: {
        show: true,
        size: 1,
        color: 'rgba(255, 255, 255, 0.1)',
        style: 'dashed'
      }
    },
    // 确保图表充满整个容器
    pane: {
      display: true
    },
    candle: {
      type: 'candle_solid',
      priceMark: {
        show: true,
        high: {
          show: true,
          color: '#666',
          textSize: 10
        },
        low: {
          show: true,
          color: '#666',
          textSize: 10
        }
      },
      tooltip: {
        showRule: 'follow_cross',
        showType: 'standard',
        labels: ['时间', '开', '收', '高', '低', '成交量'],
        values: ({ kLineData }) => {
          return [
            new Date(kLineData.timestamp).toLocaleString(),
            kLineData.open,
            kLineData.close,
            kLineData.high,
            kLineData.low,
            kLineData.volume
          ];
        }
      }
    },
    separator: {
      size: 1,
      color: 'rgba(255, 255, 255, 0.1)'
    }
  };

  chart.setStyles(styles);

  // 初始化技术指标显示
  updateIndicators();

  // 如果有memeId则加载数据
  if (props.memeId) {
    const initialData = await fetchPriceHistory(active.value);
    if (chart && Array.isArray(initialData) && initialData.length) {
      chart.applyNewData(initialData);
    }
  }

  startAutoRefresh();
});
</script>

<style lang="scss" scoped>
.trading-chart {
  background: #1a1a1a;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #333;

  .price-header {
    margin-bottom: 20px;

    .price-info {
      .current-price {
        font-size: 28px;
        font-weight: bold;
        color: #fff;
        margin-bottom: 12px;

        .price-change {
          font-size: 16px;
          margin-left: 12px;
          font-weight: normal;

          &.positive {
            color: #00d084;
          }

          &.negative {
            color: #ff3b69;
          }
        }
      }

      .price-stats {
        display: flex;
        gap: 24px;

        .stat-item {
          display: flex;
          flex-direction: column;

          .label {
            font-size: 12px;
            color: #888;
            margin-bottom: 4px;
          }

          .value {
            font-size: 14px;
            color: #fff;
            font-weight: 500;
          }
        }
      }
    }
  }

  .timeframe-selector {
    display: flex;
    gap: 4px;
    margin-bottom: 20px;
    background: #0d0d0d;
    padding: 4px;
    border-radius: 8px;

    .timeframe-btn {
      padding: 8px 12px;
      background: transparent;
      border: none;
      color: #888;
      font-size: 12px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        color: #fff;
        background: rgba(255, 255, 255, 0.05);
      }

      &.active {
        background: #65c281;
        color: #000;
        font-weight: 600;
      }
    }
  }

  .chart-container {
    margin-bottom: 16px;
    height: 550px; /* 固定高度，不再变化 */
    width: 100%; /* 确保容器占满宽度 */
    position: relative;

    .chart {
      width: 100%;
      height: 100%;
      background: #0d0d0d;
      border-radius: 8px;
      display: block; /* 确保块级显示 */
      overflow: hidden; /* 防止溢出 */
    }

    .loading-overlay,
    .error-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(13, 13, 13, 0.9);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      z-index: 10;
    }

    .loading-spinner {
      color: #65c281;
      font-size: 16px;
      font-weight: 500;
    }

    .error-message {
      color: #ff3b69;
      font-size: 14px;
      margin-bottom: 12px;
      text-align: center;
    }

    .retry-btn {
      padding: 8px 16px;
      background: #65c281;
      color: #000;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.2s ease;

      &:hover {
        background: #4fa865;
      }
    }
  }

  .indicator-selector {
    margin-top: 16px;
    padding: 12px;
    background: #0d0d0d;
    border-radius: 8px;
    border: 1px solid #333;

    .indicator-group {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;

      &:last-child {
        margin-bottom: 0;
      }

      .indicator-label {
        font-size: 12px;
        color: #888;
        font-weight: 600;
        min-width: 60px;
        text-align: left;
      }

      .indicator-btn {
        padding: 6px 12px;
        background: transparent;
        border: 1px solid #333;
        color: #888;
        font-size: 11px;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          color: #fff;
          border-color: #555;
          background: rgba(255, 255, 255, 0.05);
        }

        &.active {
          background: #65c281;
          color: #000;
          border-color: #65c281;
          font-weight: 600;
        }
      }
    }
  }
}</style>