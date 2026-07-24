<template>
	<section class="coins">
		<div class="header">
			<h2 class="title">Coins</h2>
			<div class="sub">Pharos Atlantic Testnet · DEX supported bases</div>
		</div>

		<div v-if="listError" class="note warn">
			{{ listError }}
		</div>
		<div v-else-if="loadingList" class="note">
			Loading supported tokens from the DEX…
		</div>
		<div v-else-if="!viewCoins.length" class="note">
			No supported tokens returned by the DEX yet.
		</div>

		<div class="grid">
			<article
				v-for="coin in viewCoins"
				:key="coin.key"
				class="card"
				:class="{ clickable: !!coin.addressTrimmed }"
				@click="onOpenToken(coin.addressTrimmed)"
			>
				<div class="cardTop">
					<div class="symWrap">
						<img class="icon" :src="coin.icon" :alt="coin.displaySymbol" />
					</div>
					<div class="meta">
						<div class="name">
							{{ coin.displayName }}
							<span v-if="coin.loading" class="loading">(Loading…)</span>
						</div>
						<div class="hint">
							{{ coin.displaySymbol }}
							<span v-if="coin.decimals != null" class="sep">·</span>
							<span v-if="coin.decimals != null">decimals: {{ coin.decimals }}</span>
						</div>
					</div>
				</div>

				<div class="rows">
					<div class="row">
						<div class="label">Contract Address</div>
						<div class="value mono" :title="coin.address || ''">{{ formatAddr(coin.address) }}</div>
					</div>

					<div class="row">
						<div class="label">Wallet Balance</div>
						<div class="value mono">
							<span v-if="!walletAddress">Not connected</span>
							<span v-else-if="coin.walletBalLoading">Loading…</span>
							<span v-else>{{ coin.walletBalanceDisplay }}</span>
						</div>
					</div>

					<div class="row">
						<div class="label">DEX Deposited</div>
						<div class="value mono">
							<span v-if="!walletAddress">Not connected</span>
							<span v-else-if="coin.dexBalLoading">Loading…</span>
							<span v-else>{{ coin.dexBalanceDisplay }}</span>
						</div>
					</div>

					<div v-if="coin.error" class="row">
						<div class="label">Status</div>
						<div class="value warn">{{ coin.error }}</div>
					</div>
					<div v-else-if="coin.balanceError" class="row">
						<div class="label">Status</div>
						<div class="value warn">{{ coin.balanceError }}</div>
					</div>
				</div>

				<div class="actions">
					<button
						class="btn"
						type="button"
						:disabled="!coin.addressTrimmed"
						@click.stop="copy(coin.key, coin.addressTrimmed)"
					>
						{{ copiedKey === coin.key ? "Copied" : "Copy Address" }}
					</button>
					<a
						class="btn"
						:class="{ disabled: !coin.addressTrimmed }"
						:href="coin.addressTrimmed ? explorerAddressUrl(coin.addressTrimmed) : undefined"
						target="_blank"
						rel="noreferrer"
						@click.stop="onExplorerClick($event, coin.addressTrimmed)"
					>
						View Explorer
					</a>
				</div>
			</article>
		</div>
	</section>
</template>

<script setup>
// 从 DEX 合约读取其支持的 base token 列表，并读取 ERC20 元数据。

import bnbIcon from "../assets/coins/bnb.svg";
import btcIcon from "../assets/coins/btc.svg";
import dogeIcon from "../assets/coins/doge.svg";
import ethIcon from "../assets/coins/eth.svg";
import solIcon from "../assets/coins/sol.svg";
import genericIcon from "../assets/coins/generic.svg";

import { Contract, JsonRpcProvider, formatUnits, isAddress } from "ethers";
import { PHAROS_ATLANTIC, PHAROS_ATLANTIC_EXPLORER_BASE, PHAROS_ATLANTIC_RPC_URL } from "../lib/pharos";
import { callDex } from "../lib/dex";

import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";

const EXPLORER_BASE = PHAROS_ATLANTIC_EXPLORER_BASE;

const router = useRouter();

const coins = ref([]);

const loadingList = ref(false);
const listError = ref("");

