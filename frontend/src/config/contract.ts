export const AUDIT_VAULT_ADDRESS = "0x5e1024891C900c757Eb3a60f11A1A6Dcb8341C7F" as const;

export const AUDIT_VAULT_ABI = [
  // Auditor
  { type: "function", name: "registerAuditor", inputs: [{ name: "name", type: "string" }, { name: "url", type: "string" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "verifyAuditor", inputs: [{ name: "auditor", type: "address" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "auditors", inputs: [{ name: "", type: "address" }], outputs: [
    { name: "name", type: "string" }, { name: "url", type: "string" },
    { name: "auditsCompleted", type: "uint256" }, { name: "findingsTotal", type: "uint256" },
    { name: "criticalFindings", type: "uint256" }, { name: "registeredAt", type: "uint256" },
    { name: "verified", type: "bool" }, { name: "reputationScore", type: "uint256" }
  ], stateMutability: "view" },

  // Audit submission
  { type: "function", name: "submitAudit", inputs: [
    { name: "contractAddress", type: "address" }, { name: "chainId", type: "uint256" },
    { name: "reportHash", type: "string" }, { name: "securityScore", type: "uint256" },
    { name: "projectOwner", type: "address" }
  ], outputs: [{ type: "uint256" }], stateMutability: "nonpayable" },

  // Findings
  { type: "function", name: "addFinding", inputs: [
    { name: "reportId", type: "uint256" }, { name: "severity", type: "uint8" },
    { name: "title", type: "string" }, { name: "description", type: "string" }
  ], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "acknowledgeFinding", inputs: [{ name: "reportId", type: "uint256" }, { name: "findingIndex", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "resolveFinding", inputs: [{ name: "reportId", type: "uint256" }, { name: "findingIndex", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },

  // Status
  { type: "function", name: "verifyAudit", inputs: [{ name: "reportId", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "disputeAudit", inputs: [{ name: "reportId", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "resolveDispute", inputs: [{ name: "reportId", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },

  // Views
  { type: "function", name: "getReport", inputs: [{ name: "reportId", type: "uint256" }], outputs: [
    { name: "contractAddress", type: "address" }, { name: "chainId", type: "uint256" },
    { name: "auditor", type: "address" }, { name: "timestamp", type: "uint256" },
    { name: "status", type: "uint8" }, { name: "reportHash", type: "string" },
    { name: "securityScore", type: "uint256" }, { name: "findingCount", type: "uint256" },
    { name: "projectOwner", type: "address" }, { name: "projectVerified", type: "bool" }
  ], stateMutability: "view" },
  { type: "function", name: "getFinding", inputs: [{ name: "reportId", type: "uint256" }, { name: "findingIndex", type: "uint256" }], outputs: [
    { name: "severity", type: "uint8" }, { name: "title", type: "string" },
    { name: "description", type: "string" }, { name: "acknowledged", type: "bool" },
    { name: "resolved", type: "bool" }
  ], stateMutability: "view" },
  { type: "function", name: "getContractAuditCount", inputs: [{ name: "contractAddress", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "getContractAuditIds", inputs: [{ name: "contractAddress", type: "address" }], outputs: [{ type: "uint256[]" }], stateMutability: "view" },
  { type: "function", name: "getAuditorReportIds", inputs: [{ name: "auditor", type: "address" }], outputs: [{ type: "uint256[]" }], stateMutability: "view" },
  { type: "function", name: "getSecurityScore", inputs: [{ name: "contractAddress", type: "address" }], outputs: [{ name: "avgScore", type: "uint256" }, { name: "auditCount", type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "isAudited", inputs: [{ name: "contractAddress", type: "address" }], outputs: [{ type: "bool" }], stateMutability: "view" },
  { type: "function", name: "nextReportId", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "totalAudits", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "totalFindings", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "owner", inputs: [], outputs: [{ type: "address" }], stateMutability: "view" },

  // Events
  { type: "event", name: "AuditorRegistered", inputs: [{ name: "auditor", type: "address", indexed: true }, { name: "name", type: "string" }] },
  { type: "event", name: "AuditSubmitted", inputs: [{ name: "reportId", type: "uint256", indexed: true }, { name: "contractAddress", type: "address", indexed: true }, { name: "auditor", type: "address", indexed: true }, { name: "securityScore", type: "uint256" }] },
  { type: "event", name: "FindingAdded", inputs: [{ name: "reportId", type: "uint256", indexed: true }, { name: "findingIndex", type: "uint256" }, { name: "severity", type: "uint8" }, { name: "title", type: "string" }] },
] as const;
