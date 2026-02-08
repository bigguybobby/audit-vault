// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title AuditVault — On-Chain Smart Contract Audit Registry
/// @notice Decentralized registry for audit reports, security scores, and auditor reputation
/// @dev Designed for Optimism Season 9 Audit Grants & security tooling grants
contract AuditVault {
    // ─── Types ───────────────────────────────────────────────────────────

    enum Severity { Info, Low, Medium, High, Critical }
    enum AuditStatus { Submitted, Verified, Disputed, Resolved }

    struct Auditor {
        string name;
        string url;             // website/profile
        uint256 auditsCompleted;
        uint256 findingsTotal;
        uint256 criticalFindings;
        uint256 registeredAt;
        bool verified;          // verified by registry owner
        uint256 reputationScore; // 0-10000 (basis points)
    }

    struct Finding {
        Severity severity;
        string title;
        string description;     // can be IPFS hash for full report
        bool acknowledged;      // project team acknowledged
        bool resolved;          // project team resolved
    }

    struct AuditReport {
        address contractAddress; // audited contract
        uint256 chainId;         // chain where contract is deployed
        address auditor;
        uint256 timestamp;
        AuditStatus status;
        string reportHash;       // IPFS hash of full report
        uint256 securityScore;   // 0-100
        uint256 findingCount;
        mapping(uint256 => Finding) findings;
        address projectOwner;
        bool projectVerified;    // project owner confirmed
    }

    // ─── State ───────────────────────────────────────────────────────────

    mapping(address => Auditor) public auditors;
    mapping(uint256 => AuditReport) private reports;
    mapping(address => uint256[]) public contractAudits; // contract => report IDs
    mapping(address => uint256[]) public auditorReports;  // auditor => report IDs

    uint256 public nextReportId;
    address public owner;
    uint256 public totalAudits;
    uint256 public totalFindings;

    // ─── Events ──────────────────────────────────────────────────────────

    event AuditorRegistered(address indexed auditor, string name);
    event AuditorVerified(address indexed auditor);
    event AuditSubmitted(uint256 indexed reportId, address indexed contractAddress, address indexed auditor, uint256 securityScore);
    event FindingAdded(uint256 indexed reportId, uint256 findingIndex, Severity severity, string title);
    event FindingAcknowledged(uint256 indexed reportId, uint256 findingIndex);
    event FindingResolved(uint256 indexed reportId, uint256 findingIndex);
    event AuditVerifiedByProject(uint256 indexed reportId, address indexed projectOwner);
    event AuditDisputed(uint256 indexed reportId, address indexed disputer);
    event AuditResolved(uint256 indexed reportId);

    // ─── Modifiers ───────────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    modifier onlyRegisteredAuditor() {
        require(auditors[msg.sender].registeredAt > 0, "not registered auditor");
        _;
    }

    modifier onlyReportAuditor(uint256 reportId) {
        require(reports[reportId].auditor == msg.sender, "not report auditor");
        _;
    }

    modifier onlyProjectOwner(uint256 reportId) {
        require(reports[reportId].projectOwner == msg.sender, "not project owner");
        _;
    }

    // ─── Constructor ─────────────────────────────────────────────────────

    constructor() {
        owner = msg.sender;
    }

    // ─── Auditor Management ──────────────────────────────────────────────

    function registerAuditor(string calldata name, string calldata url) external {
        require(auditors[msg.sender].registeredAt == 0, "already registered");
        require(bytes(name).length > 0, "name required");

        auditors[msg.sender] = Auditor({
            name: name,
            url: url,
            auditsCompleted: 0,
            findingsTotal: 0,
            criticalFindings: 0,
            registeredAt: block.timestamp,
            verified: false,
            reputationScore: 5000 // start at 50%
        });
        emit AuditorRegistered(msg.sender, name);
    }

    function verifyAuditor(address auditor) external onlyOwner {
        require(auditors[auditor].registeredAt > 0, "not registered");
        auditors[auditor].verified = true;
        auditors[auditor].reputationScore = 7500; // bump to 75% on verification
        emit AuditorVerified(auditor);
    }

    // ─── Audit Submission ────────────────────────────────────────────────

    function submitAudit(
        address contractAddress,
        uint256 chainId,
        string calldata reportHash,
        uint256 securityScore,
        address projectOwner
    ) external onlyRegisteredAuditor returns (uint256 reportId) {
        require(contractAddress != address(0), "invalid contract");
        require(securityScore <= 100, "score must be 0-100");
        require(bytes(reportHash).length > 0, "report hash required");

        reportId = nextReportId++;
        AuditReport storage r = reports[reportId];
        r.contractAddress = contractAddress;
        r.chainId = chainId;
        r.auditor = msg.sender;
        r.timestamp = block.timestamp;
        r.status = AuditStatus.Submitted;
        r.reportHash = reportHash;
        r.securityScore = securityScore;
        r.projectOwner = projectOwner;

        contractAudits[contractAddress].push(reportId);
        auditorReports[msg.sender].push(reportId);

        auditors[msg.sender].auditsCompleted++;
        totalAudits++;

        // Update reputation based on audit count
        _updateReputation(msg.sender);

        emit AuditSubmitted(reportId, contractAddress, msg.sender, securityScore);
    }

    // ─── Findings Management ─────────────────────────────────────────────

    function addFinding(
        uint256 reportId,
        Severity severity,
        string calldata title,
        string calldata description
    ) external onlyReportAuditor(reportId) {
        require(reports[reportId].status == AuditStatus.Submitted || reports[reportId].status == AuditStatus.Verified, "cannot add to this report");

        uint256 idx = reports[reportId].findingCount++;
        reports[reportId].findings[idx] = Finding({
            severity: severity,
            title: title,
            description: description,
            acknowledged: false,
            resolved: false
        });

        auditors[msg.sender].findingsTotal++;
        if (severity == Severity.Critical) {
            auditors[msg.sender].criticalFindings++;
        }
        totalFindings++;

        emit FindingAdded(reportId, idx, severity, title);
    }

    function acknowledgeFinding(uint256 reportId, uint256 findingIndex) external onlyProjectOwner(reportId) {
        require(findingIndex < reports[reportId].findingCount, "invalid finding");
        reports[reportId].findings[findingIndex].acknowledged = true;
        emit FindingAcknowledged(reportId, findingIndex);
    }

    function resolveFinding(uint256 reportId, uint256 findingIndex) external onlyProjectOwner(reportId) {
        require(findingIndex < reports[reportId].findingCount, "invalid finding");
        reports[reportId].findings[findingIndex].resolved = true;
        emit FindingResolved(reportId, findingIndex);
    }

    // ─── Report Status ───────────────────────────────────────────────────

    function verifyAudit(uint256 reportId) external onlyProjectOwner(reportId) {
        reports[reportId].projectVerified = true;
        reports[reportId].status = AuditStatus.Verified;
        emit AuditVerifiedByProject(reportId, msg.sender);
    }

    function disputeAudit(uint256 reportId) external onlyProjectOwner(reportId) {
        require(reports[reportId].status != AuditStatus.Resolved, "already resolved");
        reports[reportId].status = AuditStatus.Disputed;
        emit AuditDisputed(reportId, msg.sender);
    }

    function resolveDispute(uint256 reportId) external onlyOwner {
        require(reports[reportId].status == AuditStatus.Disputed, "not disputed");
        reports[reportId].status = AuditStatus.Resolved;
        emit AuditResolved(reportId);
    }

    // ─── Reputation ──────────────────────────────────────────────────────

    function _updateReputation(address auditor) internal {
        Auditor storage a = auditors[auditor];
        // Base: 5000 (50%)
        // +500 per completed audit (up to +2500 for 5 audits)
        // +1000 if verified
        uint256 score = 5000;
        uint256 auditBonus = a.auditsCompleted * 500;
        if (auditBonus > 2500) auditBonus = 2500;
        score += auditBonus;
        if (a.verified) score += 1000;
        if (score > 10000) score = 10000;
        a.reputationScore = score;
    }

    // ─── View Functions ──────────────────────────────────────────────────

    function getReport(uint256 reportId) external view returns (
        address contractAddress,
        uint256 chainId,
        address auditor,
        uint256 timestamp,
        AuditStatus status,
        string memory reportHash,
        uint256 securityScore,
        uint256 findingCount,
        address projectOwner,
        bool projectVerified
    ) {
        AuditReport storage r = reports[reportId];
        return (r.contractAddress, r.chainId, r.auditor, r.timestamp, r.status, r.reportHash, r.securityScore, r.findingCount, r.projectOwner, r.projectVerified);
    }

    function getFinding(uint256 reportId, uint256 findingIndex) external view returns (
        Severity severity,
        string memory title,
        string memory description,
        bool acknowledged,
        bool resolved
    ) {
        require(findingIndex < reports[reportId].findingCount, "invalid finding");
        Finding storage f = reports[reportId].findings[findingIndex];
        return (f.severity, f.title, f.description, f.acknowledged, f.resolved);
    }

    function getContractAuditCount(address contractAddress) external view returns (uint256) {
        return contractAudits[contractAddress].length;
    }

    function getContractAuditIds(address contractAddress) external view returns (uint256[] memory) {
        return contractAudits[contractAddress];
    }

    function getAuditorReportIds(address auditor) external view returns (uint256[] memory) {
        return auditorReports[auditor];
    }

    function getSecurityScore(address contractAddress) external view returns (uint256 avgScore, uint256 auditCount) {
        uint256[] storage ids = contractAudits[contractAddress];
        auditCount = ids.length;
        if (auditCount == 0) return (0, 0);

        uint256 total;
        for (uint256 i; i < auditCount; i++) {
            total += reports[ids[i]].securityScore;
        }
        avgScore = total / auditCount;
    }

    function isAudited(address contractAddress) external view returns (bool) {
        return contractAudits[contractAddress].length > 0;
    }
}
