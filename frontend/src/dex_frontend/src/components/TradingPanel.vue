<template>
  <div class="tp">
    <!-- Header -->
    <div class="tp__head">
      <div class="tp__title">
        <div class="tp__badge">TRADE</div>
        <div class="tp__name">Trade</div>
      </div>
    </div>

    <!-- Top Tabs: Market / Limit -->
    <div class="tp__tabs">
      <button
        class="tp__tab"
        :class="{ active: orderType === 'market' }"
        @click="orderType = 'market'"
      >
        Market
      </button>
      <button
        class="tp__tab"
        :class="{ active: orderType === 'limit' }"
        @click="orderType = 'limit'"
      >
        Limit
      </button>
    </div>

    <!-- Second Tabs: Buy / Sell -->
    <div class="tp__tabs tp__tabs--secondary">
      <button
        class="tp__tab tp__tab--buy"
        :class="{ active: side === 'buy' }"
        @click="side = 'buy'"
      >
        Buy
      </button>
      <button
        class="tp__tab tp__tab--sell"
        :class="{ active: side === 'sell' }"
        @click="side = 'sell'"
      >
        Sell
      </button>
    </div>

    <!-- Form -->
    <div class="tp__card">
      <div class="tp__cardHead">
        <div class="tp__pair">
          <span class="tp__pairBase">{{ baseSymbol || "BASE" }}</span>
          <span class="tp__pairSlash">/</span>
          <span class="tp__pairQuote">{{ quoteSymbol || "QUOTE" }}</span>
        </div>

        <div class="tp__chip" :class="side === 'buy' ? 'buy' : 'sell'">
          {{ side === 'buy' ? 'BUY' : 'SELL' }}
        </div>
      </div>

      <!-- Limit price row (only for limit) -->
      <div v-if="orderType === 'limit'" class="tp__row">
        <label class="tp__label">
          Price <span class="tp__hint">({{ quoteSymbol || 'QUOTE' }} per {{ baseSymbol || 'BASE' }})</span>
        </label>
        <div class="tp__inputWrap">
          <input
            v-model="limitPrice"
            class="tp__input"
            type="text"
            placeholder="0.0"
          />
          <div class="tp__unit">{{ quoteSymbol || "QUOTE" }}</div>
        </div>
        <div class="tp__subhint">
          {{ side === "buy" ? "Fills when market price ≤ your limit" : "Fills when market price ≥ your limit" }}
        </div>
      </div>

      <!-- Amount row -->
      <div class="tp__row">
        <label class="tp__label">
          Amount
          <span class="tp__hint">
            ({{ amountUnitLabel }})
          </span>
        </label>

        <div class="tp__inputWrap">
          <input v-model="amount" class="tp__input" type="text" placeholder="0.0" />
          <div class="tp__unit">{{ amountUnit }}</div>
        </div>

        <div class="tp__subhint">
          {{ amountHelp }}
        </div>
      </div>

      <!-- Action -->
      <button class="tp__cta" :class="side" :disabled="busy" @click="submit">
        {{ busy ? "Submitting…" : ctaText }}
      </button>

      <div v-if="error" class="tp__fineprint tp__fineprint--error">{{ error }}</div>
      <div v-else-if="status" class="tp__fineprint">{{ status }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, toRefs } from "vue";
import { isAddress, parseUnits } from "ethers";

import { sendDex } from "../lib/dex";

/**
 * 组件入参：
 * - walletAddress: 用户钱包地址
 * - baseAddress: base 币地址（这里作为 DEX 接口参数 base）
 * - baseSymbol: base 符号
 */
const props = defineProps({
  walletAddress: { type: String, default: "" },
  baseAddress: { type: String, default: "" },
  baseSymbol: { type: String, default: "" },
  quoteSymbol: { type: String, default: "" },
  baseDecimals: { type: Number, default: 18 },
  quoteDecimals: { type: Number, default: 18 },
});

const { walletAddress, baseAddress, baseSymbol, quoteSymbol, baseDecimals, quoteDecimals } = toRefs(props);

/* ====== layout placeholder state ====== */
const orderType = ref("market"); // 'market' | 'limit'
const side = ref("buy"); // 'buy' | 'sell'

const amount = ref("");
const limitPrice = ref("");      // 仅限价使用

const busy = ref(false);
const error = ref("");
const status = ref("");

