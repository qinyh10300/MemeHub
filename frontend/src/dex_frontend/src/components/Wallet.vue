<template>
	<div class="wallet">
		<button
			class="walletBtn"
			type="button"
			:disabled="!hasProvider"
			@click.stop="onPrimaryClick"
		>
			<span v-if="!hasProvider">Wallet not detected</span>
			<span v-else-if="!isConnected">Connect Wallet</span>
			<span v-else>{{ shortAddress }}</span>
		</button>

		<div v-if="menuOpen && hasProvider" class="menu" @click.stop>
			<div class="row">
				<div class="label">Network</div>
				<div class="value" :class="{ warn: !isOnTargetChain }">
					{{ networkLabel }}
				</div>
			</div>

			<div v-if="isConnected" class="row">
				<div class="label">Address</div>
				<div class="value mono">{{ shortAddress }}</div>
			</div>

			<div class="actions">
				<button
					v-if="isConnected"
					class="actionBtn"
					type="button"
					@click="copyAddress"
				>
					Copy Address
				</button>

				<button
					v-if="hasProvider"
					class="actionBtn"
					type="button"
					@click="ensureTargetChain"
				>
					Switch to Pharos Atlantic
				</button>

				<button
					v-if="!isConnected"
					class="actionBtn primary"
					type="button"
					@click="connect"
				>
					Connect
				</button>

				<button
					v-else
					class="actionBtn danger"
					type="button"
					@click="disconnect"
				>
					Disconnect
				</button>
			</div>

			<div v-if="errorMessage" class="error">{{ errorMessage }}</div>
		</div>
	</div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

import { PHAROS_ATLANTIC as TARGET_CHAIN } from "../lib/pharos";

const hasProvider = computed(() => typeof window !== "undefined" && !!window.ethereum);

const account = ref("");
const chainIdHex = ref("");
const menuOpen = ref(false);
const errorMessage = ref("");

const isConnected = computed(() => !!account.value);
const targetChainIdHex = computed(() => toChainIdHex(TARGET_CHAIN.chainId));
const isOnTargetChain = computed(() => {
	if (!chainIdHex.value) return false;
	return normalizeHex(chainIdHex.value) === normalizeHex(targetChainIdHex.value);
});

const shortAddress = computed(() => {
	if (!account.value) return "";
	return `${account.value.slice(0, 6)}…${account.value.slice(-4)}`;
});

const networkLabel = computed(() => {
	if (!chainIdHex.value) return "Unknown";
	if (isOnTargetChain.value) return TARGET_CHAIN.chainName;
	return `Wrong network (${chainIdHex.value})`;
});

function toChainIdHex(chainId) {
	return `0x${Number(chainId).toString(16)}`;
}

function normalizeHex(hex) {
	try {
		return `0x${BigInt(hex).toString(16)}`;
	} catch {
		return String(hex || "").toLowerCase();
	}
}

async function refreshState() {
	errorMessage.value = "";
	if (!window.ethereum) return;

	const [accounts, currentChainId] = await Promise.all([
		window.ethereum.request({ method: "eth_accounts" }),
		window.ethereum.request({ method: "eth_chainId" }),
	]);

	account.value = accounts?.[0] ?? "";
	chainIdHex.value = currentChainId ?? "";
}

async function connect() {
	errorMessage.value = "";
	if (!window.ethereum) {
		errorMessage.value = "Wallet extension not detected (e.g., MetaMask).";
		return;
	}

	try {
		const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
		account.value = accounts?.[0] ?? "";
		chainIdHex.value = await window.ethereum.request({ method: "eth_chainId" });

		await ensureTargetChain();
	} catch (err) {
		errorMessage.value = humanizeProviderError(err);
	}
}

async function ensureTargetChain() {
	errorMessage.value = "";
	if (!window.ethereum) return;

	try {
		const current = (await window.ethereum.request({ method: "eth_chainId" })) ?? "";
		chainIdHex.value = current;
		if (normalizeHex(current) === normalizeHex(targetChainIdHex.value)) return;

		try {
			await window.ethereum.request({
				method: "wallet_switchEthereumChain",
				params: [{ chainId: targetChainIdHex.value }],
			});
		} catch (switchErr) {
			// 4902: unknown chain
			if (switchErr?.code === 4902 || String(switchErr?.message || "").includes("4902")) {
				await window.ethereum.request({
					method: "wallet_addEthereumChain",
					params: [
						{
							chainId: targetChainIdHex.value,
							chainName: TARGET_CHAIN.chainName,
							rpcUrls: TARGET_CHAIN.rpcUrls,
							blockExplorerUrls: TARGET_CHAIN.blockExplorerUrls,
							nativeCurrency: TARGET_CHAIN.nativeCurrency,
						},
					],
				});
				await window.ethereum.request({
					method: "wallet_switchEthereumChain",
					params: [{ chainId: targetChainIdHex.value }],
				});
			} else {
				throw switchErr;
			}
		}

		chainIdHex.value = await window.ethereum.request({ method: "eth_chainId" });
	} catch (err) {
		errorMessage.value = humanizeProviderError(err);
	}
}

