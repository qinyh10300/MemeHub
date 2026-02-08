// Pharos Atlantic Testnet config (EVM)
// Keep chain-specific values in one place for reuse across components.

export const PHAROS_ATLANTIC = {
    chainId: 688689,
    chainName: "Pharos Atlantic Testnet",
    rpcUrls: ["https://atlantic.dplabs-internal.com"],
    blockExplorerUrls: ["https://atlantic.pharosscan.xyz"],
    nativeCurrency: {
        name: "Pharos",
        symbol: "PHAR",
        decimals: 18,
    },
};

export const PHAROS_ATLANTIC_RPC_URL = PHAROS_ATLANTIC.rpcUrls[0];
export const PHAROS_ATLANTIC_EXPLORER_BASE = PHAROS_ATLANTIC.blockExplorerUrls[0];