function short(addr) {
  const a = String(addr || "");
  if (!a || a.length < 10) return a || "—";
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

// 你的特殊单位规则：
// - 市价买入：Quote
// - 市价卖出：Base
// - 限价买/卖：价格用 Quote，数量用 Base
const amountUnit = computed(() => {
  if (orderType.value === "market") return side.value === "buy" ? (quoteSymbol.value || "QUOTE") : (baseSymbol.value || "BASE");
  return baseSymbol.value || "BASE";
});

const amountUnitLabel = computed(() => {
  if (orderType.value === "market") {
    return side.value === "buy"
		? `Spend (${quoteSymbol.value || "QUOTE"})`
		: `Sell (${baseSymbol.value || "BASE"})`;
  }
  return `Amount (${baseSymbol.value || "BASE"})`;
});

const amountHelp = computed(() => {
  if (orderType.value === "market") {
    return side.value === "buy"
      ? `Enter how much ${quoteSymbol.value || "QUOTE"} you want to spend.`
      : `Enter how much ${baseSymbol.value || "BASE"} you want to sell.`;
  }
  return `Set price in ${quoteSymbol.value || "QUOTE"} and amount in ${baseSymbol.value || "BASE"}.`;
});

const ctaText = computed(() => {
	const buySell = side.value === "buy" ? "Buy" : "Sell";
	if (orderType.value === "limit") return `Place Limit ${buySell}`;
	return `Place Market ${buySell}`;
});

function parseAmountOrThrow(input, decimals, label) {
  const s = String(input || "").trim();
  if (!s) throw new Error(`${label} is required`);
  const v = parseUnits(s, decimals ?? 18);
  if (v <= 0n) throw new Error(`${label} must be greater than 0`);
  return v;
}

async function submit() {
  error.value = "";
  status.value = "";
  busy.value = true;
  try {
    const base = String(baseAddress.value || "").trim();
	if (!isAddress(base)) throw new Error("Invalid token address");

    let tx;
    if (orderType.value === "market") {
      if (side.value === "buy") {
    const maxQuoteIn = parseAmountOrThrow(amount.value, quoteDecimals.value, "Amount");
    status.value = "Submitting market buy…";
        tx = await sendDex("marketBuyFor", base, maxQuoteIn);
      } else {
    const amountBase = parseAmountOrThrow(amount.value, baseDecimals.value, "Amount");
    status.value = "Submitting market sell…";
        tx = await sendDex("marketSellFor", base, amountBase);
      }
    } else {
    const price = parseAmountOrThrow(limitPrice.value, quoteDecimals.value, "Price");
    const amountBase = parseAmountOrThrow(amount.value, baseDecimals.value, "Amount");
      const method = side.value === "buy" ? "limitBuyFor" : "limitSellFor";
    status.value = `Submitting ${side.value === "buy" ? "limit buy" : "limit sell"}…`;
      tx = await sendDex(method, base, price, amountBase);
    }

  status.value = `Tx sent: ${tx.hash}`;
    await tx.wait();
  status.value = "Confirmed";
  } catch (e) {
    error.value = e?.shortMessage || e?.message || String(e);
  } finally {
    busy.value = false;
  }
}
</script>

<style lang="scss" scoped>
.tp {
  --bg: #0b0f14;
  --panel: rgba(255, 255, 255, 0.06);
  --panel2: rgba(255, 255, 255, 0.04);
  --line: rgba(255, 255, 255, 0.10);
  --text: rgba(255, 255, 255, 0.90);
  --muted: rgba(255, 255, 255, 0.55);

  --green: #00d084;
  --pink: #ff3b69;
  --cyan: #56c3ff;
  --glow: 0 0 18px rgba(0, 208, 132, 0.25);

  background: radial-gradient(1200px 700px at 20% 0%, rgba(0, 208, 132, 0.10), transparent 55%),
              radial-gradient(900px 600px at 90% 10%, rgba(255, 59, 105, 0.10), transparent 60%),
              var(--bg);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 16px;
  color: var(--text);
  width: 100%;
  max-width: none;
	min-width: 0;
	overflow: hidden;
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

.tp__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 14px;
	flex-wrap: wrap;
}

.tp__title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.tp__badge {
  padding: 4px 8px;
  border-radius: 999px;
  font-weight: 800;
  font-size: 11px;
  letter-spacing: 0.12em;
  background: linear-gradient(90deg, rgba(0, 208, 132, 0.22), rgba(86, 195, 255, 0.18));
  border: 1px solid rgba(255, 255, 255, 0.10);
  color: rgba(255, 255, 255, 0.92);
}

.tp__name {
  font-size: 16px;
  font-weight: 800;
}

.tp__tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 10px;
}

