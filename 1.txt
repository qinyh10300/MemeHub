<template>
    <div class="lo">
      <!-- Header -->
      <div class="lo__head">
        <div class="lo__title">
          <span class="lo__badge">MY</span>
          <span class="lo__name">我的挂单</span>
        </div>
  
        <div class="lo__meta">
          <div class="row">
            <span class="k">Wallet</span>
            <span class="v mono">{{ short(walletAddress) }}</span>
          </div>
          <div class="row">
            <span class="k">Base</span>
            <span class="v mono">{{ short(baseAddress) }}</span>
          </div>
          <div class="row">
            <span class="k">Symbol</span>
            <span class="v mono">{{ baseSymbol || "—" }}</span>
          </div>
        </div>
      </div>
  
      <!-- Actions -->
      <div class="lo__actions">
        <button class="btn btn--primary" @click="refreshMyOrders" :disabled="disabled || txBusy">
          <span class="dot" aria-hidden="true"></span>
          刷新挂单
        </button>
        <div class="hint mono">{{ statusText }}</div>
      </div>
  
      <!-- List -->
      <div class="lo__list">
        <div v-if="sortedOrders.length === 0" class="empty">
          暂无挂单
        </div>
  
        <div v-for="o in sortedOrders" :key="String(o.id)" class="card">
          <!-- top line -->
          <div class="card__top">
            <div class="side" :class="o.sideLabel === 'BUY' ? 'buy' : 'sell'">
              {{ o.sideLabel === "BUY" ? "买入" : "卖出" }}
            </div>
  
            <div class="time mono">
              {{ fmtTime(o.timestamp) }}
            </div>
          </div>
  
          <!-- main fields -->
          <div class="grid">
            <div class="item">
              <div class="label">成交价 (USDT/{{ baseSymbol || "—" }})</div>
              <div class="value mono">{{ o.priceDisplay }}</div>
              <div class="sub">price (scaled 1e18)</div>
            </div>
  
            <div class="item">
              <div class="label">期望成交量 ({{ baseSymbol || "—" }})</div>
              <div class="value mono">{{ o.amountDisplay }}</div>
              <div class="sub">remaining: {{ o.remainingDisplay }}</div>
            </div>
  
            <div class="item">
              <div class="label">已成交量 ({{ baseSymbol || "—" }})</div>
              <div class="value mono">{{ o.filledDisplay }}</div>
              <div class="sub">active: {{ o.active ? "yes" : "no" }}</div>
            </div>
          </div>
  
          <!-- progress -->
          <div class="progress">
            <div class="progress__bar">
              <div class="progress__fill" :style="{ width: fillPct(o) + '%' }"></div>
            </div>
            <div class="progress__txt mono">
              {{ fillPct(o).toFixed(0) }}% filled
            </div>
          </div>
  
          <!-- ✅ cancel per order -->
          <button
            class="btn"
            style="margin-top: 10px; width: 100%;"
            @click="cancelOrderById(o.id)"
            :disabled="disabled || txBusy || !o.active"
          >
            取消 
            <!-- #{{ String(o.id) }} -->
          </button>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { computed, ref, watch, onUnmounted } from "vue";
  import { ethers } from "ethers";
  
  const props = defineProps({
    walletAddress: { type: String, default: "" },
    baseAddress: { type: String, default: "" },
    baseSymbol: { type: String, default: "" },
  });
  
  const { walletAddress, baseAddress, baseSymbol } = props;
  
  /* ====== DEX config ====== */
  const DEX = "0x887D9Af1241a176107d31Bb3C69787DFff6dbaD8";
  
  // 这里按你的要求：baseAddress 赋值到 DOGE（即 base token address）
  const DOGE = computed(() => String(baseAddress || ""));
  
  const DEX_ABI = [
    "function cancelOrder(uint256 orderId)",
    "function getMyOpenOrdersFor(address base) view returns (tuple(uint256 id, address baseToken, uint8 side, uint256 price, uint256 amountBase, uint256 filledBase, uint256 remainingBase, uint256 timestamp, bool active)[])",
  ];
  
  /* ====== state ====== */
  const statusText = ref("ready");
  const txBusy = ref(false);
  
  const dogeDecimals = ref(18); // 默认 18；如果你的 base 不是 18，需要再接 ERC20.decimals()
  
  const myOrders = ref([]); // from chain
  
  const disabled = computed(() => !walletAddress || !baseAddress);
  
  const sortedOrders = computed(() => {
    return [...myOrders.value].sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
  });
  
  let provider = null;
  let signer = null;
  let dex = null;
  let pollTimer = null;
  
  /* ====== helpers ====== */
  function short(addr) {
    const a = String(addr || "");
    if (!a || a.length < 10) return a || "—";
    return `${a.slice(0, 6)}…${a.slice(-4)}`;
  }
  
  function fmtTime(ts) {
    const n = Number(ts);
    if (!Number.isFinite(n) || n <= 0) return "—";
    const d = new Date(n * 1000);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mi = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
  }
  
  function fillPct(o) {
    // 用 BigInt 更稳（避免浮点误差）
    const a = BigInt(o.amountBase || 0);
    const f = BigInt(o.filledBase || 0);
    if (a === 0n) return 0;
    const pct = Number((f * 10000n) / a) / 100; // 2位小数
    return Math.max(0, Math.min(100, pct));
  }
  
  async function ensureDex() {
    if (dex) return;
    if (!window.ethereum) throw new Error("MetaMask not found");
  
    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();
    dex = new ethers.Contract(DEX, DEX_ABI, signer);
  }
  
  /* ====== refresh: get my orders from contract ====== */
  async function refreshMyOrders() {
    if (disabled.value) {
      myOrders.value = [];
      return;
    }
  
    try {
      statusText.value = "loading...";
      await ensureDex();
  
      const base = DOGE.value;
      if (!base) {
        myOrders.value = [];
        statusText.value = "missing baseAddress";
        return;
      }
  
      const raw = await dex.getMyOpenOrdersFor(base); // OrderView[]
  
      myOrders.value = raw.map((o) => {
        const sideNum = Number(o.side); // BUY=0, SELL=1
  
        return {
          id: o.id,
          baseToken: o.baseToken,
          side: o.side,
          price: o.price,
          amountBase: o.amountBase,
          filledBase: o.filledBase,
          remainingBase: o.remainingBase,
          timestamp: o.timestamp,
          active: o.active,
  
          sideLabel: sideNum === 0 ? "BUY" : "SELL",
          priceDisplay: ethers.formatUnits(o.price, 18),
          amountDisplay: ethers.formatUnits(o.amountBase, dogeDecimals.value),
          filledDisplay: ethers.formatUnits(o.filledBase, dogeDecimals.value),
          remainingDisplay: ethers.formatUnits(o.remainingBase, dogeDecimals.value),
        };
      });
  
      statusText.value = `loaded: ${myOrders.value.length}`;
    } catch (e) {
      console.error(e);
      myOrders.value = [];
      statusText.value = `error: ${e?.message || e}`;
    }
  }
  
  /* ====== tx helpers (cancel) ====== */
  async function sendTx(buildTx, label) {
    if (disabled.value) return;
  
    try {
      txBusy.value = true;
      statusText.value = `${label}: sending...`;
      await ensureDex();
  
      const tx = await buildTx();
      await tx.wait();
  
      statusText.value = `✅ ${label} confirmed`;
      await refreshMyOrders();
    } catch (e) {
      console.error(e);
      statusText.value = `${label} error: ${e?.message || e}`;
    } finally {
      txBusy.value = false;
    }
  }
  
  // ✅ one-click cancel from list
  function cancelOrderById(orderId) {
    return sendTx(() => dex.cancelOrder(orderId), `Cancel Order #${String(orderId)}`);
  }
  
  /* ====== polling ====== */
  function startPolling() {
    stopPolling();
    pollTimer = setInterval(async () => {
      if (txBusy.value) return;
      await refreshMyOrders();
    }, 3000);
  }
  
  function stopPolling() {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = null;
  }
  
  watch(
    () => [walletAddress, baseAddress],
    async ([w, b]) => {
      stopPolling();
      myOrders.value = [];
  
      if (!w || !b) {
        statusText.value = "not ready";
        return;
      }
  
      await refreshMyOrders();
      startPolling();
    },
    { immediate: true }
  );
  
  onUnmounted(() => {
    stopPolling();
  });
  </script>
  
  <style lang="scss" scoped>
  .lo {
    --bg: #0b0f14;
    --panel: rgba(255, 255, 255, 0.06);
    --line: rgba(255, 255, 255, 0.10);
    --text: rgba(255, 255, 255, 0.92);
    --muted: rgba(255, 255, 255, 0.55);
  
    --green: #00d084;
    --pink: #ff3b69;
    --cyan: #56c3ff;
  
    background: radial-gradient(900px 520px at 15% 0%, rgba(0, 208, 132, 0.1), transparent 55%),
      radial-gradient(820px 520px at 95% 5%, rgba(255, 59, 105, 0.1), transparent 60%), var(--bg);
    border: 1px solid rgba(255, 255, 255, 0.09);
    border-radius: 14px;
    padding: 14px;
    color: var(--text);
    max-width: 680px;
  }
  
  .mono {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  }
  
  .lo__head {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
  }
  
  .lo__title {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .lo__badge {
    padding: 4px 10px;
    border-radius: 999px;
    font-weight: 900;
    font-size: 11px;
    letter-spacing: 0.12em;
    background: linear-gradient(90deg, rgba(86, 195, 255, 0.18), rgba(0, 208, 132, 0.16));
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .lo__name {
    font-size: 15px;
    font-weight: 900;
  }
  
  .lo__meta {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 240px;
  
    .row {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 10px;
      padding: 8px 10px;
  
      .k {
        font-size: 12px;
        color: var(--muted);
        font-weight: 800;
      }
      .v {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.88);
      }
    }
  }
  
  .lo__actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 12px;
  
    .hint {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.55);
    }
  }
  
  .btn {
    border-radius: 12px;
    padding: 10px 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.06);
    color: rgba(255, 255, 255, 0.88);
    font-weight: 900;
    font-size: 12px;
    cursor: pointer;
    transition: transform 0.12s ease, background 0.12s ease, border-color 0.12s ease, opacity 0.12s ease;
  
    &:hover:not(:disabled) {
      transform: translateY(-1px);
      border-color: rgba(255, 255, 255, 0.18);
      background: rgba(255, 255, 255, 0.09);
    }
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
  
  .btn--primary {
    background: linear-gradient(90deg, rgba(0, 208, 132, 0.22), rgba(86, 195, 255, 0.16));
    border-color: rgba(0, 208, 132, 0.22);
    display: inline-flex;
    align-items: center;
    gap: 10px;
  
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: rgba(86, 195, 255, 0.9);
      box-shadow: 0 0 14px rgba(86, 195, 255, 0.35);
    }
  }
  
  .lo__list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  .empty {
    padding: 16px;
    border-radius: 14px;
    border: 1px dashed rgba(255, 255, 255, 0.14);
    background: rgba(255, 255, 255, 0.03);
    color: rgba(255, 255, 255, 0.62);
    text-align: center;
    font-weight: 800;
  }
  
  .card {
    border-radius: 14px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(0, 0, 0, 0.28);
    padding: 12px;
  }
  
  .card__top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  
    .time {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.6);
    }
  }
  
  .side {
    font-size: 12px;
    font-weight: 950;
    letter-spacing: 0.06em;
    padding: 6px 10px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: rgba(255, 255, 255, 0.06);
  }
  
  .side.buy {
    color: rgba(0, 208, 132, 0.95);
    border-color: rgba(0, 208, 132, 0.25);
    background: rgba(0, 208, 132, 0.08);
  }
  
  .side.sell {
    color: rgba(255, 59, 105, 0.95);
    border-color: rgba(255, 59, 105, 0.25);
    background: rgba(255, 59, 105, 0.08);
  }
  
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 10px;
  }
  
  .item {
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.03);
    padding: 10px;
  
    .label {
      font-size: 11px;
      color: rgba(255, 255, 255, 0.55);
      font-weight: 900;
      letter-spacing: 0.04em;
      margin-bottom: 6px;
    }
    .value {
      font-size: 14px;
      font-weight: 950;
      color: rgba(255, 255, 255, 0.92);
    }
    .sub {
      margin-top: 6px;
      font-size: 11px;
      color: rgba(255, 255, 255, 0.45);
    }
  }
  
  .progress {
    margin-top: 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  
    .progress__bar {
      flex: 1;
      height: 10px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.08);
      overflow: hidden;
    }
  
    .progress__fill {
      height: 100%;
      border-radius: 999px;
      background: linear-gradient(90deg, rgba(0, 208, 132, 0.85), rgba(86, 195, 255, 0.75));
    }
  
    .progress__txt {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.62);
      min-width: 90px;
      text-align: right;
    }
  }
  </style>