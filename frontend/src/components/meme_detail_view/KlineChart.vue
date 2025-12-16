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

    <!-- 技术指标区域 -->
    <div class="indicators-section">
      <!-- 技术指标选择器 -->
      <div class="indicator-selector">
        <button
          :class="['indicator-btn', { active: selectedIndicators.includes('MA') }]"
          @click="toggleIndicator('MA')"
        >
          MA
        </button>
        <button
          :class="['indicator-btn', { active: selectedIndicators.includes('VOL') }]"
          @click="toggleIndicator('VOL')"
        >
          VOL
        </button>
        <button
          :class="['indicator-btn', { active: selectedIndicators.includes('MACD') }]"
          @click="toggleIndicator('MACD')"
        >
          MACD
        </button>
        <button
          :class="['indicator-btn', { active: selectedIndicators.includes('RSI') }]"
          @click="toggleIndicator('RSI')"
        >
          RSI
        </button>
      </div>

      <!-- 技术指标显示区域 -->
      <div class="indicators-display">
        <div v-if="selectedIndicators.includes('MA')" class="indicator-panel">
          <div class="indicator-title">MA · 移动平均线</div>
          <div class="indicator-chart line-chart">
            <svg viewBox="0 0 220 80" preserveAspectRatio="none">
              <polyline
                v-if="indicatorSeries.MA.ma20 && indicatorSeries.MA.ma20.length"
                :points="buildPolylinePoints(indicatorSeries.MA.ma20)"
                class="ma-line ma20"
              />
              <polyline
                v-if="indicatorSeries.MA.ma10 && indicatorSeries.MA.ma10.length"
                :points="buildPolylinePoints(indicatorSeries.MA.ma10)"
                class="ma-line ma10"
              />
              <polyline
                v-if="indicatorSeries.MA.ma5 && indicatorSeries.MA.ma5.length"
                :points="buildPolylinePoints(indicatorSeries.MA.ma5)"
                class="ma-line ma5"
              />
            </svg>
          </div>
          <div class="indicator-values legend">
            <span class="dot ma5"></span>MA5 {{ formatPriceValue(indicatorData.MA.ma5) }}
            <span class="dot ma10"></span>MA10 {{ formatPriceValue(indicatorData.MA.ma10) }}
            <span class="dot ma20"></span>MA20 {{ formatPriceValue(indicatorData.MA.ma20) }}
          </div>
        </div>

        <div v-if="selectedIndicators.includes('VOL')" class="indicator-panel">
          <div class="indicator-title">VOL · 成交量</div>
          <div class="indicator-chart volume-chart">
            <div
              v-for="(value, index) in indicatorSeries.VOL.bars"
              :key="index"
              class="volume-bar"
              :style="{ height: `${Math.max(0, value ?? 0) * 100}%` }"
            ></div>
          </div>
          <div class="indicator-values">
            <span>最新: {{ formatVolume(indicatorData.VOL.latest) }}</span>
            <span>7 日均量: {{ formatVolume(indicatorData.VOL.avg7) }}</span>
        </div>
        </div>

        <div v-if="selectedIndicators.includes('MACD')" class="indicator-panel">
          <div class="indicator-title">MACD · 动能</div>
          <div class="indicator-chart macd-chart">
            <div class="macd-histogram">
              <div
                v-for="(height, index) in indicatorSeries.MACD.histogramHeight"
                :key="index"
                class="histogram-bar"
                :class="indicatorSeries.MACD.histogram[index] >= 0 ? 'positive' : 'negative'"
                :style="{ height: `${(height || 0) * 100}%` }"
              ></div>
            </div>
            <svg viewBox="0 0 220 60" preserveAspectRatio="none">
              <polyline
                v-if="indicatorSeries.MACD.macdLine.length"
                :points="buildPolylinePoints(indicatorSeries.MACD.macdLine, 220, 60)"
                class="macd-line"
              />
              <polyline
                v-if="indicatorSeries.MACD.signalLine.length"
                :points="buildPolylinePoints(indicatorSeries.MACD.signalLine, 220, 60)"
                class="signal-line"
              />
            </svg>
          </div>
          <div class="indicator-values">
            <span>MACD: {{ formatNumber(indicatorData.MACD.macd) }}</span>
            <span>Signal: {{ formatNumber(indicatorData.MACD.signal) }}</span>
            <span>Histogram: {{ formatNumber(indicatorData.MACD.histogram) }}</span>
        </div>
        </div>

        <div v-if="selectedIndicators.includes('RSI')" class="indicator-panel">
          <div class="indicator-title">RSI · 相对强弱</div>
          <div class="indicator-chart rsi-chart">
            <svg viewBox="0 0 220 80" preserveAspectRatio="none">
              <line x1="0" y1="24" x2="220" y2="24" class="rsi-threshold overbought" />
              <line x1="0" y1="56" x2="220" y2="56" class="rsi-threshold oversold" />
              <polyline
                v-if="indicatorSeries.RSI.line.length"
                :points="buildPolylinePoints(indicatorSeries.RSI.line, 220, 80)"
                class="rsi-line"
              />
            </svg>
            </div>
          <div class="indicator-values">
            <span>RSI(14): {{ formatNumber(indicatorData.RSI.value) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from "vue";
import { init } from "klinecharts";
import axios from "axios";
import { useAuthStore } from "@/stores/auth";

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
const selectedIndicators = ref(['MA', 'VOL', 'MACD', 'RSI']);
const loading = ref(false);
const error = ref(null);
const indicatorData = ref({
  MA: { ma5: null, ma10: null, ma20: null },
  VOL: { latest: null, avg7: null },
  MACD: { macd: null, signal: null, histogram: null },
  RSI: { value: null }
});
const indicatorSeries = ref({
  MA: { ma5: [], ma10: [], ma20: [] },
  VOL: { bars: [] },
  MACD: { histogram: [], histogramHeight: [], macdLine: [], signalLine: [] },
  RSI: { line: [] }
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

const formatPriceValue = (value) => {
  if (value === null || value === undefined) return '--';
  if (Math.abs(value) >= 1) {
    return value.toFixed(4);
  }
  return value.toPrecision(4);
};

const formatNumber = (value) => {
  if (value === null || value === undefined || Number.isNaN(value)) return '--';
  return Number(value).toFixed(4);
};

const average = (arr = []) => {
  if (!arr.length) return null;
  return arr.reduce((sum, val) => sum + val, 0) / arr.length;
};

const normalizeSeries = (series = []) => {
  if (!series.length) return [];
  const valid = series.filter((value) => typeof value === 'number' && !Number.isNaN(value));
  if (!valid.length) return series.map(() => null);
  const min = Math.min(...valid);
  const max = Math.max(...valid);
  const range = max - min || 1;
  return series.map((value) => {
    if (value === null || value === undefined || Number.isNaN(value)) return null;
    return (value - min) / range;
  });
};

const normalizeSeriesSymmetric = (series = []) => {
  if (!series.length) return [];
  const valid = series.filter((value) => typeof value === 'number' && !Number.isNaN(value));
  if (!valid.length) return series.map(() => null);
  const maxAbs = Math.max(...valid.map((value) => Math.abs(value))) || 1;
  return series.map((value) => {
    if (value === null || value === undefined || Number.isNaN(value)) return null;
    return (value + maxAbs) / (2 * maxAbs);
  });
};

const buildHistogramHeights = (series = []) => {
  if (!series.length) return [];
  const valid = series.filter((value) => typeof value === 'number' && !Number.isNaN(value));
  const maxAbs = valid.length ? Math.max(...valid.map((value) => Math.abs(value))) : 1;
  const divisor = maxAbs || 1;
  return series.map((value) => {
    if (value === null || value === undefined || Number.isNaN(value)) return 0;
    return Math.abs(value) / divisor;
  });
};

const computeSMAArray = (data = [], period) => {
  if (!data.length || !period) return [];
  return data.map((_, index) => {
    if (index + 1 < period) return null;
    const slice = data.slice(index + 1 - period, index + 1);
    return average(slice);
  });
};

const computeEMAArray = (data = [], period) => {
  if (!data.length || !period) return [];
  const multiplier = 2 / (period + 1);
  let previous = null;
  return data.map((value) => {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return previous;
    }
    if (previous === null) {
      previous = value;
      return previous;
    }
    previous = (value - previous) * multiplier + previous;
    return previous;
  });
};

const computeMACDSeries = (data = [], fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) => {
  if (!data.length) {
    return { macd: [], signal: [], histogram: [] };
  }
  const emaFast = computeEMAArray(data, fastPeriod);
  const emaSlow = computeEMAArray(data, slowPeriod);
  const macd = data.map((_, index) => {
    if (emaFast[index] === null || emaFast[index] === undefined) return null;
    if (emaSlow[index] === null || emaSlow[index] === undefined) return null;
    return emaFast[index] - emaSlow[index];
  });
  const signal = computeEMAArray(
    macd.map((value) => (value === null ? null : value)),
    signalPeriod
  ).map((value, index) => (macd[index] === null ? null : value));
  const histogram = macd.map((value, index) => {
    if (value === null || signal[index] === null) return null;
    return value - signal[index];
  });
  return { macd, signal, histogram };
};

const computeRSISeries = (data = [], period = 14) => {
  if (!data.length) return [];
  const rsi = new Array(data.length).fill(null);
  if (data.length <= period) return rsi;

  let averageGain = 0;
  let averageLoss = 0;
  for (let i = 1; i <= period; i++) {
    const change = data[i] - data[i - 1];
    if (change >= 0) {
      averageGain += change;
    } else {
      averageLoss -= change;
    }
  }
  averageGain /= period;
  averageLoss /= period;

  const computeValue = (gain, loss) => {
    if (loss === 0) return 100;
    const rs = gain / loss;
    return 100 - 100 / (1 + rs);
  };

  rsi[period] = computeValue(averageGain, averageLoss);

  for (let i = period + 1; i < data.length; i++) {
    const change = data[i] - data[i - 1];
    if (change >= 0) {
      averageGain = ((averageGain * (period - 1)) + change) / period;
      averageLoss = ((averageLoss * (period - 1)) + 0) / period;
    } else {
      averageGain = ((averageGain * (period - 1)) + 0) / period;
      averageLoss = ((averageLoss * (period - 1)) + Math.abs(change)) / period;
    }
    rsi[i] = computeValue(averageGain, averageLoss);
  }
  return rsi;
};

const buildPolylinePoints = (series = [], width = 220, height = 80) => {
  if (!series.length) return '';
  const len = series.length;
  const hasValue = series.some((value) => value !== null && value !== undefined);
  if (!hasValue) return '';
  return series
    .map((value, index) => {
      if (value === null || value === undefined || Number.isNaN(value)) return null;
      const x = len === 1 ? width : (index / (len - 1)) * width;
      const y = (1 - value) * height;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .filter(Boolean)
    .join(' ');
};

// 获取价格历史数据
const fetchPriceHistory = async (timeframe) => {
  if (!props.memeId) return;

  loading.value = true;
  error.value = null;

  try {
    const config = timeframeConfigs[timeframe] || timeframeConfigs['1H'];
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

    console.log("response.data: ", response.data)

    if (response.data && response.data.code === 0) {
      const priceHistory = response.data.data;
      return processPriceData(priceHistory);
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

const processPriceData = (priceHistory = []) => {
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

  updatePriceStats(klineData);
  return klineData;
};

const updatePriceStats = (klineData) => {
  if (!klineData.length) return;

    const latest = klineData[klineData.length - 1];
    const previous = klineData[klineData.length - 2] || latest;

    currentPrice.value = latest.close;
    priceChange.value = latest.close - previous.close;
    priceChangePercent.value = previous.close !== 0 ? (priceChange.value / previous.close) * 100 : 0;

  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const lastDayData = klineData.filter(item => item.timestamp >= dayAgo);
  const scope = lastDayData.length ? lastDayData : klineData;

  high24h.value = Math.max(...scope.map(d => d.high));
  low24h.value = Math.min(...scope.map(d => d.low));
  volume24h.value = scope.reduce((sum, d) => sum + (d.volume || 0), 0);

  updateIndicatorSnapshots(klineData);
};

const updateIndicatorSnapshots = (klineData) => {
  const closes = klineData.map(d => d.close);
  const volumes = klineData.map(d => d.volume || 0);

  const ma5Series = computeSMAArray(closes, 5);
  const ma10Series = computeSMAArray(closes, 10);
  const ma20Series = computeSMAArray(closes, 20);

  const latestVolume = volumes.at(-1) ?? null;
  const avgVolume7 = average(volumes.slice(-7));

  const macdSeries = computeMACDSeries(closes);
  const rsiSeries = computeRSISeries(closes, 14);

  indicatorData.value = {
    MA: {
      ma5: ma5Series.at(-1) ?? null,
      ma10: ma10Series.at(-1) ?? null,
      ma20: ma20Series.at(-1) ?? null
    },
    VOL: {
      latest: latestVolume,
      avg7: avgVolume7 ?? null
    },
    MACD: {
      macd: macdSeries.macd.at(-1) ?? null,
      signal: macdSeries.signal.at(-1) ?? null,
      histogram: macdSeries.histogram.at(-1) ?? null
    },
    RSI: {
      value: rsiSeries.at(-1) ?? null
    }
  };

  const maxPoints = 80;
  const sliceSeries = (series = []) => series.slice(-maxPoints);
  const ma5Slice = normalizeSeries(sliceSeries(ma5Series));
  const ma10Slice = normalizeSeries(sliceSeries(ma10Series));
  const ma20Slice = normalizeSeries(sliceSeries(ma20Series));
  const volumeSlice = normalizeSeries(sliceSeries(volumes));
  const macdSlice = sliceSeries(macdSeries.macd);
  const signalSlice = sliceSeries(macdSeries.signal);
  const histogramSlice = sliceSeries(macdSeries.histogram);
  const histogramHeights = buildHistogramHeights(histogramSlice);
  const macdLine = normalizeSeriesSymmetric(macdSlice);
  const signalLine = normalizeSeriesSymmetric(signalSlice);
  const rsiSlice = sliceSeries(rsiSeries).map((value) =>
    value === null || value === undefined ? null : value / 100
  );
  const rsiLine = normalizeSeries(rsiSlice);

  indicatorSeries.value = {
    MA: {
      ma5: ma5Slice,
      ma10: ma10Slice,
      ma20: ma20Slice
    },
    VOL: {
      bars: volumeSlice
    },
    MACD: {
      histogram: histogramSlice,
      histogramHeight: histogramHeights,
      macdLine,
      signalLine
    },
    RSI: {
      line: rsiLine
    }
  };
};

// 切换时间周期
const changeTimeframe = async (timeframe) => {
  active.value = timeframe;
  const newData = await fetchPriceHistory(timeframe);
  if (chart && Array.isArray(newData) && newData.length) {
    chart.applyNewData(newData);
  }
};

// 计算图表高度
// 切换技术指标
const toggleIndicator = (indicator) => {
  const index = selectedIndicators.value.indexOf(indicator);
  if (index > -1) {
    selectedIndicators.value.splice(index, 1);
  } else {
    selectedIndicators.value.push(indicator);
  }

  // 不再动态改变K线图，保持K线图大小固定
};

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

  // 不在K线图内部创建指标，保持K线图纯净
  // chart.createIndicator('VOL', true);

  // 如果有memeId则加载数据
  if (props.memeId) {
    const initialData = await fetchPriceHistory(active.value);
    if (chart && Array.isArray(initialData) && initialData.length) {
      chart.applyNewData(initialData);
    }
  }
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
    height: 400px; /* 固定高度，不再变化 */
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

  .indicators-section {
    margin-top: 16px;

    .indicator-selector {
      display: flex;
      gap: 8px;
      justify-content: center;
      margin-bottom: 16px;

      .indicator-btn {
        padding: 6px 12px;
        background: #0d0d0d;
        border: 1px solid #333;
        color: #888;
        font-size: 12px;
        border-radius: 6px;
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

    .indicators-display {
      display: grid;
      gap: 12px;

      .indicator-panel {
        background: #1a1a1a;
        border: 1px solid #333;
        border-radius: 8px;
        padding: 12px;

        .indicator-title {
          font-size: 12px;
          color: #888;
          margin-bottom: 8px;
          font-weight: 600;
        }

        .indicator-chart {
          background: #0d0d0d;
          border-radius: 6px;
          overflow: hidden;
          position: relative;
        }

        .line-chart {
          padding: 0;

          svg {
            width: 100%;
            height: 80px;
          }

          .ma-line {
            fill: none;
            stroke-width: 2;

            &.ma5 {
              stroke: #ff7b72;
            }

            &.ma10 {
              stroke: #ffb347;
            }

            &.ma20 {
              stroke: #58c4dd;
            }
          }
        }

        .indicator-values.legend {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          font-size: 12px;
          color: #bbb;

          .dot {
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            margin-right: 4px;

            &.ma5 {
              background: #ff7b72;
            }

            &.ma10 {
              background: #ffb347;
            }

            &.ma20 {
              background: #58c4dd;
            }
          }
        }

        .volume-chart {
          height: 80px;
            display: flex;
            align-items: flex-end;
            gap: 2px;
            padding: 4px;

            .volume-bar {
              flex: 1;
              min-height: 2px;
            background: linear-gradient(180deg, #6cdd8b, #2f8555);
              border-radius: 1px;
            opacity: 0.85;
            }
          }

        .macd-chart {
          display: flex;
          flex-direction: column;
          gap: 6px;

            .macd-histogram {
              display: flex;
              align-items: center;
              gap: 2px;
            height: 38px;

              .histogram-bar {
                flex: 1;
                width: 2px;
                border-radius: 1px;

                &.positive {
                  background: #65c281;
                }

                &.negative {
                  background: #ff3b69;
                }
              }
            }

          svg {
            width: 100%;
            height: 60px;
          }

          .macd-line,
          .signal-line {
            fill: none;
            stroke-width: 2;
          }

          .macd-line {
            stroke: #4a9eff;
          }

          .signal-line {
            stroke: #ffb347;
          }
        }

        .rsi-chart {
          svg {
            width: 100%;
            height: 80px;
            }

          .rsi-line {
            fill: none;
            stroke: #ffd166;
            stroke-width: 2;
          }

          .rsi-threshold {
            stroke-width: 1;
            stroke-dasharray: 4;

                &.overbought {
              stroke: rgba(255, 59, 105, 0.6);
                }

                &.oversold {
              stroke: rgba(101, 194, 129, 0.6);
            }
          }
        }

        .indicator-desc {
          font-size: 11px;
          color: #888;
          margin: 6px 0 4px;
                }

        .indicator-values {
          font-size: 12px;
          color: #bbb;
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
      }
    }
  }
}
</style>