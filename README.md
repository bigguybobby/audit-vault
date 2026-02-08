# 🔐 AuditVault — On-Chain Smart Contract Audit Registry

> Decentralized registry for audit reports, security scores, and auditor reputation
> Targeting: Optimism Season 9 Audit Grants, Scroll Security Subsidy

## Features
- **Auditor Registration** — register with name, URL; get verified by registry owner
- **Audit Report Submission** — submit reports with IPFS hash, security score, chain ID
- **Finding Management** — add findings by severity (Info/Low/Medium/High/Critical)
- **Project Verification** — project owners can verify, acknowledge findings, or dispute
- **Dispute Resolution** — owner-mediated dispute resolution flow
- **Reputation System** — automatic scoring based on audits completed + verification status
- **Security Scores** — per-contract average score across multiple audits
- **On-Chain Audit Trail** — full history of audits, findings, and resolutions

## Deployed
- **Celo Sepolia:** `0x5e1024891C900c757Eb3a60f11A1A6Dcb8341C7F`

## Tests & Coverage
- **37/37 tests passing**
- **100% line coverage**, 99% statement, 95% branch, 100% function
- Slither clean — no critical/high findings

## Tech Stack
- Solidity 0.8.20 + Foundry
- Next.js + TypeScript + Tailwind (frontend)
- wagmi + viem + ConnectKit

## Use Cases
1. **Audit firms** register and publish audit reports on-chain
2. **Projects** verify audits and track finding resolution
3. **Users/Investors** check if a contract has been audited and its security score
4. **Grant programs** verify audit completion for subsidy disbursement