function disconnect() {
	// EIP-1193 providers typically don't support programmatic disconnect; clear local state only.
	menuOpen.value = false;
	account.value = "";
	errorMessage.value = "";
}

async function copyAddress() {
	if (!account.value) return;
	try {
		await navigator.clipboard.writeText(account.value);
	} catch {
		// ignore
	}
}

function onPrimaryClick() {
	if (!hasProvider.value) return;

	if (!isConnected.value) {
		connect();
		return;
	}

	menuOpen.value = !menuOpen.value;
}

function onDocClick() {
	menuOpen.value = false;
}

function humanizeProviderError(err) {
	if (!err) return "Operation failed";
	if (err?.code === 4001) return "User rejected the request";
	if (typeof err?.message === "string" && err.message.trim()) return err.message;
	return "Operation failed";
}

function onAccountsChanged(accounts) {
	account.value = accounts?.[0] ?? "";
}

function onChainChanged(newChainId) {
	chainIdHex.value = newChainId ?? "";
}

onMounted(async () => {
	if (window.ethereum?.on) {
		window.ethereum.on("accountsChanged", onAccountsChanged);
		window.ethereum.on("chainChanged", onChainChanged);
	}
	document.addEventListener("click", onDocClick);
	await refreshState();
});

onBeforeUnmount(() => {
	document.removeEventListener("click", onDocClick);
	if (window.ethereum?.removeListener) {
		window.ethereum.removeListener("accountsChanged", onAccountsChanged);
		window.ethereum.removeListener("chainChanged", onChainChanged);
	}
});
</script>

<style scoped>
.wallet {
	position: relative;
	display: inline-block;
}

.walletBtn {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	height: 36px;
	padding: 0 12px;
	border: 1px solid rgba(255, 255, 255, 0.12);
	border-radius: 999px;
	background: rgba(255, 255, 255, 0.06);
	cursor: pointer;
	font-size: 14px;
	font-weight: 600;
	line-height: 1;
	user-select: none;
	color: rgba(255, 255, 255, 0.88);
}

.walletBtn:hover {
	border-color: rgba(255, 255, 255, 0.22);
}

.walletBtn:active {
	border-color: rgba(255, 255, 255, 0.30);
}

.walletBtn:disabled {
	opacity: 0.6;
	cursor: not-allowed;
}

.menu {
	position: absolute;
	right: 0;
	margin-top: 8px;
	width: 260px;
	border: 1px solid rgba(255, 255, 255, 0.10);
	border-radius: 12px;
	background: radial-gradient(900px 520px at 15% 0%, rgba(0, 208, 132, 0.10), transparent 55%),
		radial-gradient(820px 520px at 95% 5%, rgba(255, 59, 105, 0.08), transparent 60%),
		#0b0f14;
	padding: 12px;
	z-index: 10;
}

.row {
	display: flex;
	justify-content: space-between;
	gap: 12px;
	padding: 6px 0;
}

.label {
	color: rgba(255, 255, 255, 0.55);
	font-size: 12px;
	font-weight: 600;
}

.value {
	text-align: right;
	font-size: 12px;
	color: rgba(255, 255, 255, 0.88);
}

.warn {
	color: rgba(255, 211, 106, 0.95);
}

.mono {
	font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New",
		monospace;
}

.actions {
	display: grid;
	grid-template-columns: 1fr;
	gap: 8px;
	margin-top: 10px;
}

.actionBtn {
	height: 34px;
	padding: 0 10px;
	border: 1px solid rgba(255, 255, 255, 0.12);
	border-radius: 10px;
	background: rgba(255, 255, 255, 0.06);
	cursor: pointer;
	font-size: 13px;
	font-weight: 600;
	text-align: left;
	color: rgba(255, 255, 255, 0.88);
}

.actionBtn:hover {
	border-color: rgba(255, 255, 255, 0.22);
}

.actionBtn.primary {
	border-color: rgba(0, 208, 132, 0.35);
}

.actionBtn.danger {
	border-color: rgba(255, 59, 105, 0.45);
}

.error {
	margin-top: 10px;
	color: rgba(255, 110, 110, 0.9);
	font-size: 12px;
	word-break: break-word;
}
</style>
