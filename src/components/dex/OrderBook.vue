<template>
    <div class="ob">
      <!-- header -->
      <div class="ob__head">
        <div class="ob__title">
          <span class="ob__badge">DEPTH</span>
          <span class="ob__name">Order Book</span>
        </div>
      </div>

	  <div v-if="error" class="ob__status">{{ error }}</div>
  
      <!-- column header -->
      <div class="ob__cols">
        <div class="c price">Price ({{ quoteSymbol || "—" }})</div>
        <div class="c amount">Amount ({{ baseSymbol || "—" }})</div>
      </div>
  
      <!-- sells (ask) -->
      <div class="ob__side ob__side--sell">
    <div
      v-for="(r, i) in askSlots"
      :key="'ask-' + i"
      class="ob__row"
      :class="{ 'ob__row--ghost': !r }"
    >
      <div v-if="r" class="ob__bar ob__bar--sell" :style="{ width: r.bar + '%' }"></div>
      <div class="cell price sell">{{ r ? r.p : "" }}</div>
      <div class="cell amount">{{ r ? r.a : "" }}</div>
    </div>
      </div>
  
      <!-- mid price -->
      <div class="ob__mid">
        <div class="ob__midLeft">
          <span class="lbl">Last</span>
          <span class="px" :class="midUp ? 'up' : 'down'">
            {{ midPriceDisplay }}
          </span>
        </div>
        <div class="ob__midRight">
		  <span class="chip">Ask x{{ topN }}</span>
          <span class="dot"></span>
		  <span class="chip">Bid x{{ topN }}</span>
        </div>
      </div>
  
      <!-- buys (bid) -->
      <div class="ob__side ob__side--buy">
		<div
			v-for="(r, i) in bidSlots"
			:key="'bid-' + i"
			class="ob__row"
			:class="{ 'ob__row--ghost': !r }"
		>
			<div v-if="r" class="ob__bar ob__bar--buy" :style="{ width: r.bar + '%' }"></div>
			<div class="cell price buy">{{ r ? r.p : "" }}</div>
			<div class="cell amount">{{ r ? r.a : "" }}</div>
		</div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { computed, onBeforeUnmount, onMounted, ref, toRefs, watch } from "vue";
  import { formatUnits, isAddress } from "ethers";

  import { callDex } from "@/lib/dex";
  
  const props = defineProps({
    walletAddress: { type: String, default: "" },
    baseAddress: { type: String, default: "" }, // ✅ 父组件传入，赋值到 DOGE
    baseSymbol: { type: String, default: "" },
    quoteSymbol: { type: String, default: "" },
    quoteDecimals: { type: Number, default: 18 },
    baseDecimals: { type: Number, default: 18 },
    topN: { type: Number, default: 5 },
    refreshMs: { type: Number, default: 2500 },
  });

  const { walletAddress, baseAddress, baseSymbol, quoteSymbol, quoteDecimals, baseDecimals, topN, refreshMs } =
	toRefs(props);
  
  /* ====== helpers ====== */
  function short(addr) {
    const a = String(addr || "");
    if (!a || a.length < 10) return a || "—";
    return `${a.slice(0, 6)}…${a.slice(-4)}`;
  }
  
  const loading = ref(false);
  const error = ref("");

  const midPriceRaw = ref(0n);
  const prevMidRaw = ref(0n);

  const asks = ref([]); // { p: string, a: string, bar: number }
  const bids = ref([]);

  let timer;

  function fmtUnitsSafe(v, d) {
    try {
      const s = formatUnits(v ?? 0n, d ?? 18);
      if (!s.includes(".")) return s;
      const [a, b] = s.split(".");
      return `${a}.${(b || "").slice(0, 6)}`.replace(/\.$/, "");
    } catch {
      return "0";
    }
  }

  const midPriceDisplay = computed(() => fmtUnitsSafe(midPriceRaw.value, quoteDecimals.value));
  
  const midUp = computed(() => midPriceRaw.value >= prevMidRaw.value);

  const slotCount = computed(() => {
    const n = Number(topN.value);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 5;
  });

  // 固定显示 topN 行：数量不足时用不可见占位行补齐，避免 0 值与布局抖动
  const askSlots = computed(() => {
    const n = slotCount.value;
    const rows = (asks.value || []).slice(0, n);
    const slots = Array.from({ length: n }, () => null);
    for (let i = 0; i < rows.length; i++) {
      slots[n - rows.length + i] = rows[i];
    }
    return slots;
  });

  const bidSlots = computed(() => {
    const n = slotCount.value;
    const rows = (bids.value || []).slice(0, n);
    const slots = Array.from({ length: n }, () => null);
    for (let i = 0; i < rows.length; i++) {
      slots[i] = rows[i];
    }
    return slots;
  });

  async function refreshDepth() {
    const base = String(baseAddress.value || "").trim();
    if (!isAddress(base)) {
      asks.value = [];
      bids.value = [];
      return;
    }

    loading.value = true;
    error.value = "";
    try {
      const depth = await callDex("getOrderBookDepthFor", base, BigInt(topN.value));
      const last = await callDex("getLastPriceFor", base);

      prevMidRaw.value = midPriceRaw.value;
      midPriceRaw.value = BigInt(last);

      const bidPrices = depth?.[0] || [];
      const bidAmounts = depth?.[1] || [];
      const askPrices = depth?.[2] || [];
      const askAmounts = depth?.[3] || [];

      const bidRowsRaw = (bidPrices || [])
      .map((p, i) => ({ p: BigInt(p), a: BigInt(bidAmounts?.[i] ?? 0) }))
      .filter(r => r.p > 0n && r.a > 0n);
      const askRowsRaw = (askPrices || [])
      .map((p, i) => ({ p: BigInt(p), a: BigInt(askAmounts?.[i] ?? 0) }))
      .filter(r => r.p > 0n && r.a > 0n);

    // 统一排序：价格从高到低（asks 顶部更高价、靠近中线的是最低价 ask；bids 靠近中线的是最高价 bid）
    bidRowsRaw.sort((a, b) => (a.p === b.p ? 0 : a.p > b.p ? -1 : 1));
    askRowsRaw.sort((a, b) => (a.p === b.p ? 0 : a.p > b.p ? -1 : 1));

      const maxAmount = [...bidRowsRaw.map(r => r.a), ...askRowsRaw.map(r => r.a)].reduce(
			(m, v) => (v > m ? v : m),
			0n
		);

      const toBar = a => {
        if (maxAmount <= 0n) return 0;
        const pct = Number((a * 10000n) / maxAmount) / 100;
        return Math.max(0, Math.min(100, pct));
      };

      bids.value = bidRowsRaw.map(r => ({
        p: fmtUnitsSafe(r.p, quoteDecimals.value),
        a: fmtUnitsSafe(r.a, baseDecimals.value),
        bar: toBar(r.a),
      }));

      asks.value = askRowsRaw.map(r => ({
        p: fmtUnitsSafe(r.p, quoteDecimals.value),
        a: fmtUnitsSafe(r.a, baseDecimals.value),
        bar: toBar(r.a),
      }));
    } catch (e) {
      error.value = e?.shortMessage || e?.message || "Failed to load order book";
      asks.value = [];
      bids.value = [];
    } finally {
      loading.value = false;
    }
  }

  onMounted(async () => {
    await refreshDepth();
    timer = window.setInterval(refreshDepth, Math.max(800, Number(refreshMs.value) || 2500));
  });

  watch(
    () => [baseAddress.value, topN.value, quoteDecimals.value, baseDecimals.value],
    async () => {
      await refreshDepth();
    }
  );

  onBeforeUnmount(() => {
    if (timer) window.clearInterval(timer);
  });
  </script>

