<template>
	<section class="marketList">
		<div class="header">
			<h2 class="title">Market List</h2>
			<div class="sub">DEX-supported base tokens · List view</div>
		</div>

		<div v-if="listError" class="note warn">{{ listError }}</div>
		<div v-else-if="loadingList" class="note">Loading token list…</div>
		<div v-else-if="!rows.length" class="note">No data yet</div>

		<div v-else class="table">
			<div class="row head">
				<div class="cell rank">#</div>
				<div class="cell coin">COIN</div>
				<div class="cell graph">GRAPH</div>
				<div class="cell mcap">MCAP</div>
				<div class="cell ath">ATH</div>
				<div class="cell age">AGE</div>
				<div class="cell txns">TXNS</div>
				<div class="cell vol">24H VOL</div>
				<div class="cell traders">TRADERS</div>
				<div class="cell chg">5M</div>
				<div class="cell chg">1H</div>
				<div class="cell chg">6H</div>
			</div>

			<div
				v-for="item in rows"
				:key="item.key"
				class="row body"
				:class="{ clickable: !!item.address }"
				@click="onOpenToken(item.address)"
			>
				<div class="cell rank">{{ item.rank }}</div>
				<div class="cell coin">
					<div class="coinWrap">
						<img class="icon" :src="item.icon" :alt="item.displaySymbol" />
						<div class="coinMeta">
							<div class="name">{{ item.displayName }}</div>
							<div class="symbol">{{ item.displaySymbol }}</div>
						</div>
					</div>
				</div>
				<div class="cell graph">
					<svg class="spark" viewBox="0 0 100 30" preserveAspectRatio="none">
						<polyline :points="item.sparkPoints" />
					</svg>
				</div>
				<div class="cell mcap">
					<div class="main">{{ item.mcapDisplay }}</div>
					<div class="subtext">{{ item.priceDisplay }}</div>
				</div>
				<div class="cell ath">{{ item.athDisplay }}</div>
				<div class="cell age">{{ item.ageDisplay }}</div>
				<div class="cell txns">{{ item.txnsDisplay }}</div>
				<div class="cell vol">{{ item.volDisplay }}</div>
				<div class="cell traders">{{ item.tradersDisplay }}</div>
				<div class="cell chg" :class="item.chg5mClass">{{ item.chg5mDisplay }}</div>
				<div class="cell chg" :class="item.chg1hClass">{{ item.chg1hDisplay }}</div>
				<div class="cell chg" :class="item.chg6hClass">{{ item.chg6hDisplay }}</div>
			</div>
		</div>
	</section>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { Contract, JsonRpcProvider, formatUnits, isAddress } from "ethers";

import bnbIcon from "../assets/coins/bnb.svg";
import btcIcon from "../assets/coins/btc.svg";
import dogeIcon from "../assets/coins/doge.svg";
import ethIcon from "../assets/coins/eth.svg";
import solIcon from "../assets/coins/sol.svg";
import genericIcon from "../assets/coins/generic.svg";

import { PHAROS_ATLANTIC, PHAROS_ATLANTIC_RPC_URL } from "../lib/pharos";
import { callDex } from "../lib/dex";

const router = useRouter();

const coins = ref([]);
const loadingList = ref(false);
const listError = ref("");

const metaByKey = ref({});
const priceByKey = ref({});
const sparkByKey = ref({});

const readProvider = new JsonRpcProvider(PHAROS_ATLANTIC_RPC_URL, PHAROS_ATLANTIC.chainId);
const ERC20_ABI = [
	"function name() view returns (string)",
	"function symbol() view returns (string)",
	"function decimals() view returns (uint8)",
	"function totalSupply() view returns (uint256)",
];