.tp__tabs--secondary {
  grid-template-columns: 1fr 1fr;
  margin-bottom: 14px;
}

.tp__tab {
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.10);
  color: rgba(255, 255, 255, 0.70);
  font-weight: 800;
  letter-spacing: 0.06em;
  cursor: pointer;
  transition: transform 0.12s ease, border-color 0.12s ease, background 0.12s ease, color 0.12s ease;
}

.tp__tab:hover {
  transform: translateY(-1px);
  border-color: rgba(255, 255, 255, 0.18);
  color: rgba(255, 255, 255, 0.92);
}

.tp__tab.active {
  background: linear-gradient(90deg, rgba(0, 208, 132, 0.22), rgba(86, 195, 255, 0.12));
  border-color: rgba(0, 208, 132, 0.40);
  box-shadow: var(--glow);
  color: rgba(255, 255, 255, 0.95);
}

.tp__tab--buy.active {
  background: linear-gradient(90deg, rgba(0, 208, 132, 0.30), rgba(0, 208, 132, 0.14));
  border-color: rgba(0, 208, 132, 0.45);
}

.tp__tab--sell.active {
  background: linear-gradient(90deg, rgba(255, 59, 105, 0.28), rgba(255, 59, 105, 0.10));
  border-color: rgba(255, 59, 105, 0.45);
  box-shadow: 0 0 18px rgba(255, 59, 105, 0.22);
}

.tp__card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.10);
  border-radius: 14px;
  padding: 14px;
}

.tp__cardHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
}

.tp__pair {
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-weight: 900;
  letter-spacing: 0.02em;
}

.tp__pairBase {
  color: rgba(255, 255, 255, 0.95);
  font-size: 14px;
}

.tp__pairSlash {
  color: rgba(255, 255, 255, 0.35);
  font-size: 12px;
}

.tp__pairQuote {
  color: rgba(255, 255, 255, 0.75);
  font-size: 12px;
}

.tp__chip {
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 900;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
}

.tp__chip.buy {
  border-color: rgba(0, 208, 132, 0.35);
  color: rgba(0, 208, 132, 0.95);
}

.tp__chip.sell {
  border-color: rgba(255, 59, 105, 0.35);
  color: rgba(255, 59, 105, 0.95);
}

.tp__row {
  margin-top: 12px;
}

.tp__label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.72);
  margin-bottom: 6px;
}

.tp__hint {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.45);
  font-weight: 600;
}

.tp__inputWrap {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 10px;
}

.tp__input {
  width: 100%;
  padding: 12px 12px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.10);
  color: rgba(255, 255, 255, 0.92);
  outline: none;
  transition: border-color 0.12s ease, box-shadow 0.12s ease;
}

.tp__input:focus {
  border-color: rgba(86, 195, 255, 0.45);
  box-shadow: 0 0 0 3px rgba(86, 195, 255, 0.10);
}

.tp__unit {
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.06em;
  color: rgba(255, 255, 255, 0.70);
  padding: 8px 10px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.10);
  white-space: nowrap;
}

.tp__subhint {
  margin-top: 6px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.50);
  line-height: 1.35;
}

.tp__cta {
  width: 100%;
  margin-top: 14px;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  font-weight: 900;
  letter-spacing: 0.06em;
  cursor: pointer;
  transition: transform 0.12s ease, box-shadow 0.12s ease, border-color 0.12s ease, background 0.12s ease;
}

.tp__cta.buy {
  background: linear-gradient(90deg, rgba(0, 208, 132, 0.85), rgba(86, 195, 255, 0.55));
  color: rgba(0, 0, 0, 0.90);
  box-shadow: 0 10px 30px rgba(0, 208, 132, 0.12);
}

.tp__cta.sell {
  background: linear-gradient(90deg, rgba(255, 59, 105, 0.80), rgba(255, 59, 105, 0.45));
  color: rgba(255, 255, 255, 0.95);
  box-shadow: 0 10px 30px rgba(255, 59, 105, 0.10);
}

.tp__cta:hover {
  transform: translateY(-1px);
  border-color: rgba(255, 255, 255, 0.18);
}

.tp__cta:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.tp__fineprint {
  margin-top: 10px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.42);
}

.tp__fineprint--error {
	color: rgba(255, 110, 110, 0.9);
	word-break: break-word;
}
</style>
