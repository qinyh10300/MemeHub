<template>
	<section class="tokenView">
		<div class="head">
			<button class="back" type="button" @click="goBack">Back</button>
			<div class="info">
				<div class="title">{{ baseSymbol || "Token" }} / {{ quoteSymbol || "Quote" }}</div>
				<div class="addr mono" :title="address">{{ address }}</div>
			</div>
		</div>

		<div class="topGrid">
			<div class="klinePanel">
				<KlineChart
					:walletAddress="walletAddress"
					:baseAddress="address"
					:baseSymbol="baseSymbol"
					:quoteSymbol="quoteSymbol"
					:quoteDecimals="quoteDecimals"
					:baseDecimals="baseDecimals"
				/>
			</div>
			<OrderBook
				:walletAddress="walletAddress"
				:baseAddress="address"
				:baseSymbol="baseSymbol"
				:quoteSymbol="quoteSymbol"
				:quoteDecimals="quoteDecimals"
				:baseDecimals="baseDecimals"
			/>
			<TradingPanel
				:walletAddress="walletAddress"
				:baseAddress="address"
				:baseSymbol="baseSymbol"
				:quoteSymbol="quoteSymbol"
				:quoteDecimals="quoteDecimals"
				:baseDecimals="baseDecimals"
			/>
		</div>

		<div class="bottomGrid">
			<LimitOrder
				:walletAddress="walletAddress"
				:baseAddress="address"
				:baseSymbol="baseSymbol"
				:quoteSymbol="quoteSymbol"
				:quoteDecimals="quoteDecimals"
				:baseDecimals="baseDecimals"
			/>
			<DexAssetsCard />
			<TokenVaultCard :tokenAddress="address" :fallbackSymbol="baseSymbol" :fallbackDecimals="baseDecimals" />
		</div>
	</section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Contract, JsonRpcProvider, isAddress } from "ethers";

import DexAssetsCard from "../components/DexAssetsCard.vue";
import KlineChart from "../components/KlineChart.vue";
import LimitOrder from "../components/LimitOrder.vue";
import OrderBook from "../components/OrderBook.vue";
import TradingPanel from "../components/TradingPanel.vue";
import TokenVaultCard from "../components/TokenVaultCard.vue";

import { PHAROS_ATLANTIC, PHAROS_ATLANTIC_RPC_URL } from "../lib/pharos";
import { callDex } from "../lib/dex";

const props = defineProps({
	address: {
		type: String,
		required: false,
		default: "",
	},
});

const route = useRoute();
const router = useRouter();

const address = computed(() => String(props.address || route.params.address || "").trim());

const readProvider = new JsonRpcProvider(PHAROS_ATLANTIC_RPC_URL, PHAROS_ATLANTIC.chainId);
const ERC20_ABI = [
	"function name() view returns (string)",
	"function symbol() view returns (string)",
	"function decimals() view returns (uint8)",
];

const walletAddress = ref("");
const baseSymbol = ref("");
const baseDecimals = ref(18);
const quoteSymbol = ref("");
const quoteDecimals = ref(18);


let ethForListeners;
let accountsHandler;
let chainHandler;

function getEthereum() {
	return typeof window !== "undefined" ? window.ethereum : undefined;
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

async function loadBaseMeta() {
	const base = String(address.value || "").trim();
	baseSymbol.value = "";
	baseDecimals.value = 18;
	if (!isAddress(base)) return;
	try {
		const token = new Contract(base, ERC20_ABI, readProvider);
		const [s, d] = await Promise.all([token.symbol(), token.decimals()]);
		baseSymbol.value = String(s || "");
		baseDecimals.value = Number(d);
	} catch {
		// ignore
	}
}

async function loadQuoteMeta() {
	quoteSymbol.value = "";
	quoteDecimals.value = 18;
	try {
		const [qt, qd] = await Promise.all([callDex("quoteToken"), callDex("quoteDecimals")]);
		quoteDecimals.value = Number(qd);
		if (isAddress(String(qt || ""))) {
			const token = new Contract(String(qt).trim(), ERC20_ABI, readProvider);
			quoteSymbol.value = String(await token.symbol());
		}
	} catch {
		// ignore
	}
}

function goBack() {
	if (window.history.length > 1) router.back();
	else router.push({ name: "home" });
}

onMounted(async () => {
	await Promise.all([loadQuoteMeta(), loadBaseMeta(), refreshWalletAddress()]);
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
	() => address.value,
	async () => {
		await loadBaseMeta();
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
.tokenView {
	width: 100%;
	margin: 0;
	padding: 0 16px;
	box-sizing: border-box;
	max-width: 100%;
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.head {
	display: flex;
	align-items: center;
	gap: 12px;
}

.back {
	height: 34px;
	padding: 0 12px;
	border-radius: 10px;
	border: 1px solid rgba(255, 255, 255, 0.12);
	background: rgba(255, 255, 255, 0.06);
	cursor: pointer;
	font-weight: 600;
	color: rgba(255, 255, 255, 0.88);
}

.back:hover {
	border-color: rgba(255, 255, 255, 0.22);
}

.info {
	min-width: 0;
}

.title {
	font-size: 14px;
	font-weight: 700;
	color: rgba(255, 255, 255, 0.92);
}

.addr {
	margin-top: 2px;
	font-size: 12px;
	color: rgba(255, 255, 255, 0.55);
	word-break: break-all;
}

.mono {
	font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New",
		monospace;
}

.topGrid {
	display: grid;
	grid-template-columns: minmax(0, 7fr) minmax(0, 2.5fr) minmax(0, 2.5fr);
	gap: 12px;
	align-items: stretch;
}

.topGrid > * {
	min-width: 0;
}

.klinePanel {
	border: 1px solid rgba(255, 255, 255, 0.09);
	border-radius: 14px;
	background: radial-gradient(900px 520px at 15% 0%, rgba(0, 208, 132, 0.08), transparent 55%),
		radial-gradient(820px 520px at 95% 5%, rgba(86, 195, 255, 0.08), transparent 60%),
		#0b0f14;
	padding: 12px;
	overflow: hidden;
	min-width: 0;
	min-height: 560px;
	display: flex;
}

.klinePanel :deep(.kline-wrapper) {
	flex: 1 1 auto;
}

.bottomGrid {
	display: grid;
	grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr) minmax(0, 0.9fr);
	gap: 12px;
	align-items: stretch;
}

.bottomGrid > * {
	min-width: 0;
	height: 420px;
}


@media (max-width: 1240px) {
	.topGrid {
		grid-template-columns: 1fr;
	}
	.bottomGrid {
		grid-template-columns: 1fr;
	}
	.bottomGrid > * {
		height: auto;
	}
}
</style>
