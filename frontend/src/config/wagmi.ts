import { getDefaultConfig } from "connectkit";
import { createConfig, http } from "wagmi";
import { type Chain } from "viem";

export const celoSepolia: Chain = {
  id: 44787,
  name: "Celo Sepolia",
  nativeCurrency: { name: "CELO", symbol: "CELO", decimals: 18 },
  rpcUrls: { default: { http: ["https://celo-sepolia.drpc.org"] } },
  blockExplorers: { default: { name: "Celoscan", url: "https://sepolia.celoscan.io" } },
  testnet: true,
};

export const config = createConfig(
  getDefaultConfig({
    chains: [celoSepolia],
    transports: { [celoSepolia.id]: http("https://celo-sepolia.drpc.org") },
    walletConnectProjectId: "demo",
    appName: "AuditVault",
    appDescription: "On-Chain Smart Contract Audit Registry",
  })
);