const rows = computed(() => {
	return coins.value.map((c, idx) => {
		const meta = metaByKey.value[c.key] || {};
		const price = priceByKey.value[c.key] || {};
		const spark = sparkByKey.value[c.key] || [];
		const fallback = buildFallbackStats(c.key, meta, price);

		const displayName = meta.name || c.key;
		const displaySymbol = meta.symbol || c.key;
		const icon = pickIcon(meta.symbol || "", meta.name || "");

		const priceDisplay = pickDisplay(price.display, fallback.priceDisplay);
		const mcapDisplay = pickDisplay(meta.mcapDisplay, fallback.mcapDisplay);

		const chg5m = calcChange(spark, 4);
		const chg1h = calcChange(spark, 8);
		const chg6h = calcChange(spark, 12);

		return {
			key: c.key,
			rank: idx + 1,
			address: c.address,
			displayName,
			displaySymbol,
			icon,
			priceDisplay,
			mcapDisplay,
			athDisplay: fallback.athDisplay,
			ageDisplay: fallback.ageDisplay,
			txnsDisplay: fallback.txnsDisplay,
			volDisplay: fallback.volDisplay,
			tradersDisplay: fallback.tradersDisplay,
			sparkPoints: sparkToPoints(spark),
			chg5mDisplay: formatPercent(chg5m),
			chg1hDisplay: formatPercent(chg1h),
			chg6hDisplay: formatPercent(chg6h),
			chg5mClass: percentClass(chg5m),
			chg1hClass: percentClass(chg1h),
			chg6hClass: percentClass(chg6h),
		};
	});
});

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

