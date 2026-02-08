import { BrowserProvider, Contract, JsonRpcProvider } from "ethers";
import { PHAROS_ATLANTIC, PHAROS_ATLANTIC_RPC_URL } from "./pharos";
import dexAbi from "../abi/dex.abi.json";

export const DEX_ADDRESS = "0x887D9Af1241a176107d31Bb3C69787DFff6dbaD8";

let cachedReadProvider;

function normalizeHex(hex) {
    try {
        return `0x${BigInt(hex).toString(16)}`;
    } catch {
        return String(hex || "").toLowerCase();
    }
}

function toChainIdHex(chainId) {
    return `0x${Number(chainId).toString(16)}`;
}

export function getReadProvider() {
    if (!cachedReadProvider) {
        cachedReadProvider = new JsonRpcProvider(PHAROS_ATLANTIC_RPC_URL, PHAROS_ATLANTIC.chainId);
    }
    return cachedReadProvider;
}

export function getEthereum() {
    return typeof window !== "undefined" ? window.ethereum : undefined;
}

export function hasDexAbi() {
    return Array.isArray(dexAbi) && dexAbi.length > 0;
}

export async function ensurePharosChain() {
    const eth = getEthereum();
    if (!eth?.request) throw new Error("Wallet extension not detected (window.ethereum).");

    const targetChainIdHex = toChainIdHex(PHAROS_ATLANTIC.chainId);
    const current = await eth.request({ method: "eth_chainId" });
    if (normalizeHex(current) === normalizeHex(targetChainIdHex)) return;

    try {
        await eth.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: targetChainIdHex }],
        });
    } catch (switchErr) {
        // 4902: unknown chain
        if (switchErr?.code === 4902 || String(switchErr?.message || "").includes("4902")) {
            await eth.request({
                method: "wallet_addEthereumChain",
                params: [
                    {
                        chainId: targetChainIdHex,
                        chainName: PHAROS_ATLANTIC.chainName,
                        rpcUrls: PHAROS_ATLANTIC.rpcUrls,
                        blockExplorerUrls: PHAROS_ATLANTIC.blockExplorerUrls,
                        nativeCurrency: PHAROS_ATLANTIC.nativeCurrency,
                    },
                ],
            });
            await eth.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: targetChainIdHex }],
            });
        } else {
            throw switchErr;
        }
    }
}

export function getDexReadContract() {
    if (!hasDexAbi()) {
        throw new Error("DEX ABI is empty: replace src/abi/dex.abi.json with the real ABI");
    }
    return new Contract(DEX_ADDRESS, dexAbi, getReadProvider());
}

export async function getDexWriteContract() {
    const eth = getEthereum();
    if (!eth?.request) throw new Error("Wallet extension not detected (window.ethereum).");
    if (!hasDexAbi()) {
        throw new Error("DEX ABI is empty: replace src/abi/dex.abi.json with the real ABI");
    }

    await ensurePharosChain();
    await eth.request({ method: "eth_requestAccounts" });

    const provider = new BrowserProvider(eth, "any");
    const signer = await provider.getSigner();
    return new Contract(DEX_ADDRESS, dexAbi, signer);
}

// 只读调用：适合 view/pure
export async function callDex(method, ...args) {
    const c = getDexReadContract();
    const fn = c?.[method];
    if (typeof fn !== "function") throw new Error(`Method not found in DEX ABI: ${method}`);
    return await fn(...args);
}

// 写入交易：需要钱包签名
export async function sendDex(method, ...args) {
    const c = await getDexWriteContract();
    const fn = c?.[method];
    if (typeof fn !== "function") throw new Error(`Method not found in DEX ABI: ${method}`);
    return await fn(...args);
}

export const dex = {
    address: DEX_ADDRESS,
    chainId: PHAROS_ATLANTIC.chainId,
    hasAbi: hasDexAbi,
    ensurePharosChain,
    getDexReadContract,
    getDexWriteContract,
    call: callDex,
    send: sendDex,
};
