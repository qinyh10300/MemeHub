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
        <div v-if="selectedIndicators.includes('VOL')" class="indicator-panel">
          <div class="indicator-title">成交量 (VOL)</div>
          <div class="indicator-chart volume-display">
            <div class="volume-bar" v-for="i in 20" :key="i" :style="{ height: Math.random() * 100 + '%' }"></div>
          </div>
        </div>
        <div v-if="selectedIndicators.includes('MACD')" class="indicator-panel">
          <div class="indicator-title">MACD</div>
          <div class="indicator-chart macd-display">
            <div class="macd-line macd"></div>
            <div class="macd-line signal"></div>
            <div class="macd-histogram">
              <div v-for="i in 20" :key="i" class="histogram-bar"
                   :class="{ positive: Math.random() > 0.5, negative: Math.random() <= 0.5 }"
                   :style="{ height: Math.random() * 60 + '%' }"></div>
            </div>
          </div>
        </div>
        <div v-if="selectedIndicators.includes('RSI')" class="indicator-panel">
          <div class="indicator-title">RSI (14)</div>
          <div class="indicator-chart rsi-display">
            <div class="rsi-line"></div>
            <div class="rsi-zones">
              <div class="rsi-zone overbought">超买区 (70)</div>
              <div class="rsi-zone oversold">超卖区 (30)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from "vue";
import { init } from "klinecharts";

const active = ref("1D");
const currentPrice = ref(0);
const priceChange = ref(0);
const priceChangePercent = ref(0);
const high24h = ref(0);
const low24h = ref(0);
const volume24h = ref(0);
const selectedIndicators = ref(['VOL']);
const chartHeight = ref(400);

let chart;

// 时间周期选项
const timeframes = [
  { value: "1M", label: "1分" },
  { value: "5M", label: "5分" },
  { value: "15M", label: "15分" },
  { value: "30M", label: "30分" },
  { value: "1H", label: "1小时" },
  { value: "4H", label: "4小时" },
  { value: "1D", label: "1天" },
  { value: "1W", label: "1周" }
];

// 格式化交易量
const formatVolume = (volume) => {
  if (volume >= 1000000) {
    return (volume / 1000000).toFixed(2) + 'M';
  } else if (volume >= 1000) {
    return (volume / 1000).toFixed(2) + 'K';
  }
  return volume.toString();
};

// 生成模拟K线数据
const generateKlineData = (basePrice = 1, count = 100) => {
  const data = [];
  let current = basePrice;
  const now = Date.now();

  for (let i = count; i > 0; i--) {
    const timestamp = now - (i * 60 * 1000); // 每分钟一根K线
    const open = current;
    const volatility = current * 0.005; // 0.5% 波动率
    const change = (Math.random() - 0.5) * 2 * volatility;
    const close = current + change;
    const high = Math.max(open, close) + Math.random() * volatility;
    const low = Math.min(open, close) - Math.random() * volatility;
    const volume = Math.floor(Math.random() * 1000000) + 500000;

    data.push({
      timestamp,
      open: Number(open.toFixed(6)),
      high: Number(high.toFixed(6)),
      low: Number(low.toFixed(6)),
      close: Number(close.toFixed(6)),
      volume
    });

    current = close;
  }

  // 更新当前价格统计
  if (data.length > 0) {
    const latest = data[data.length - 1];
    const previous = data[data.length - 2] || latest;
    currentPrice.value = latest.close;
    priceChange.value = latest.close - previous.close;
    priceChangePercent.value = previous.close !== 0 ? (priceChange.value / previous.close) * 100 : 0;

    // 计算24小时高低点
    const highs = data.map(d => d.high);
    const lows = data.map(d => d.low);
    const volumes = data.map(d => d.volume);

    high24h.value = Math.max(...highs);
    low24h.value = Math.min(...lows);
    volume24h.value = volumes.reduce((sum, vol) => sum + vol, 0);
  }

  return data;
};

