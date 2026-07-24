<template>
	<section class="assets">
		<div class="header">
			<div class="titleRow">
				<span class="badge">ASSET</span>
				<h2 class="title">All Assets</h2>
			</div>
		</div>

		<div class="card">

			<div class="row">
				<div class="label">Quote (Wallet)</div>
				<div class="value mono">
					<span v-if="!walletAddress">-</span>
					<span v-else-if="loading">Loading…</span>
					<span v-else>{{ quoteWalletDisplay }}</span>
				</div>
			</div>

			<div class="row">
				<div class="label">Quote (DEX)</div>
				<div class="value mono">
					<span v-if="!walletAddress">-</span>
					<span v-else-if="loading">Loading…</span>
					<span v-else>{{ quoteDexDisplay }}</span>
				</div>
			</div>

			<div class="row">
				<div class="label">Quote (Total)</div>
				<div class="value mono">
					<span v-if="!walletAddress">-</span>
					<span v-else-if="loading">Loading…</span>
					<span v-else>{{ quoteTotalDisplay }}</span>
				</div>
			</div>

			<div v-if="error" class="row">
				<div class="label">Status</div>
				<div class="value warn">{{ error }}</div>
			</div>

			<div v-if="walletAddress" class="list">
				<div v-if="loading" class="empty">Loading assets…</div>
				<div v-else-if="!baseAssets.length" class="empty">No base assets (zero balances hidden)</div>
				<div v-else>
					<div v-for="a in baseAssets" :key="a.address" class="assetRow">
						<div class="left">
							<img class="icon" :src="a.icon" :alt="a.symbol || 'TOKEN'" />
							<div class="meta">
								<div class="name">{{ a.name || a.symbol || formatAddr(a.address) }}</div>
								<div class="hint mono">{{ a.symbol || "-" }}</div>
							</div>
						</div>
						<div class="right">
							<div class="mono">Wallet: {{ a.walletDisplay }}</div>
							<div class="mono">DEX: {{ a.dexDisplay }}</div>
							<div class="mono">Total: {{ a.totalDisplay }}</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { Contract, JsonRpcProvider, formatUnits, isAddress } from "ethers";

import bnbIcon from "../assets/coins/bnb.svg";
import btcIcon from "../assets/coins/btc.svg";
import dogeIcon from "../assets/coins/doge.svg";
import ethIcon from "../assets/coins/eth.svg";
import solIcon from "../assets/coins/sol.svg";
import genericIcon from "../assets/coins/generic.svg";

import { PHAROS_ATLANTIC, PHAROS_ATLANTIC_RPC_URL } from "../lib/pharos";
import { callDex } from "../lib/dex";

const readProvider = new JsonRpcProvider(PHAROS_ATLANTIC_RPC_URL, PHAROS_ATLANTIC.chainId);

const walletAddress = ref("");
const loading = ref(false);
const error = ref("");

const quoteTokenAddress = ref("");
const quoteSymbol = ref("");
const quoteDecimals = ref(18);
const quoteWalletRaw = ref(0n);
const quoteDexRaw = ref(0n);

const baseAssets = ref([]);

let ethForListeners;
let accountsHandler;
let chainHandler;

const ERC20_READ_ABI = [
	"function name() view returns (string)",
	"function symbol() view returns (string)",
	"function balanceOf(address) view returns (uint256)",
];

const quoteWalletDisplay = computed(() => {
	const sym = quoteSymbol.value ? ` ${quoteSymbol.value}` : "";
	return `${formatAmount(quoteWalletRaw.value, quoteDecimals.value)}${sym}`;
});

const quoteDexDisplay = computed(() => {
	const sym = quoteSymbol.value ? ` ${quoteSymbol.value}` : "";
	return `${formatAmount(quoteDexRaw.value, quoteDecimals.value)}${sym}`;
});

const quoteTotalDisplay = computed(() => {
	const sym = quoteSymbol.value ? ` ${quoteSymbol.value}` : "";
	const total = (quoteWalletRaw.value ?? 0n) + (quoteDexRaw.value ?? 0n);
	return `${formatAmount(total, quoteDecimals.value)}${sym}`;
});

function getEthereum() {
	return typeof window !== "undefined" ? window.ethereum : undefined;
}

function pickIcon(symbol, name) {
	const s = String(symbol || "").toUpperCase();
	const n = String(name || "").toUpperCase();
	const text = `${s} ${n}`;

	if (text.includes("BTC")) return btcIcon;
	if (text.includes("ETH")) return ethIcon;
	if (text.includes("DOGE")) return dogeIcon;
	if (text.includes("SOL")) return solIcon;
	if (text.includes("BNB")) return bnbIcon;
	return genericIcon;
}

