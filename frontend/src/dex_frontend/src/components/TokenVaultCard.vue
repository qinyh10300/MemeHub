<template>
	<section class="vault">
		<div class="header">
			<div class="titleRow">
				<span class="badge">VAULT</span>
				<h2 class="title">Token Vault</h2>
			</div>
		</div>

		<div class="card">

			<div class="row">
				<div class="label">Wallet Balance</div>
				<div class="value mono">
					<span v-if="!walletAddress">Not connected</span>
					<span v-else-if="balancesLoading">Loading…</span>
					<span v-else>{{ walletBalanceWithUnit }}</span>
				</div>
			</div>

			<div class="row">
				<div class="label">DEX Balance</div>
				<div class="value mono">
					<span v-if="!walletAddress">Not connected</span>
					<span v-else-if="balancesLoading">Loading…</span>
					<span v-else>{{ dexBalanceWithUnit }}</span>
				</div>
			</div>

			<div class="row">
				<div class="label">Total</div>
				<div class="value mono">
					<span v-if="!walletAddress">Not connected</span>
					<span v-else-if="balancesLoading">Loading…</span>
					<span v-else>{{ totalBalanceWithUnit }}</span>
				</div>
			</div>

			<div class="form">
				<label class="inputLabel">Amount</label>
				<div class="inputWrap">
					<input
						v-model="amount"
						class="input"
						type="text"
						inputmode="decimal"
						placeholder="0.0"
					/>
					<div class="unit">{{ unitLabel }}</div>
				</div>
			</div>

			<div class="actions">
				<button class="cta cta--deposit" type="button" :disabled="busy" @click="onDeposit">
					{{ busy ? "Processing…" : "Deposit" }}
				</button>
				<button class="cta cta--withdraw" type="button" :disabled="busy" @click="onWithdraw">
					{{ busy ? "Processing…" : "Withdraw" }}
				</button>
			</div>

			<div v-if="error" class="msg error">{{ error }}</div>
			<div v-else-if="status" class="msg">{{ status }}</div>
		</div>
	</section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { Contract, JsonRpcProvider, formatUnits, isAddress, parseUnits } from "ethers";

import { PHAROS_ATLANTIC, PHAROS_ATLANTIC_EXPLORER_BASE, PHAROS_ATLANTIC_RPC_URL } from "../lib/pharos";
import { DEX_ADDRESS, callDex, ensurePharosChain, sendDex } from "../lib/dex";

const props = defineProps({
	tokenAddress: {
		type: String,
		required: true,
	},
	fallbackSymbol: {
		type: String,
		default: "",
	},
	fallbackDecimals: {
		type: Number,
		default: 18,
	},
});

const readProvider = new JsonRpcProvider(PHAROS_ATLANTIC_RPC_URL, PHAROS_ATLANTIC.chainId);

const walletAddress = ref("");
const metaLoading = ref(false);
const balancesLoading = ref(false);
const busy = ref(false);

const tokenName = ref("");
const tokenSymbol = ref(String(props.fallbackSymbol || ""));
const tokenDecimals = ref(Number.isFinite(Number(props.fallbackDecimals)) ? Number(props.fallbackDecimals) : 18);

const walletBalance = ref(0n);
const dexBalance = ref(0n);
const allowance = ref(0n);

const amount = ref("");
const error = ref("");
const status = ref("");

let ethForListeners;
let accountsHandler;
let chainHandler;

const ERC20_ABI = [
	"function name() view returns (string)",
	"function symbol() view returns (string)",
	"function decimals() view returns (uint8)",
	"function balanceOf(address) view returns (uint256)",
	"function allowance(address,address) view returns (uint256)",
	"function approve(address,uint256) returns (bool)",
];

const explorerUrl = computed(() => {
	const addr = String(props.tokenAddress || "").trim();
	return `${PHAROS_ATLANTIC_EXPLORER_BASE}/address/${addr}`;
});

const walletBalanceDisplay = computed(() => formatAmount(walletBalance.value));
const dexBalanceDisplay = computed(() => formatAmount(dexBalance.value));
const allowanceDisplay = computed(() => formatAmount(allowance.value));

const totalBalanceDisplay = computed(() => formatAmount((walletBalance.value ?? 0n) + (dexBalance.value ?? 0n)));

const unitLabel = computed(() => tokenSymbol.value || String(props.fallbackSymbol || "").trim() || "TOKEN");

const walletBalanceWithUnit = computed(() => {
	const u = String(unitLabel.value || "").trim();
	return u ? `${walletBalanceDisplay.value} ${u}` : walletBalanceDisplay.value;
});