<style lang="scss" scoped>
.ob {
--bg: #0b0f14;
--panel2: rgba(255, 255, 255, 0.04);
--text: rgba(255, 255, 255, 0.92);
--muted: rgba(255, 255, 255, 0.55);

background: radial-gradient(900px 520px at 15% 0%, rgba(0, 208, 132, 0.12), transparent 55%),
            radial-gradient(820px 520px at 95% 5%, rgba(255, 59, 105, 0.12), transparent 60%),
            var(--bg);
border: 1px solid rgba(255, 255, 255, 0.09);
border-radius: 14px;
padding: 14px;
color: var(--text);
width: 100%;
max-width: none;
  min-width: 0;
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.mono {
font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

.ob__head {
display: flex;
justify-content: space-between;
gap: 12px;
margin-bottom: 10px;
  flex-wrap: wrap;
}

.ob__title {
display: flex;
align-items: center;
gap: 10px;
}

.ob__badge {
padding: 4px 8px;
border-radius: 999px;
font-weight: 900;
font-size: 11px;
letter-spacing: 0.12em;
background: linear-gradient(90deg, rgba(0, 208, 132, 0.22), rgba(86, 195, 255, 0.16));
border: 1px solid rgba(255, 255, 255, 0.10);
}

.ob__name {
font-size: 15px;
font-weight: 900;
}


.ob__cols,
.ob__side,
.ob__mid {
  flex: 0 0 auto;
}

.ob__side {
  min-width: 0;
}

/* column header (2 cols) */
.ob__cols {
display: grid;
grid-template-columns: 1.2fr 1fr;
padding: 8px 10px;
border: 1px solid rgba(255, 255, 255, 0.08);
background: rgba(255, 255, 255, 0.04);
border-radius: 12px;
margin-bottom: 10px;

.c {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.55);
    font-weight: 800;
    letter-spacing: 0.04em;
}
.price { text-align: left; }
.amount { text-align: right; }
}

.ob__side {
display: flex;
flex-direction: column;
gap: 6px;
}

.ob__side--buy {
  margin-top: 0;
}

.ob__status {
  margin: 10px 0;
  padding: 10px;
  border-radius: 12px;
  border: 1px solid rgba(255, 110, 110, 0.22);
  background: rgba(255, 110, 110, 0.10);
  color: rgba(255, 210, 210, 0.92);
  font-size: 12px;
  font-weight: 800;
  word-break: break-word;
}

.ob__empty {
  padding: 10px;
  border-radius: 12px;
  border: 1px dashed rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.62);
  text-align: center;
  font-weight: 800;
}