function formatAddr(addr) {
	const a = String(addr || "");
	if (!a) return "-";
	if (a.length <= 12) return a;
	return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

function formatAmount(raw, decimals) {
	try {
		const d = Number.isFinite(Number(decimals)) ? Number(decimals) : 18;
		const s = formatUnits(raw ?? 0n, d);
		if (!s.includes(".")) return s;
		const [a, b] = s.split(".");
		return `${a}.${(b || "").slice(0, 6)}`.replace(/\.$/, "");
	} catch {
		return String(raw ?? "0");
	}
}

async function refreshWalletAddress() {
	const eth = getEthereum();
	if (!eth?.request) {
		walletAddress.value = "";
		return;
	}
	try {
		const accounts = await eth.request({ method: "eth_accounts" });
		walletAddress.value = Array.isArray(accounts) && accounts[0] ? String(accounts[0]) : "";
	} catch {
		walletAddress.value = "";
	}
}

async function loadQuote(trader) {
	const [qt, qd, qb] = await Promise.all([
		callDex("quoteToken"),
		callDex("quoteDecimals"),
		callDex("quoteBalance", trader),
	]);
	quoteTokenAddress.value = String(qt || "");
	quoteDecimals.value = Number(qd);
	quoteDexRaw.value = BigInt(qb);

	if (isAddress(String(qt || ""))) {
		try {
			const token = new Contract(String(qt).trim(), ERC20_READ_ABI, readProvider);
			const [sym, wbal] = await Promise.all([token.symbol(), token.balanceOf(trader)]);
			quoteSymbol.value = String(sym || "");
			quoteWalletRaw.value = BigInt(wbal);
		} catch {
			quoteSymbol.value = "";
			quoteWalletRaw.value = 0n;
		}
	} else {
		quoteWalletRaw.value = 0n;
	}
}

async function loadBases(trader) {
	const bases = await callDex("getSupportedBases");
	const list = Array.isArray(bases) ? bases : [];
	const addresses = list.map(a => String(a || "").trim()).filter(a => isAddress(a));
	const dedup = Array.from(new Set(addresses.map(a => a.toLowerCase()))).map(l => addresses.find(a => a.toLowerCase() === l) || l);

	const rows = await Promise.all(
		dedup.map(async addr => {
			const [dexRaw, decimals] = await Promise.all([
				callDex("baseBalance", trader, addr),
				callDex("baseDecimals", addr).catch(() => 18),
			]);

			let name = "";
			let symbol = "";
			let walletRaw = 0n;
			try {
				const token = new Contract(String(addr).trim(), ERC20_READ_ABI, readProvider);
				const [n, s, w] = await Promise.all([token.name(), token.symbol(), token.balanceOf(trader)]);
				name = String(n || "");
				symbol = String(s || "");
				walletRaw = BigInt(w);
			} catch {
				// ignore
			}

			const dexBig = BigInt(dexRaw);
			const dec = Number(decimals);
			return {
				address: addr,
				name,
				symbol,
				decimals: dec,
				walletRaw,
				dexRaw: dexBig,
			};
		})
	);

	const nonZero = rows.filter(r => (r.walletRaw ?? 0n) > 0n || (r.dexRaw ?? 0n) > 0n);
	if (!nonZero.length) {
		baseAssets.value = [];
		return;
	}

	const metas = nonZero.map(r => {
			let name = "";
			let symbol = "";
			name = r.name;
			symbol = r.symbol;
			const symSuffix = symbol ? ` ${symbol}` : "";
			const totalRaw = (r.walletRaw ?? 0n) + (r.dexRaw ?? 0n);
			return {
				address: r.address,
				name,
				symbol,
				decimals: r.decimals,
				walletRaw: r.walletRaw,
				dexRaw: r.dexRaw,
				walletDisplay: `${formatAmount(r.walletRaw, r.decimals)}${symSuffix}`,
				dexDisplay: `${formatAmount(r.dexRaw, r.decimals)}${symSuffix}`,
				totalRaw,
				totalDisplay: `${formatAmount(totalRaw, r.decimals)}${symSuffix}`,
				icon: pickIcon(symbol, name),
			};
		});

	baseAssets.value = metas;
}

async function loadAll() {
	error.value = "";
	baseAssets.value = [];
	quoteWalletRaw.value = 0n;
	quoteDexRaw.value = 0n;
	quoteSymbol.value = "";

	const trader = String(walletAddress.value || "").trim();
	if (!trader || !isAddress(trader)) return;

	loading.value = true;
	try {
		await loadQuote(trader);
		await loadBases(trader);
	} catch (e) {
		error.value = e?.shortMessage || e?.message || "Failed to load assets";
	} finally {
		loading.value = false;
	}
}

onMounted(async () => {
	await refreshWalletAddress();
	await loadAll();

	ethForListeners = getEthereum();
	if (ethForListeners?.on) {
		accountsHandler = accounts => {
			walletAddress.value = Array.isArray(accounts) && accounts[0] ? String(accounts[0]) : "";
		};
		chainHandler = () => {
			refreshWalletAddress();
		};
		ethForListeners.on("accountsChanged", accountsHandler);
		ethForListeners.on("chainChanged", chainHandler);
	}
});

watch(
	() => walletAddress.value,
	async () => {
		await loadAll();
	}
);

onBeforeUnmount(() => {
	if (ethForListeners?.removeListener) {
		if (accountsHandler) ethForListeners.removeListener("accountsChanged", accountsHandler);
		if (chainHandler) ethForListeners.removeListener("chainChanged", chainHandler);
	}
});
</script>

<style scoped>
.assets {
	margin-top: 0;
	--bg: #0b0f14;
	--panel2: rgba(255, 255, 255, 0.04);
	--text: rgba(255, 255, 255, 0.92);
	--muted: rgba(255, 255, 255, 0.55);

	background: radial-gradient(1200px 700px at 20% 0%, rgba(0, 208, 132, 0.10), transparent 55%),
		radial-gradient(900px 600px at 90% 10%, rgba(255, 59, 105, 0.10), transparent 60%),
		var(--bg);
	border: 1px solid rgba(255, 255, 255, 0.08);
	border-radius: 14px;
	padding: 14px;
	color: var(--text);
	width: 100%;
	max-width: none;
	min-width: 0;
	overflow: hidden;
	box-sizing: border-box;
	height: 100%;
	display: flex;
	flex-direction: column;
}

.header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 12px;
	margin-bottom: 12px;
}

