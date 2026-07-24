<template>
  <div class="kline-wrapper">
    <div class="toolbar">
      <button
        v-for="tf in timeframes"
        :key="tf.value"
        :class="{ active: active === tf.value }"
        @click="changeTimeframe(tf.value)"
      >
        {{ tf.label }}
      </button>

      <!-- <div class="price">
        <span class="label">最新价</span>
        <span class="value">
          {{ latestPrice !== null ? latestPrice : '—' }}
        </span>
      </div> -->
    </div>

    <div id="chart_box" class="chart"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { init } from 'klinecharts';
import { ethers } from 'ethers';

/* ========= props ========= */
const props = defineProps({
    baseAddress: {
    type: String,
    required: true, // 直接当 base token address 用
  },
})

/* ========= timeframe ========= */
const timeframeConfigs = {
  '5S': { label: '5s', seconds: 5 },
  '1M': { label: '1m', seconds: 60 },
  '5M': { label: '5m', seconds: 300 },
  '15M': { label: '15m', seconds: 900 },
  '1H': { label: '1h', seconds: 3600 },
}

const timeframes = Object.entries(timeframeConfigs).map(
  ([value, cfg]) => ({ value, label: cfg.label })
)

const active = ref('5M')

/* ========= chart ========= */
let chart = null
let hasRenderedData = false

/* ========= DEX / Contract ========= */
const DEX = '0x887D9Af1241a176107d31Bb3C69787DFff6dbaD8'
const DEX_ABI = [
  "function getLastPriceFor(address base) view returns (uint256)",
]

const CHART_START_TIMESTAMP = new Date('2026-02-08T00:00:00').getTime()

let provider = null
let dex = null

const ensureDex = async () => {
  if (dex) return
  if (!window.ethereum) throw new Error('MetaMask not found')
  provider = new ethers.BrowserProvider(window.ethereum)
  dex = new ethers.Contract(DEX, DEX_ABI, provider)
}

/* ========= price state ========= */
const latestPrice = ref(null)

/* ========= K-line state ========= */
const candles = ref([])
const lastCandle = ref(null)
const startTimestamp = ref(null)
const priceHistory = ref([])

/* ========= demo data ========= */
const buildDemoTicks = () => {
  let T = 1000
  const startRaw = Date.now() - T * 20
  const start = Math.ceil(startRaw / 5000) * 5000
  const ticks = [
    {timestamp: start, price: 0.},
    {timestamp: start + T , price: 0.93},
    {timestamp: start + T * 2, price: 0.87},
    {timestamp: start + T * 3, price: 0.46},
    {timestamp: start + T * 4, price: 0.22},
    {timestamp: start + T * 5, price: 0.22},
    {timestamp: start + T * 6, price: 0.22},
    {timestamp: start + T * 7, price: 0.22},
    {timestamp: start + T * 8, price: 0.22},
    {timestamp: start + T * 9, price: 0.22},
    {timestamp: start + T * 10, price: 0.22},
    {timestamp: start + T * 11, price: 0.90},
    {timestamp: start + T * 12, price: 0.20},
    {timestamp: start + T * 13, price: 0.22},
    {timestamp: start + T * 14, price: 0.90},
    {timestamp: start + T * 15, price: 0.90},
    {timestamp: start + T * 16, price: 0.6},
    {timestamp: start + T * 17, price: 0.6},
    {timestamp: start + T * 18, price: 0.5},
    {timestamp: start + T * 19, price: 0.6},
    {timestamp: start + T * 20, price: 0.6}
  ]

//   console.log('demo ticks: ', ticks)
  return ticks
}

const seedDemoData = () => {
  const demoTicks = buildDemoTicks()
  priceHistory.value = demoTicks
  latestPrice.value = demoTicks[demoTicks.length - 1].price
  rebuildCandlesFromHistory()
  renderFullChart()
}

/* ========= fetch price ========= */
const fetchLatestPrice = async () => {
  await ensureDex()
//   console.log('props: ', props.baseAddress)
  const raw = await dex.getLastPriceFor(props.baseAddress)
//   console.log('raw data is ',raw)
  return Number(ethers.formatUnits(raw, 18))
}

