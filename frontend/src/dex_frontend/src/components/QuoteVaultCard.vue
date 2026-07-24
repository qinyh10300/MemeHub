<template>
	<section class="vault">
		<div class="header">
			<h2 class="title">Quote Vault</h2>
			<div class="sub">Deposit / Withdraw quote</div>
		</div>

		<div class="card">
			<div class="row">
				<div class="label">Quote</div>
				<div class="value">
					<span v-if="metaLoading">Loading…</span>
					<span v-else>{{ quoteName || "-" }}</span>
					<span class="sep">·</span>
					<span class="mono">{{ quoteSymbol || "-" }}</span>
				</div>
			</div>

			<div class="row">
				<div class="label">Contract Address</div>
				<div class="value mono" :title="quoteTokenAddress">{{ formatAddr(quoteTokenAddress) }}</div>
			</div>

			<div class="row">
				<div class="label">Wallet Balance</div>
				<div class="value mono">
					<span v-if="!walletAddress">Not connected</span>
					<span v-else-if="balancesLoading">Loading…</span>
					<span v-else>{{ walletBalanceDisplay }}</span>
				</div>
			</div>

			<div class="row">
				<div class="label">DEX Deposited</div>
				<div class="value mono">
					<span v-if="!walletAddress">Not connected</span>
					<span v-else-if="balancesLoading">Loading…</span>
					<span v-else>{{ dexBalanceDisplay }}</span>
				</div>
			</div>

			<div class="row">
				<div class="label">Allowance</div>
				<div class="value mono">
					<span v-if="!walletAddress">-</span>
					<span v-else-if="balancesLoading">Loading…</span>
					<span v-else>{{ allowanceDisplay }}</span>
				</div>
			</div>

			<div class="form">
				<label class="inputLabel">Amount</label>
				<input v-model="amount" class="input" type="text" inputmode="decimal" placeholder="0.0" />
				<div class="formHint">Unit: {{ quoteSymbol || "quote" }}</div>
			</div>

			<div class="actions">
				<button class="btn" type="button" :disabled="busy" @click="onDeposit">
					{{ busy ? "Processing…" : "Deposit Quote" }}
				</button>
				<button class="btn" type="button" :disabled="busy" @click="onWithdraw">
					{{ busy ? "Processing…" : "Withdraw Quote" }}
				</button>
			</div>

			<div v-if="error" class="msg error">{{ error }}</div>
			<div v-else-if="status" class="msg">{{ status }}</div>
		</div>
	</section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { BrowserProvider, Contract, JsonRpcProvider, formatUnits, isAddress, parseUnits } from "ethers";

import { PHAROS_ATLANTIC, PHAROS_ATLANTIC_RPC_URL } from "../lib/pharos";
import { DEX_ADDRESS, callDex, ensurePharosChain, sendDex } from "../lib/dex";

const readProvider = new JsonRpcProvider(PHAROS_ATLANTIC_RPC_URL, PHAROS_ATLANTIC.chainId);

const walletAddress = ref("");
const metaLoading = ref(false);
const balancesLoading = ref(false);
const busy = ref(false);

const quoteTokenAddress = ref("");
const quoteName = ref("");
const quoteSymbol = ref("");
const quoteDecimals = ref(18);

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
	"function balanceOf(address) view returns (uint256)",
	"function allowance(address,address) view returns (uint256)",
	"function approve(address,uint256) returns (bool)",
];

const walletBalanceDisplay = computed(() => formatAmount(walletBalance.value));
const dexBalanceDisplay = computed(() => formatAmount(dexBalance.value));
const allowanceDisplay = computed(() => formatAmount(allowance.value));

function getEthereum() {
	return typeof window !== "undefined" ? window.ethereum : undefined;
}

