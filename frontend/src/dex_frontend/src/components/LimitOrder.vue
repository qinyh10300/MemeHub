<template>
    <div class="lo">
      <!-- Header -->
      <div class="lo__head">
        <div class="lo__title">
          <span class="lo__badge">ORDER</span>
          <span class="lo__name">My Orders</span>
        </div>
		<button class="btn btn--primary lo__refresh" @click="refresh" :disabled="disabled">
			<span class="dot" aria-hidden="true"></span>
			Refresh
		</button>
      </div>

      <!-- List -->
      <div class="lo__list">
        <div v-if="loading" class="empty">Loading…</div>
        <div v-else-if="error" class="empty">{{ error }}</div>
        <div v-else-if="sortedOrders.length === 0" class="empty">No open orders</div>

        <div v-for="o in sortedOrders" :key="String(o.id)" class="card">
          <!-- top line -->
          <div class="card__top">
            <div class="side" :class="o.side === 'BUY' ? 'buy' : 'sell'">
              {{ o.side === "BUY" ? "Buy" : "Sell" }}
            </div>

            <div class="time mono">
              {{ fmtTime(o.timestamp) }}
            </div>
          </div>

          <!-- main fields -->
          <div class="grid">
            <div class="item">
              <div class="label">Price</div>
              <div class="value mono">{{ fmtPrice(o.price) }}</div>
            </div>

            <div class="item">
              <div class="label">Amount</div>
              <div class="value mono">{{ fmtBase(o.amountBase) }}</div>
            </div>

            <div class="item">
              <div class="label">Filled</div>
              <div class="value mono">{{ fmtBase(o.filledBase) }}</div>
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
            Cancel
            <!-- #{{ String(o.id) }} -->
          </button>
        </div>
      </div>
    </div>
  </template>

  <script setup>
  import { computed, onMounted, ref, toRefs, watch } from "vue";
  import { formatUnits, isAddress, ethers } from "ethers";

  import { callDex } from "../lib/dex";

  const props = defineProps({
    walletAddress: { type: String, default: "" },
    baseAddress: { type: String, default: "" },
    baseSymbol: { type: String, default: "" },
    quoteSymbol: { type: String, default: "" },
    baseDecimals: { type: Number, default: 18 },
    quoteDecimals: { type: Number, default: 18 },
  });

  const { walletAddress, baseAddress, baseSymbol, quoteSymbol, baseDecimals, quoteDecimals } = toRefs(props);

  const loading = ref(false);
  const error = ref("");
  const orders = ref([]);

  const disabled = computed(() => !walletAddress.value || !baseAddress.value);

  const sortedOrders = computed(() => {
    return [...orders.value]
    .filter(o => o?.active !== false)
    .sort((a, b) => Number(b.timestamp || 0) - Number(a.timestamp || 0));
  });

  async function refresh() {
  if (disabled.value) return;
  error.value = "";
  loading.value = true;
  try {
    const base = String(baseAddress.value || "").trim();
    const from = String(walletAddress.value || "").trim();
    if (!isAddress(base) || !isAddress(from)) {
      orders.value = [];
      return;
    }
    const res = await callDex("getMyOpenOrdersFor", base, { from });
    orders.value = (res || []).map(o => {
      const sideNum = Number(o?.side ?? 0);
      return {
        id: String(o?.id ?? ""),
        side: sideNum === 0 ? "BUY" : "SELL",
        price: BigInt(o?.price ?? 0),
        amountBase: BigInt(o?.amountBase ?? 0),
        filledBase: BigInt(o?.filledBase ?? 0),
        remainingBase: BigInt(o?.remainingBase ?? 0),
        timestamp: Number(o?.timestamp ?? 0),
        active: Boolean(o?.active),
      };
    });
  } catch (e) {
    error.value = e?.shortMessage || e?.message || "Failed to load open orders";
    orders.value = [];
  } finally {
    loading.value = false;
  }
  }

  // ====== tx state (for cancel) ======
  const txBusy = ref(false);
  const statusText = ref("ready"); // 可选：如果你不展示也没关系

  // ====== tx helpers (cancel) ======
  async function sendTx(buildTx, label) {
    if (disabled.value) return;

    try {
      txBusy.value = true;
      statusText.value = `${label}: sending...`;
      error.value = "";

      const from = String(walletAddress.value || "").trim();
      if (!isAddress(from)) throw new Error("Invalid walletAddress");

      const tx = await buildTx();          // 发送交易
      if (tx?.wait) await tx.wait();       // 等确认（兼容 ethers v6 交易对象）

      statusText.value = `✅ ${label} confirmed`;
      await refresh();                     // 刷新订单列表
    } catch (e) {
      console.error(e);
      const msg = e?.shortMessage || e?.message || String(e);
      statusText.value = `${label} error: ${msg}`;
      error.value = msg; // 你页面里有 error 区域，直接复用
    } finally {
      txBusy.value = false;
    }
  }

  // ✅ one-click cancel from list (改这里)
  function cancelOrderById(orderId) {
    const id = BigInt(String(orderId || "0"));
    if (id <= 0n) return;

    return sendTx(
      async () => {
        const dexWrite = await ensureDexWrite();
        return dexWrite.cancelOrder(id);
      },
      `Cancel Order #${String(id)}`
    );
  }

  const DEX_ADDRESS = "0x887D9Af1241a176107d31Bb3C69787DFff6dbaD8";
  const DEX_ABI = ["function cancelOrder(uint256 orderId)"];

  let _provider;
  let _signer;
  let _dexWrite;

  async function ensureDexWrite() {
    if (_dexWrite) return _dexWrite;
    if (!window.ethereum) throw new Error("MetaMask not found");

    _provider = new ethers.BrowserProvider(window.ethereum);
    await _provider.send("eth_requestAccounts", []);
    _signer = await _provider.getSigner();

    _dexWrite = new ethers.Contract(DEX_ADDRESS, DEX_ABI, _signer);
    return _dexWrite;
  }

  function short(addr) {
    const a = String(addr || "");
    if (!a || a.length < 10) return a || "—";
    return `${a.slice(0, 6)}…${a.slice(-4)}`;
  }

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

  function fmtPrice(v) {
	return fmtUnitsSafe(v ?? 0n, quoteDecimals.value);
  }

  function fmtBase(v) {
	return fmtUnitsSafe(v ?? 0n, baseDecimals.value);
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
    const a = BigInt(o.amountBase || 0n);
    const f = BigInt(o.filledBase || 0n);
    if (a === 0n) return 0;
    const pct = Number((f * 10000n) / a) / 100; // 2位小数
    return Math.max(0, Math.min(100, pct));
  }

  onMounted(async () => {
	await refresh();
  });

  watch(
	() => [walletAddress.value, baseAddress.value],
	async () => {
		await refresh();
	}
  );
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
	width: 100%;
	max-width: none;
	min-width: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  }

  .mono {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  }

  .lo__head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
  }

	.lo__refresh {
		flex: 0 0 auto;
		white-space: nowrap;
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
	flex: 1 1 auto;
	min-height: 0;
	overflow: auto;
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