// 生成不同周期的数据
const generateDataByTimeframe = (timeframe) => {
  const now = Date.now();
  let data = [];
  let basePrice = 1 + Math.random() * 0.5; // 基础价格 0.0001-0.00015

  switch (timeframe) {
    case "1M":
      data = generateKlineData(basePrice, 60); // 60根1分钟K线
      break;
    case "5M":
      data = generateKlineData(basePrice, 48); // 48根5分钟K线 (4小时)
      break;
    case "15M":
      data = generateKlineData(basePrice, 32); // 32根15分钟K线 (8小时)
      break;
    case "30M":
      data = generateKlineData(basePrice, 48); // 48根30分钟K线 (24小时)
      break;
    case "1H":
      data = generateKlineData(basePrice, 48); // 48根1小时K线 (2天)
      break;
    case "4H":
      data = generateKlineData(basePrice, 42); // 42根4小时K线 (7天)
      break;
    case "1D":
      data = generateKlineData(basePrice, 30); // 30根日线 (1个月)
      break;
    case "1W":
      data = generateKlineData(basePrice, 52); // 52根周线 (1年)
      break;
    default:
      data = generateKlineData(basePrice, 48);
  }

  return data;
};

// 切换时间周期
const changeTimeframe = (timeframe) => {
  active.value = timeframe;
  const newData = generateDataByTimeframe(timeframe);
  chart.applyNewData(newData);
};

// 计算图表高度
const calculateChartHeight = () => {
  const baseHeight = 200; // K线图基础高度
  const indicatorHeight = 80; // 每个技术指标的高度
  const minHeight = 300; // 最小高度
  const maxHeight = 600; // 最大高度

  const indicatorCount = selectedIndicators.value.length;
  const newHeight = Math.min(Math.max(baseHeight + indicatorCount * indicatorHeight, minHeight), maxHeight);
  chartHeight.value = newHeight;

  // 如果图表已初始化，需要重新调整大小
  if (chart) {
    setTimeout(() => {
      chart.resize();
    }, 50);
  }
};

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

onMounted(() => {
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

  // 设置固定图表高度，不再动态调整
  chartHeight.value = 400;

  // 加载初始数据
  const initialData = generateDataByTimeframe(active.value);
  chart.applyNewData(initialData);
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

    .chart {
      width: 100%;
      height: 100%;
      background: #0d0d0d;
      border-radius: 8px;
      display: block; /* 确保块级显示 */
      overflow: hidden; /* 防止溢出 */
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
          height: 80px;
          background: #0d0d0d;
          border-radius: 6px;
          overflow: hidden;
          position: relative;

          // 成交量显示
          &.volume-display {
            display: flex;
            align-items: flex-end;
            gap: 2px;
            padding: 4px;

            .volume-bar {
              flex: 1;
              background: #65c281;
              min-height: 2px;
              border-radius: 1px;
            }
          }

          // MACD显示
          &.macd-display {
            position: relative;
            padding: 8px;

            .macd-line {
              height: 2px;
              margin: 4px 0;
              border-radius: 1px;

              &.macd {
                background: #4a9eff;
              }

              &.signal {
                background: #ff6b6b;
              }
            }

            .macd-histogram {
              display: flex;
              align-items: center;
              gap: 2px;
              height: 40px;

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
          }

          // RSI显示
          &.rsi-display {
            padding: 8px;

            .rsi-line {
              height: 2px;
              background: linear-gradient(90deg, #ff3b69 0%, #ffaa00 50%, #65c281 100%);
              margin: 20px 0;
              border-radius: 1px;
            }

            .rsi-zones {
              display: flex;
              justify-content: space-between;
              font-size: 10px;
              color: #666;

              .rsi-zone {
                padding: 2px 6px;
                border-radius: 3px;

                &.overbought {
                  background: rgba(255, 59, 105, 0.2);
                  color: #ff3b69;
                }

                &.oversold {
                  background: rgba(101, 194, 129, 0.2);
                  color: #65c281;
                }
              }
            }
          }
        }
      }
    }
  }
}
</style>