.titleRow {
	display: flex;
	align-items: center;
	gap: 8px;
	min-width: 0;
}

.badge {
	padding: 4px 8px;
	border-radius: 999px;
	font-weight: 900;
	font-size: 11px;
	letter-spacing: 0.12em;
	background: linear-gradient(90deg, rgba(0, 208, 132, 0.22), rgba(86, 195, 255, 0.16));
	border: 1px solid rgba(255, 255, 255, 0.10);
	color: rgba(255, 255, 255, 0.92);
	flex: 0 0 auto;
}

.title {
	margin: 0;
	font-size: 16px;
	color: rgba(255, 255, 255, 0.92);
}

.sub {
	font-size: 12px;
	color: rgba(255, 255, 255, 0.55);
}


.card {
	background: rgba(255, 255, 255, 0.05);
	border: 1px solid rgba(255, 255, 255, 0.10);
	border-radius: 14px;
	padding: 14px;
	flex: 1 1 auto;
	min-height: 0;
	overflow: hidden;
	display: flex;
	flex-direction: column;
}

.row {
	display: flex;
	justify-content: space-between;
	gap: 12px;
	padding: 6px 0;
}

.label {
	font-size: 12px;
	color: rgba(255, 255, 255, 0.55);
	font-weight: 600;
}

.value {
	font-size: 12px;
	text-align: right;
	color: rgba(255, 255, 255, 0.88);
}

.mono {
	font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New",
		monospace;
}

.warn {
	color: rgba(255, 211, 106, 0.95);
}

.list {
	margin-top: 8px;
	padding-top: 8px;
	border-top: 1px solid rgba(255, 255, 255, 0.10);
	flex: 1 1 auto;
	min-height: 0;
	overflow: auto;
}

.empty {
	font-size: 12px;
	color: rgba(255, 255, 255, 0.55);
	padding: 6px 0;
}

.assetRow {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 10px;
	padding: 8px 0;
}

.left {
	display: flex;
	align-items: center;
	gap: 10px;
	min-width: 0;
}

.icon {
	width: 28px;
	height: 28px;
	border: 1px solid rgba(255, 255, 255, 0.12);
	border-radius: 10px;
	padding: 4px;
	background: rgba(255, 255, 255, 0.04);
	flex: 0 0 auto;
}

.meta {
	min-width: 0;
}

.name {
	font-size: 13px;
	font-weight: 700;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	max-width: 340px;
}

.hint {
	margin-top: 2px;
	font-size: 12px;
	color: rgba(255, 255, 255, 0.55);
}

.right {
	font-size: 12px;
	text-align: right;
	line-height: 1.25;
	color: rgba(255, 255, 255, 0.86);
}
</style>