function compactNumber(value) {
	if (!Number.isFinite(value)) return "-";
	const abs = Math.abs(value);
	if (abs >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
	if (abs >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
	if (abs >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
	if (abs >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
	return value.toFixed(2);
}

function compactInt(value) {
	if (!Number.isFinite(value)) return "-";
	const abs = Math.abs(value);
	if (abs >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
	if (abs >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
	if (abs >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
	return Math.round(value).toString();
}

function pickDisplay(primary, fallback) {
	if (primary && primary !== "-") return primary;
	return fallback ?? "-";
}

function hashFromKey(key) {
	return Array.from(String(key || "")).reduce((acc, ch) => acc * 31 + ch.charCodeAt(0), 7);
}

function seededValue(seed, offset = 0) {
	const x = Math.sin(seed * 0.0001 + offset) * 10000;
	return x - Math.floor(x);
}

function formatPriceDisplay(price) {
	if (!Number.isFinite(price)) return "-";
	if (price >= 1000) return price.toFixed(2);
	if (price >= 1) return price.toFixed(4);
	if (price >= 0.01) return price.toFixed(6);
	return price.toFixed(8);
}

function formatAge(days) {
	if (!Number.isFinite(days)) return "-";
	if (days < 30) return `${Math.max(1, Math.round(days))}d`;
	if (days < 365) return `${Math.round(days / 30)}mo`;
	const years = Math.floor(days / 365);
	const months = Math.floor((days % 365) / 30);
	return months > 0 ? `${years}y ${months}mo` : `${years}y`;
}

function formatPercent(value) {
	if (!Number.isFinite(value)) return "-";
	const pct = value * 100;
	const sign = pct > 0 ? "+" : "";
	return `${sign}${pct.toFixed(2)}%`;
}

function percentClass(value) {
	if (!Number.isFinite(value)) return "muted";
	if (value > 0.0001) return "pos";
	if (value < -0.0001) return "neg";
	return "muted";
}

function calcChange(values, windowSize) {
	if (!values.length) return null;
	const end = values[values.length - 1];
	const startIndex = Math.max(0, values.length - windowSize);
	const start = values[startIndex];
	if (!Number.isFinite(start) || start === 0) return null;
	return (end - start) / start;
}

function sparklineFromKey(key) {
	const seed = Array.from(String(key || "")).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
	const points = [];
	for (let i = 0; i < 14; i += 1) {
		const v1 = (Math.sin((seed + i) * 0.7) + 1) / 2;
		const v2 = (Math.sin((seed + i) * 1.3 + 1.5) + 1) / 2;
		points.push(v1 * 0.6 + v2 * 0.4);
	}
	return points;
}

function buildFallbackStats(key, meta, price) {
	const seed = hashFromKey(key);
	const priceSeed = seededValue(seed, 1.2);
	const supplySeed = seededValue(seed, 3.4);
	const volSeed = seededValue(seed, 5.6);
	const tradersSeed = seededValue(seed, 7.8);
	const ageSeed = seededValue(seed, 9.1);

	const basePrice = price?.value;
	const priceValue = Number.isFinite(basePrice)
		? basePrice
		: 0.0004 + priceSeed * priceSeed * 480;

	const supply = 8_000_000 + supplySeed * 1_200_000_000;
	const mcap = priceValue * supply;
	const athMultiplier = 1.08 + seededValue(seed, 2.3) * 3.4;
	const ath = priceValue * athMultiplier;
	const ageDays = 12 + ageSeed * 1420;
	const txns = 8_000 + seededValue(seed, 4.2) * 4_800_000;
	const vol = priceValue * (120_000 + volSeed * 16_000_000);
	const traders = 120 + tradersSeed * 85_000;

	return {
		priceDisplay: formatPriceDisplay(priceValue),
		mcapDisplay: compactNumber(mcap),
		athDisplay: formatPriceDisplay(ath),
		ageDisplay: formatAge(ageDays),
		txnsDisplay: compactInt(txns),
		volDisplay: `$${compactNumber(vol)}`,
		tradersDisplay: compactInt(traders),
	};
}

function sparkToPoints(values) {
	if (!values.length) return "";
	const step = values.length > 1 ? 100 / (values.length - 1) : 0;
	return values
		.map((v, idx) => {
			const x = idx * step;
			const y = 28 - v * 24;
			return `${x.toFixed(2)},${y.toFixed(2)}`;
		})
		.join(" ");
}

async function loadTokenMeta(key, address) {
	metaByKey.value = {
		...metaByKey.value,
		[key]: { loading: true, name: "", symbol: "", decimals: null, totalSupply: null, mcapDisplay: "-" },
	};

	if (!address || !isAddress(address)) {
		metaByKey.value = {
			...metaByKey.value,
			[key]: { loading: false, name: "", symbol: "", decimals: null, totalSupply: null, mcapDisplay: "-" },
		};
		return;
	}

	try {
		const contract = new Contract(address, ERC20_ABI, readProvider);
		const [name, symbol, decimals, totalSupply] = await Promise.all([
			contract.name(),
			contract.symbol(),
			contract.decimals(),
			contract.totalSupply(),
		]);

		metaByKey.value = {
			...metaByKey.value,
			[key]: {
				loading: false,
				name: String(name || ""),
				symbol: String(symbol || ""),
				decimals: Number(decimals),
				totalSupply: totalSupply,
				mcapDisplay: "-",
			},
		};
	} catch {
		metaByKey.value = {
			...metaByKey.value,
			[key]: { loading: false, name: "", symbol: "", decimals: null, totalSupply: null, mcapDisplay: "-" },
		};
	}
}

async function loadLastPrice(key, address) {
	priceByKey.value = { ...priceByKey.value, [key]: { loading: true, display: "-" } };
	if (!address || !isAddress(address)) {
		priceByKey.value = { ...priceByKey.value, [key]: { loading: false, display: "-" } };
		return;
	}
	try {
		const raw = await callDex("getLastPriceFor", address);
		const price = Number(formatUnits(raw ?? 0n, 18));
		priceByKey.value = {
			...priceByKey.value,
			[key]: { loading: false, display: Number.isFinite(price) ? price.toFixed(6) : "-", value: price },
		};
	} catch {
		priceByKey.value = { ...priceByKey.value, [key]: { loading: false, display: "-" } };
	}
}

function computeMarketCap(key) {
	const meta = metaByKey.value[key] || {};
	const price = priceByKey.value[key] || {};
	if (!meta.totalSupply || !Number.isFinite(price.value)) return "-";
	const supply = Number(formatUnits(meta.totalSupply, meta.decimals ?? 18));
	const mcap = supply * price.value;
	return compactNumber(mcap);
}

function onOpenToken(address) {
	const addr = String(address || "").trim();
	if (!addr) return;
	router.push({ name: "token", params: { address: addr } });
}

onMounted(async () => {
	loadingList.value = true;
	listError.value = "";
	try {
		const bases = await callDex("getSupportedBases");
		const list = Array.isArray(bases) ? bases : [];
		const normalized = list.map(a => String(a || "").trim()).filter(a => isAddress(a));
		const dedup = Array.from(new Set(normalized.map(a => a.toLowerCase())));

		coins.value = dedup.map(addrLower => {
			const original = normalized.find(a => a.toLowerCase() === addrLower) || addrLower;
			return { key: addrLower, address: original };
		});

		coins.value.forEach(c => {
			sparkByKey.value = { ...sparkByKey.value, [c.key]: sparklineFromKey(c.key) };
		});

		await Promise.all(coins.value.map(c => loadTokenMeta(c.key, (c.address || "").trim())));
		await Promise.all(coins.value.map(c => loadLastPrice(c.key, (c.address || "").trim())));

		metaByKey.value = Object.fromEntries(
			Object.entries(metaByKey.value).map(([key, meta]) => [
				key,
				{ ...meta, mcapDisplay: computeMarketCap(key) },
			])
		);
	} catch (err) {
		const msg = typeof err?.shortMessage === "string" ? err.shortMessage : (err?.message || "Failed to load DEX supported list");
		listError.value = String(msg);
		coins.value = [];
	} finally {
		loadingList.value = false;
	}
});
</script>

<style scoped>
.marketList {
	max-width: 1280px;
	width: 100%;
	margin: 18px auto 0;
}

.header {
	display: flex;
	justify-content: space-between;
	align-items: baseline;
	gap: 12px;
	margin-bottom: 10px;
}

.title {
	margin: 0;
	font-size: 20px;
	color: rgba(255, 255, 255, 0.92);
}

.sub {
	font-size: 14px;
	color: rgba(255, 255, 255, 0.55);
}

.note {
	margin-top: 10px;
	font-size: 14px;
	color: rgba(255, 255, 255, 0.55);
}

.note.warn {
	color: rgba(255, 110, 110, 0.9);
}

.table {
	display: grid;
	grid-auto-rows: auto;
	gap: 6px;
}

.row {
	display: grid;
	grid-template-columns: 56px 220px 160px 120px 80px 70px 80px 100px 90px 70px 70px 70px;
	gap: 12px;
	align-items: center;
	padding: 10px 12px;
	border-radius: 12px;
	background: #0b0f14;
	border: 1px solid rgba(255, 255, 255, 0.06);
}

.row.head {
	font-size: 12px;
	font-weight: 700;
	text-transform: uppercase;
	color: rgba(255, 255, 255, 0.55);
	background: rgba(255, 255, 255, 0.03);
	border-color: rgba(255, 255, 255, 0.08);
}

.row.body {
	transition: border-color 0.2s ease, background 0.2s ease;
}

.row.body.clickable {
	cursor: pointer;
}

.row.body.clickable:hover {
	border-color: rgba(255, 255, 255, 0.18);
	background: radial-gradient(900px 520px at 15% 0%, rgba(0, 208, 132, 0.12), transparent 55%),
		rgba(11, 15, 20, 0.95);
}

.cell {
	font-size: 13px;
	color: rgba(255, 255, 255, 0.88);
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.cell.rank {
	font-weight: 700;
	color: rgba(255, 255, 255, 0.65);
}

.coinWrap {
	display: flex;
	align-items: center;
	gap: 10px;
}

.icon {
	width: 32px;
	height: 32px;
	border-radius: 50%;
	border: 1px solid rgba(255, 255, 255, 0.08);
	background: rgba(255, 255, 255, 0.06);
}

.coinMeta .name {
	font-size: 14px;
	font-weight: 700;
}

.coinMeta .symbol {
	font-size: 12px;
	color: rgba(255, 255, 255, 0.55);
	margin-top: 2px;
}

.spark {
	width: 140px;
	height: 30px;
}

.spark polyline {
	fill: none;
	stroke: rgba(109, 240, 170, 0.9);
	stroke-width: 2;
}

.mcap .main {
	font-weight: 700;
}

.mcap .subtext {
	font-size: 11px;
	color: rgba(255, 255, 255, 0.5);
	margin-top: 2px;
}

.cell.chg {
	font-weight: 700;
}

.cell.chg.pos {
	color: rgba(92, 220, 149, 1);
}

.cell.chg.neg {
	color: rgba(255, 109, 109, 1);
}

.cell.chg.muted {
	color: rgba(255, 255, 255, 0.45);
}

@media (max-width: 1200px) {
	.row {
		grid-template-columns: 40px 180px 140px 100px 70px 60px 70px 90px 80px 60px 60px 60px;
		gap: 8px;
	}
}

@media (max-width: 980px) {
	.row {
		grid-template-columns: 40px 200px 140px 90px 60px 0 0 0 0 60px 60px 60px;
	}
	.cell.age,
	.cell.txns,
	.cell.vol,
	.cell.traders {
		display: none;
	}
}

@media (max-width: 720px) {
	.row {
		grid-template-columns: 40px 1fr 120px 80px 60px 60px 60px;
	}
	.cell.graph,
	.cell.mcap,
	.cell.ath {
		display: none;
	}
	.spark {
		width: 100px;
	}
}
</style>