/* ========= tick → candle ========= */
const pushTickToCandle = (price, nowMs) => {
  const interval = timeframeConfigs[active.value].seconds * 1000

  if (!startTimestamp.value) {
    startTimestamp.value = CHART_START_TIMESTAMP
  }

  const bucket =
    Math.floor((nowMs - startTimestamp.value) / interval) * interval +
    startTimestamp.value

  if (!lastCandle.value || lastCandle.value.timestamp !== bucket) {
    if (lastCandle.value) {
      candles.value.push(lastCandle.value)
    }

    lastCandle.value = {
      timestamp: bucket,
      open: price,
      high: price,
      low: price,
      close: price,
      volume: 0,
    }
  } else {
    lastCandle.value.high = Math.max(lastCandle.value.high, price)
    lastCandle.value.low = Math.min(lastCandle.value.low, price)
    lastCandle.value.close = price
  }
}

const rebuildCandlesFromHistory = () => {
  const history = priceHistory.value
  if (!history.length) {
    candles.value = []
    lastCandle.value = null
    startTimestamp.value = CHART_START_TIMESTAMP
    return
  }

  const sorted = [...history].sort((a, b) => a.timestamp - b.timestamp)
  candles.value = []
  lastCandle.value = null
  startTimestamp.value = CHART_START_TIMESTAMP

  sorted.forEach(tick => {
    pushTickToCandle(tick.price, tick.timestamp)
  })
}

function normalizeData(list) {
  return list.map(item => ({
    timestamp: Number(item.timestamp),
    open: Number(item.open),
    high: Number(item.high),
    low: Number(item.low),
    close: Number(item.close),
    volume: Number(item.volume ?? 0)
  }))
}

/* ========= update chart ========= */
const renderFullChart = () => {
  if (!chart) return
  const data = [...candles.value]
  if (lastCandle.value) data.push(lastCandle.value)
  const data_norm = normalizeData(data)
  chart.applyNewData(data_norm)
  hasRenderedData = true
}

const renderLatestCandle = () => {
  if (!chart || !lastCandle.value) return
  if (!hasRenderedData) {
    renderFullChart()
    return
  }
  const [latest] = normalizeData([lastCandle.value])
  chart.updateData(latest)
}

/* ========= ticker ========= */
let tickTimer = null

const startTick = () => {
  stopTick()
  tickTimer = setInterval(async () => {
    const price = await fetchLatestPrice()
    const nowMs = Date.now()
    // console.log('fetched price: ', price, ' at ', new Date(nowMs).toLocaleTimeString())

    latestPrice.value = price
    priceHistory.value.push({ timestamp: nowMs, price })
    pushTickToCandle(price, nowMs)
    renderLatestCandle()
  }, 1000)
}

const stopTick = () => {
  if (tickTimer) clearInterval(tickTimer)
  tickTimer = null
}

/* ========= change timeframe ========= */
const changeTimeframe = (tf) => {
  active.value = tf
  rebuildCandlesFromHistory()
  renderFullChart()
}

/* ========= lifecycle ========= */
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
        labels: ['Time', 'Open', 'Close', 'High', 'Low', 'Volume'],
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

  seedDemoData()
  startTick()
})

// onUnmounted(() => {
//   stopTick()
//   chart?.dispose()
//   chart = null
//   hasRenderedData = false
// })
</script>

<style scoped>
.kline-wrapper {
  background: #0b0f14;
  border-radius: 12px;
  padding: 12px;
  color: #fff;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  flex: 0 0 auto;
}

button {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #fff;
  padding: 6px 10px;
  border-radius: 8px;
  cursor: pointer;
}

button.active {
  background: rgba(0, 208, 132, 0.25);
  border-color: rgba(0, 208, 132, 0.5);
}

.price {
  margin-left: auto;
  font-weight: bold;
}

.chart {
  width: 100%;
  flex: 1 1 auto;
  min-height: 520px;
}
</style>