const dexBalanceWithUnit = computed(() => {
	const u = String(unitLabel.value || "").trim();
	return u ? `${dexBalanceDisplay.value} ${u}` : dexBalanceDisplay.value;
});

const totalBalanceWithUnit = computed(() => {
	const u = String(unitLabel.value || "").trim();
	return u ? `${totalBalanceDisplay.value} ${u}` : totalBalanceDisplay.value;
});

function formatAddr(addr) {
	const a = String(addr || "");
	if (!a) return "-";
	if (a.length <= 12) return a;
	return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

function formatAmount(raw) {
	try {
		const s = formatUnits(raw ?? 0n, tokenDecimals.value ?? 18);
		if (!s.includes(".")) return s;
		const [a, b] = s.split(".");
		return `${a}.${(b || "").slice(0, 6)}`.replace(/\.$/, "");
	} catch {
		return String(raw ?? "0");
	}
}

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

function getReadTokenContract() {
	const addr = String(props.tokenAddress || "").trim();
	return new Contract(addr, ERC20_ABI, readProvider);
}

async function loadMeta() {
	error.value = "";
	status.value = "";

	const tokenAddr = String(props.tokenAddress || "").trim();
	tokenName.value = "";
	tokenSymbol.value = String(props.fallbackSymbol || "");
	tokenDecimals.value = Number.isFinite(Number(props.fallbackDecimals)) ? Number(props.fallbackDecimals) : 18;
	if (!isAddress(tokenAddr)) {
		error.value = "Invalid tokenAddress";
		return;
	}

	metaLoading.value = true;
	try {
		const token = getReadTokenContract();
		const [name, symbol, decimals] = await Promise.all([token.name(), token.symbol(), token.decimals()]);
		tokenName.value = String(name || "");
		tokenSymbol.value = String(symbol || "");
		tokenDecimals.value = Number(decimals);
	} catch (e) {
		error.value = e?.shortMessage || e?.message || "Failed to load token metadata";
	} finally {
		metaLoading.value = false;
	}
}

async function refreshBalances() {
	const trader = String(walletAddress.value || "").trim();
	const tokenAddr = String(props.tokenAddress || "").trim();
	if (!trader || !isAddress(trader) || !isAddress(tokenAddr)) return;

	balancesLoading.value = true;
	try {
		const token = getReadTokenContract();
		const [wb, db, alw] = await Promise.all([
			token.balanceOf(trader),
			callDex("baseBalance", trader, tokenAddr),
			token.allowance(trader, DEX_ADDRESS),
		]);
		walletBalance.value = BigInt(wb);
		dexBalance.value = BigInt(db);
		allowance.value = BigInt(alw);
	} catch (e) {
		error.value = e?.shortMessage || e?.message || "Failed to load balances";
	} finally {
		balancesLoading.value = false;
	}
}

function parseAmountOrThrow() {
	const s = String(amount.value || "").trim();
	if (!s) throw new Error("Enter an amount");
	const v = parseUnits(s, tokenDecimals.value ?? 18);
	if (v <= 0n) throw new Error("Amount must be greater than 0");
	return v;
}

async function getWriteTokenContract() {
	const eth = getEthereum();
	if (!eth?.request) throw new Error("Wallet extension not detected (window.ethereum).");
	await ensurePharosChain();
	await eth.request({ method: "eth_requestAccounts" });

	// 直接复用 BrowserProvider + signer（从 dex.js 里拿 ensurePharosChain 即可）
	const { BrowserProvider } = await import("ethers");
	const provider = new BrowserProvider(eth, "any");
	const signer = await provider.getSigner();
	return new Contract(String(props.tokenAddress || "").trim(), ERC20_ABI, signer);
}

async function ensureAllowance(required) {
	const trader = String(walletAddress.value || "").trim();
	if (!trader) {
		const eth = getEthereum();
		if (!eth?.request) throw new Error("Wallet extension not detected (window.ethereum).");
		await eth.request({ method: "eth_requestAccounts" });
		await refreshWalletAddress();
	}

	await refreshBalances();
	if (allowance.value >= required) return;

	status.value = "Approving...";
	const token = await getWriteTokenContract();
	const tx = await token.approve(DEX_ADDRESS, required);
	status.value = `Approval sent: ${tx.hash}`;
	await tx.wait();
	status.value = "Approval complete";
	await refreshBalances();
}

async function onDeposit() {
	error.value = "";
	status.value = "";
	busy.value = true;
	try {
		const tokenAddr = String(props.tokenAddress || "").trim();
		if (!isAddress(tokenAddr)) throw new Error("Invalid tokenAddress");
		const v = parseAmountOrThrow();
		await ensureAllowance(v);

		status.value = "Depositing to DEX...";
		const tx = await sendDex("depositBaseFor", tokenAddr, v);
		status.value = `Deposit sent: ${tx.hash}`;
		await tx.wait();
		status.value = "Deposit complete";
		await refreshBalances();
	} catch (e) {
		error.value = e?.shortMessage || e?.message || String(e);
	} finally {
		busy.value = false;
	}
}

async function onWithdraw() {
	error.value = "";
	status.value = "";
	busy.value = true;
	try {
		const tokenAddr = String(props.tokenAddress || "").trim();
		if (!isAddress(tokenAddr)) throw new Error("Invalid tokenAddress");
		const v = parseAmountOrThrow();

		status.value = "Withdrawing from DEX...";
		const tx = await sendDex("withdrawBaseFor", tokenAddr, v);
		status.value = `Withdraw sent: ${tx.hash}`;
		await tx.wait();
		status.value = "Withdraw complete";
		await refreshBalances();
	} catch (e) {
		error.value = e?.shortMessage || e?.message || String(e);
	} finally {
		busy.value = false;
	}
}

onMounted(async () => {
	await loadMeta();
	await refreshWalletAddress();
	await refreshBalances();

	ethForListeners = getEthereum();
	if (ethForListeners?.on) {
		accountsHandler = accounts => {
			walletAddress.value = Array.isArray(accounts) && accounts[0] ? String(accounts[0]) : "";
			refreshBalances();
		};
		chainHandler = () => {
			refreshWalletAddress();
			refreshBalances();
		};
		ethForListeners.on("accountsChanged", accountsHandler);
		ethForListeners.on("chainChanged", chainHandler);
	}
});

watch(
	() => String(props.tokenAddress || "").trim(),
	async () => {
		await loadMeta();
		await refreshBalances();
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
.vault {
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
	overflow: auto;
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

.sep {
	margin: 0 6px;
	color: rgba(255, 255, 255, 0.35);
}

.form {
	margin-top: 10px;
}

.inputLabel {
	display: block;
	font-size: 12px;
	color: rgba(255, 255, 255, 0.55);
	font-weight: 600;
	margin-bottom: 6px;
}

.input {
	width: 100%;
	height: 36px;
	padding: 0 10px;
	border: 1px solid rgba(255, 255, 255, 0.12);
	border-radius: 10px;
	font-size: 13px;
	background: rgba(255, 255, 255, 0.04);
	color: rgba(255, 255, 255, 0.90);
	outline: none;
}

.inputWrap {
	display: grid;
	grid-template-columns: 1fr auto;
	align-items: center;
	gap: 10px;
}

.unit {
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

.input:focus {
	border-color: rgba(86, 195, 255, 0.35);
}

.formHint {
	margin-top: 6px;
	font-size: 12px;
	color: rgba(255, 255, 255, 0.55);
}

.actions {
	display: grid;
	grid-template-columns: 1fr;
	gap: 10px;
	margin-top: 12px;
	justify-content: center;
	max-width: 420px;
	margin-left: auto;
	margin-right: auto;
	align-items: stretch;
}

.cta {
	height: 44px;
	border-radius: 14px;
	border: 1px solid rgba(255, 255, 255, 0.10);
	font-weight: 900;
	letter-spacing: 0.06em;
	color: rgba(255, 255, 255, 0.92);
	text-align: center;
	cursor: pointer;
	transition: transform 0.12s ease, background 0.12s ease, border-color 0.12s ease, opacity 0.12s ease;
}

.cta:hover:not(:disabled) {
	transform: translateY(-1px);
	border-color: rgba(255, 255, 255, 0.18);
}

.cta:disabled {
	opacity: 0.55;
	cursor: not-allowed;
}

.cta--deposit {
	background: linear-gradient(90deg, rgba(0, 208, 132, 0.30), rgba(86, 195, 255, 0.14));
	border-color: rgba(0, 208, 132, 0.40);
	box-shadow: 0 0 18px rgba(0, 208, 132, 0.18);
}

.cta--withdraw {
	background: linear-gradient(90deg, rgba(255, 59, 105, 0.28), rgba(255, 59, 105, 0.10));
	border-color: rgba(255, 59, 105, 0.40);
	box-shadow: 0 0 18px rgba(255, 59, 105, 0.16);
}

.msg {
	margin-top: 10px;
	font-size: 12px;
	color: rgba(255, 255, 255, 0.55);
	word-break: break-all;
}

.msg.error {
	color: rgba(255, 110, 110, 0.92);
}
</style>