/* row (2 cols) */
.ob__row {
position: relative;
display: grid;
grid-template-columns: 1.2fr 1fr;
align-items: center;
padding: 6px 10px;
  box-sizing: border-box;
  height: calc(40px * 3 / 3);
border-radius: 12px;
background: rgba(255, 255, 255, 0.03);
border: 1px solid rgba(255, 255, 255, 0.06);
overflow: hidden;
cursor: pointer;
transition: transform 0.12s ease, border-color 0.12s ease, background 0.12s ease;
}

.ob__row--ghost {
  opacity: 1;
  pointer-events: none;
}

.ob__row--ghost .cell {
  visibility: hidden;
}

.ob__row:hover {
transform: translateY(-1px);
border-color: rgba(255, 255, 255, 0.12);
background: rgba(255, 255, 255, 0.05);
}

/* depth bar */
.ob__bar {
position: absolute;
top: 0;
bottom: 0;
right: 0;
opacity: 0.14;
pointer-events: none;
}

.ob__bar--sell {
background: linear-gradient(90deg, transparent 0%, rgba(255, 59, 105, 0.55) 100%);
}

.ob__bar--buy {
background: linear-gradient(90deg, transparent 0%, rgba(0, 208, 132, 0.55) 100%);
}

.cell {
position: relative;
z-index: 1;
font-size: 12px;
font-weight: 700;
}

.cell.price { text-align: left; }
.cell.amount { text-align: right; color: rgba(255, 255, 255, 0.82); font-weight: 650; }

.sell { color: rgba(255, 59, 105, 0.95); }
.buy { color: rgba(0, 208, 132, 0.95); }

/* mid */
.ob__mid {
margin: 10px 0;
padding: 10px 12px;
border-radius: 14px;
border: 1px solid rgba(255, 255, 255, 0.10);
background: rgba(0, 0, 0, 0.30);
display: flex;
align-items: center;
justify-content: space-between;
gap: 10px;
}

.ob__midLeft {
display: flex;
align-items: baseline;
gap: 10px;

.lbl {
  font-size: 16px;
    color: rgba(255, 255, 255, 0.55);
    font-weight: 800;
    letter-spacing: 0.04em;
}

.px {
    font-size: 16px;
    font-weight: 900;
    letter-spacing: 0.02em;
}

.px.up { color: rgba(0, 208, 132, 0.95); }
.px.down { color: rgba(255, 59, 105, 0.95); }
}

.ob__midRight {
display: flex;
align-items: center;
gap: 10px;

.chip {
    font-size: 11px;
    font-weight: 900;
    color: rgba(255, 255, 255, 0.78);
    padding: 6px 10px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.10);
}

.dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: rgba(86, 195, 255, 0.85);
    box-shadow: 0 0 14px rgba(86, 195, 255, 0.35);
}
}

/* footer */
.ob__foot {
margin-top: 12px;
display: grid;
grid-template-columns: 1fr 1fr 1fr;
gap: 10px;
}

.ob__footItem {
padding: 10px 12px;
border-radius: 12px;
background: rgba(255, 255, 255, 0.04);
border: 1px solid rgba(255, 255, 255, 0.08);
display: flex;
flex-direction: column;
gap: 4px;

.k {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.55);
    font-weight: 800;
    letter-spacing: 0.04em;
}
.v {
    font-size: 13px;
    font-weight: 900;
    color: rgba(255, 255, 255, 0.90);
}
}
</style>