const walletAddress = ref("");

const ERC20_ABI = [
	"function name() view returns (string)",
	"function symbol() view returns (string)",
	"function decimals() view returns (uint8)",
	"function balanceOf(address) view returns (uint256)",
];

const readProvider = new JsonRpcProvider(PHAROS_ATLANTIC_RPC_URL, PHAROS_ATLANTIC.chainId);

const metaByKey = ref({});
const balanceByKey = ref({});

const copiedKey = ref("");
let copiedTimer;

let ethForListeners;
let accountsHandler;
let chainHandler;

const viewCoins = computed(() => {
	return coins.value.map(c => {
		const addressTrimmed = (c.address || "").trim();
		const meta = metaByKey.value[c.key] || {};
		const bal = balanceByKey.value[c.key] || {};
		const icon = pickIcon(meta.symbol || "", meta.name || "");
		return {
			...c,
			addressTrimmed,
			displayName: meta.name || c.key,
			displaySymbol: meta.symbol || c.key,
			decimals: meta.decimals ?? null,
			loading: !!meta.loading,
			error: meta.error || "",
			walletBalLoading: !!bal.walletLoading,
			dexBalLoading: !!bal.dexLoading,
			walletBalanceDisplay: bal.walletDisplay || "-",
			dexBalanceDisplay: bal.dexDisplay || "-",
			balanceError: bal.error || "",
			icon,
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

async function loadTokenMeta(key, address) {
	metaByKey.value = {
		...metaByKey.value,
		[key]: { loading: true, name: "", symbol: "", decimals: null, error: "" },
	};

	if (!address || !isAddress(address)) {
		metaByKey.value = {
			...metaByKey.value,
			[key]: { loading: false, name: "", symbol: "", decimals: null, error: "Invalid or missing address" },
		};
		return;
	}

	try {
		const contract = new Contract(address, ERC20_ABI, readProvider);
		const [name, symbol, decimals] = await Promise.all([
			contract.name(),
			contract.symbol(),
			contract.decimals(),
		]);

		metaByKey.value = {
			...metaByKey.value,
			[key]: {
				loading: false,
				name: String(name || ""),
				symbol: String(symbol || ""),
				decimals: Number(decimals),
				error: "",
			},
		};
	} catch (err) {
		const msg = typeof err?.shortMessage === "string" ? err.shortMessage : (err?.message || "Failed to load");
		metaByKey.value = {
			...metaByKey.value,
			[key]: { loading: false, name: "", symbol: "", decimals: null, error: String(msg) },
		};
	}
}

async function refreshWalletAddress() {
	const eth = typeof window !== "undefined" ? window.ethereum : undefined;
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

function formatAmount(raw, decimals) {
	try {
		const d = Number.isFinite(Number(decimals)) ? Number(decimals) : 18;
		const s = formatUnits(raw ?? 0n, d);
		// 简单裁剪：最多 6 位小数，避免 UI 太长
		if (!s.includes(".")) return s;
		const [a, b] = s.split(".");
		return `${a}.${(b || "").slice(0, 6)}`.replace(/\.$/, "");
	} catch {
		return String(raw ?? "0");
	}
}

async function readDexBaseBalance(trader, baseToken) {
	return await callDex("baseBalance", trader, baseToken);
}

async function loadTokenBalances(key, tokenAddress) {
	const addr = String(tokenAddress || "").trim();
	const trader = String(walletAddress.value || "").trim();
	const decimals = metaByKey.value?.[key]?.decimals ?? 18;

	balanceByKey.value = {
		...balanceByKey.value,
		[key]: { walletLoading: true, dexLoading: true, walletDisplay: "-", dexDisplay: "-", error: "" },
	};

	if (!trader || !isAddress(trader)) {
		balanceByKey.value = {
			...balanceByKey.value,
			[key]: { walletLoading: false, dexLoading: false, walletDisplay: "-", dexDisplay: "-", error: "" },
		};
		return;
	}

	if (!addr || !isAddress(addr)) {
		balanceByKey.value = {
			...balanceByKey.value,
			[key]: { walletLoading: false, dexLoading: false, walletDisplay: "-", dexDisplay: "-", error: "Invalid token address" },
		};
		return;
	}

	try {
		const token = new Contract(addr, ERC20_ABI, readProvider);
		const [walletRaw, dexRaw] = await Promise.all([
			token.balanceOf(trader),
			readDexBaseBalance(trader, addr),
		]);

		balanceByKey.value = {
			...balanceByKey.value,
			[key]: {
				walletLoading: false,
				dexLoading: false,
				walletDisplay: formatAmount(walletRaw, decimals),
				dexDisplay: formatAmount(dexRaw, decimals),
				error: "",
			},
		};
	} catch (err) {
		const msg = typeof err?.shortMessage === "string" ? err.shortMessage : (err?.message || "Failed to load balances");
		balanceByKey.value = {
			...balanceByKey.value,
			[key]: { walletLoading: false, dexLoading: false, walletDisplay: "-", dexDisplay: "-", error: String(msg) },
		};
	}
}

async function refreshAllBalances() {
	if (!walletAddress.value) return;
	await Promise.all(coins.value.map(c => loadTokenBalances(c.key, (c.address || "").trim())));
}

function formatAddr(addr) {
	if (!addr) return "Not set";
	if (addr.length <= 12) return addr;
	return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function explorerAddressUrl(address) {
	return `${EXPLORER_BASE}/address/${address}`;
}

function onExplorerClick(event, address) {
	if (!address) event.preventDefault();
}

function onOpenToken(address) {
	const addr = String(address || "").trim();
	if (!addr) return;
	router.push({ name: "token", params: { address: addr } });
}

async function copy(key, text) {
	if (!text) return;

	let ok = false;
	try {
		if (navigator.clipboard?.writeText) {
			await navigator.clipboard.writeText(text);
			ok = true;
		}
	} catch {
		ok = false;
	}

	// fallback: some environments block Clipboard API
	if (!ok) {
		try {
			const el = document.createElement("textarea");
			el.value = text;
			el.setAttribute("readonly", "");
			el.style.position = "fixed";
			el.style.left = "-9999px";
			document.body.appendChild(el);
			el.select();
			ok = document.execCommand("copy");
			document.body.removeChild(el);
		} catch {
			ok = false;
		}
	}

	if (ok) {
		copiedKey.value = key;
		clearTimeout(copiedTimer);
		copiedTimer = setTimeout(() => {
			copiedKey.value = "";
		}, 1200);
	}
}

onMounted(async () => {
	await refreshWalletAddress();
	ethForListeners = typeof window !== "undefined" ? window.ethereum : undefined;
	if (ethForListeners?.on) {
		accountsHandler = accounts => {
			walletAddress.value = Array.isArray(accounts) && accounts[0] ? String(accounts[0]) : "";
		};
		chainHandler = () => {
			// 钱包切链后，地址可能不变，但余额展示仍可刷新
			refreshWalletAddress();
		};
		ethForListeners.on("accountsChanged", accountsHandler);
		ethForListeners.on("chainChanged", chainHandler);
	}

	loadingList.value = true;
	listError.value = "";
	try {
		const bases = await callDex("getSupportedBases");
		const list = Array.isArray(bases) ? bases : [];
		const normalized = list
			.map(a => String(a || "").trim())
			.filter(a => isAddress(a));
		const dedup = Array.from(new Set(normalized.map(a => a.toLowerCase())));

		coins.value = dedup.map(addrLower => {
			const original = normalized.find(a => a.toLowerCase() === addrLower) || addrLower;
			return { key: addrLower, address: original };
		});

		await Promise.all(coins.value.map(c => loadTokenMeta(c.key, (c.address || "").trim())));
		await refreshAllBalances();
	} catch (err) {
		const msg = typeof err?.shortMessage === "string" ? err.shortMessage : (err?.message || "Failed to load DEX supported list");
		listError.value = String(msg);
		coins.value = [];
	} finally {
		loadingList.value = false;
	}

});

watch(
	() => walletAddress.value,
	async () => {
		// Refresh balances after wallet connect/account switch.
		await refreshAllBalances();
	}
);

onBeforeUnmount(() => {
	clearTimeout(copiedTimer);
	if (ethForListeners?.removeListener) {
		if (accountsHandler) ethForListeners.removeListener("accountsChanged", accountsHandler);
		if (chainHandler) ethForListeners.removeListener("chainChanged", chainHandler);
	}
});
</script>

<style scoped>
.coins {
	max-width: 1280px;
	width: 100%;
	margin: 16px auto 0;
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

.note.warn {
	color: rgba(255, 110, 110, 0.9);
}

.grid {
	display: grid;
	grid-template-columns: repeat(4, minmax(0, 1fr));
	gap: 16px;
	align-items: stretch;
}

@media (max-width: 1240px) {
	.grid {
		grid-template-columns: repeat(3, minmax(0, 1fr));
	}
}

@media (max-width: 980px) {
	.grid {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}
}

@media (max-width: 560px) {
	.grid {
		grid-template-columns: 1fr;
	}
}

.card {
	--bg: #0b0f14;
	--panel2: rgba(255, 255, 255, 0.04);
	--text: rgba(255, 255, 255, 0.92);
	--muted: rgba(255, 255, 255, 0.55);

	border: 1px solid rgba(255, 255, 255, 0.09);
	border-radius: 14px;
	background: radial-gradient(900px 520px at 15% 0%, rgba(0, 208, 132, 0.10), transparent 55%),
		radial-gradient(820px 520px at 95% 5%, rgba(86, 195, 255, 0.08), transparent 60%),
		var(--bg);
	padding: 16px;
	color: var(--text);
	min-width: 0;
	overflow: hidden;
}

.card.clickable {
	cursor: pointer;
}

.card.clickable:hover {
	border-color: rgba(255, 255, 255, 0.18);
	background: radial-gradient(900px 520px at 15% 0%, rgba(0, 208, 132, 0.14), transparent 55%),
		radial-gradient(820px 520px at 95% 5%, rgba(255, 59, 105, 0.08), transparent 60%),
		#0b0f14;
}

.cardTop {
	display: flex;
	gap: 12px;
	align-items: center;
}

.symWrap {
	width: 40px;
	height: 40px;
	border: 1px solid rgba(255, 255, 255, 0.10);
	border-radius: 12px;
	display: flex;
	align-items: center;
	justify-content: center;
	flex: 0 0 auto;
	overflow: hidden;
	background: rgba(255, 255, 255, 0.04);
}

.icon {
	width: 28px;
	height: 28px;
	display: block;
}

.sym {
	font-size: 13px;
	font-weight: 700;
}

.meta {
	min-width: 0;
}

.name {
	font-size: 17px;
	font-weight: 700;
}

.hint {
	font-size: 14px;
	color: rgba(255, 255, 255, 0.55);
	margin-top: 2px;
}

.sep {
	margin: 0 6px;
}

.loading {
	margin-left: 6px;
	font-size: 14px;
	color: rgba(255, 255, 255, 0.55);
	font-weight: 600;
}

.rows {
	margin-top: 12px;
}

.row {
	display: flex;
	justify-content: space-between;
	gap: 12px;
	padding: 8px 0;
}

.label {
	font-size: 14px;
	color: rgba(255, 255, 255, 0.55);
	font-weight: 600;
}

.value {
	font-size: 14px;
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

.actions {
	display: grid;
	grid-template-columns: 1fr;
	gap: 10px;
	margin-top: 12px;
}

.btn {
	height: 38px;
	padding: 0 12px;
	border: 1px solid rgba(255, 255, 255, 0.12);
	border-radius: 10px;
	background: rgba(255, 255, 255, 0.06);
	cursor: pointer;
	font-size: 15px;
	font-weight: 600;
	text-align: left;
	color: inherit;
	text-decoration: none;
	display: inline-flex;
	align-items: center;
}

.btn:hover {
	border-color: rgba(255, 255, 255, 0.22);
}

.btn:disabled,
.btn.disabled {
	opacity: 0.6;
	cursor: not-allowed;
	pointer-events: none;
}

.note {
	margin-top: 10px;
	font-size: 14px;
	color: rgba(255, 255, 255, 0.55);
}
</style>