function formatAddr(addr) {
	const a = String(addr || "");
	if (!a) return "-";
	if (a.length <= 12) return a;
	return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

function formatAmount(raw) {
	try {
		const s = formatUnits(raw ?? 0n, quoteDecimals.value ?? 18);
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

async function loadQuoteMeta() {
	error.value = "";
	status.value = "";
	metaLoading.value = true;
	try {
		const [qt, qd] = await Promise.all([callDex("quoteToken"), callDex("quoteDecimals")]);
		quoteTokenAddress.value = String(qt || "");
		quoteDecimals.value = Number(qd);

		if (isAddress(String(qt || ""))) {
			const token = new Contract(String(qt).trim(), ERC20_ABI, readProvider);
			const [n, s] = await Promise.all([token.name(), token.symbol()]);
			quoteName.value = String(n || "");
			quoteSymbol.value = String(s || "");
		}
	} catch (e) {
		error.value = e?.shortMessage || e?.message || "Failed to load quote info";
	} finally {
		metaLoading.value = false;
	}
}

async function refreshBalances() {
	const trader = String(walletAddress.value || "").trim();
	const qt = String(quoteTokenAddress.value || "").trim();
	if (!trader || !isAddress(trader) || !qt || !isAddress(qt)) return;

	balancesLoading.value = true;
	try {
		const token = new Contract(qt, ERC20_ABI, readProvider);
		const [wb, db, alw] = await Promise.all([
			token.balanceOf(trader),
			callDex("quoteBalance", trader),
			token.allowance(trader, DEX_ADDRESS),
		]);
		walletBalance.value = BigInt(wb);
		dexBalance.value = BigInt(db);
		allowance.value = BigInt(alw);
	} catch (e) {
		error.value = e?.shortMessage || e?.message || "Failed to load quote balance";
	} finally {
		balancesLoading.value = false;
	}
}

function parseAmountOrThrow() {
	const s = String(amount.value || "").trim();
	if (!s) throw new Error("Enter an amount");
	const v = parseUnits(s, quoteDecimals.value ?? 18);
	if (v <= 0n) throw new Error("Amount must be greater than 0");
	return v;
}

async function getWriteQuoteTokenContract() {
	const eth = getEthereum();
	if (!eth?.request) throw new Error("Wallet extension not detected (window.ethereum).");
	await ensurePharosChain();
	await eth.request({ method: "eth_requestAccounts" });

	const qt = String(quoteTokenAddress.value || "").trim();
	if (!isAddress(qt)) throw new Error("Invalid quoteToken");

	const provider = new BrowserProvider(eth, "any");
	const signer = await provider.getSigner();
	return new Contract(qt, ERC20_ABI, signer);
}

async function ensureAllowance(required) {
	await refreshBalances();
	if (allowance.value >= required) return;

	status.value = "Approving quote...";
	const token = await getWriteQuoteTokenContract();
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
		const v = parseAmountOrThrow();
		await ensureAllowance(v);
		status.value = "Depositing quote...";
		const tx = await sendDex("depositQuote", v);
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
		const v = parseAmountOrThrow();
		status.value = "Withdrawing quote...";
		const tx = await sendDex("withdrawQuote", v);
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
	await loadQuoteMeta();
	await refreshWalletAddress();
	await refreshBalances();

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
	font-size: 16px;
	color: rgba(255, 255, 255, 0.92);
}

.sub {
	font-size: 12px;
	color: rgba(255, 255, 255, 0.55);
}

.card {
	--bg: #0b0f14;
	--panel2: rgba(255, 255, 255, 0.04);
	--text: rgba(255, 255, 255, 0.92);
	--muted: rgba(255, 255, 255, 0.55);

	background: radial-gradient(900px 520px at 15% 0%, rgba(0, 208, 132, 0.08), transparent 55%),
		radial-gradient(820px 520px at 95% 5%, rgba(86, 195, 255, 0.08), transparent 60%),
		var(--bg);
	border: 1px solid rgba(255, 255, 255, 0.09);
	border-radius: 14px;
	padding: 14px;
	color: var(--text);
}

.row {
	display: flex;
	justify-content: space-between;
	gap: 12px;
	padding: 6px 0;
}

.label {
	font-size: 12px;
	color: var(--muted);
	font-weight: 700;
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
	color: rgba(255, 255, 255, 0.25);
}

.form {
	margin-top: 10px;
}

.inputLabel {
	display: block;
	font-size: 12px;
	color: var(--muted);
	font-weight: 700;
	margin-bottom: 6px;
}

.input {
	width: 100%;
	height: 36px;
	padding: 0 10px;
	border: 1px solid rgba(255, 255, 255, 0.12);
	border-radius: 12px;
	font-size: 13px;
	background: rgba(255, 255, 255, 0.04);
	color: rgba(255, 255, 255, 0.92);
	outline: none;
}

.formHint {
	margin-top: 6px;
	font-size: 12px;
	color: rgba(255, 255, 255, 0.55);
}

.actions {
	display: grid;
	grid-template-columns: 1fr;
	gap: 8px;
	margin-top: 10px;
}

.btn {
	height: 34px;
	padding: 0 10px;
	border: 1px solid rgba(255, 255, 255, 0.12);
	border-radius: 12px;
	background: rgba(255, 255, 255, 0.06);
	cursor: pointer;
	font-size: 13px;
	font-weight: 800;
	text-align: left;
	color: rgba(255, 255, 255, 0.92);
}

.btn:hover {
	border-color: rgba(255, 255, 255, 0.22);
}

.btn:disabled {
	opacity: 0.6;
	cursor: not-allowed;
}

.msg {
	margin-top: 10px;
	font-size: 12px;
	color: rgba(255, 255, 255, 0.55);
	word-break: break-all;
}

.msg.error {
	color: rgba(255, 110, 110, 0.9);
}
</style>
