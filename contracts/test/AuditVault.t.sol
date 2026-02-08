// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/AuditVault.sol";

contract AuditVaultTest is Test {
    AuditVault vault;
    address admin = makeAddr("admin");
    address auditor1 = makeAddr("auditor1");
    address auditor2 = makeAddr("auditor2");
    address project = makeAddr("project");
    address target = makeAddr("targetContract");

    function setUp() public {
        vm.prank(admin);
        vault = new AuditVault();
    }

    // ─── Auditor Registration ────────────────────────────────────────────

    function test_registerAuditor() public {
        vm.prank(auditor1);
        vault.registerAuditor("SecurityFirm", "https://secfirm.io");

        (string memory name, string memory url,,,, uint256 registeredAt, bool verified, uint256 rep) = vault.auditors(auditor1);
        assertEq(name, "SecurityFirm");
        assertEq(url, "https://secfirm.io");
        assertGt(registeredAt, 0);
        assertFalse(verified);
        assertEq(rep, 5000);
    }

    function test_registerTwiceReverts() public {
        vm.startPrank(auditor1);
        vault.registerAuditor("Firm", "url");
        vm.expectRevert("already registered");
        vault.registerAuditor("Firm2", "url2");
        vm.stopPrank();
    }

    function test_registerEmptyNameReverts() public {
        vm.prank(auditor1);
        vm.expectRevert("name required");
        vault.registerAuditor("", "url");
    }

    function test_verifyAuditor() public {
        vm.prank(auditor1);
        vault.registerAuditor("Firm", "url");

        vm.prank(admin);
        vault.verifyAuditor(auditor1);

        (,,,,,,bool verified, uint256 rep) = vault.auditors(auditor1);
        assertTrue(verified);
        assertEq(rep, 7500);
    }

    function test_verifyUnregisteredReverts() public {
        vm.prank(admin);
        vm.expectRevert("not registered");
        vault.verifyAuditor(auditor1);
    }

    function test_onlyOwnerCanVerify() public {
        vm.prank(auditor1);
        vault.registerAuditor("F", "u");

        vm.prank(auditor1);
        vm.expectRevert("not owner");
        vault.verifyAuditor(auditor1);
    }

    // ─── Audit Submission ────────────────────────────────────────────────

    function test_submitAudit() public {
        vm.prank(auditor1);
        vault.registerAuditor("Firm", "url");

        vm.prank(auditor1);
        uint256 id = vault.submitAudit(target, 1, "QmHash123", 85, project);

        (address ca, uint256 chainId, address aud, uint256 ts, AuditVault.AuditStatus status, string memory hash, uint256 score, uint256 fc, address po, bool pv) = vault.getReport(id);
        assertEq(ca, target);
        assertEq(chainId, 1);
        assertEq(aud, auditor1);
        assertGt(ts, 0);
        assertEq(uint8(status), uint8(AuditVault.AuditStatus.Submitted));
        assertEq(hash, "QmHash123");
        assertEq(score, 85);
        assertEq(fc, 0);
        assertEq(po, project);
        assertFalse(pv);
    }

    function test_submitAudit_notRegistered() public {
        vm.prank(auditor1);
        vm.expectRevert("not registered auditor");
        vault.submitAudit(target, 1, "hash", 85, project);
    }

    function test_submitAudit_invalidContract() public {
        vm.prank(auditor1);
        vault.registerAuditor("F", "u");

        vm.prank(auditor1);
        vm.expectRevert("invalid contract");
        vault.submitAudit(address(0), 1, "hash", 85, project);
    }

    function test_submitAudit_invalidScore() public {
        vm.prank(auditor1);
        vault.registerAuditor("F", "u");

        vm.prank(auditor1);
        vm.expectRevert("score must be 0-100");
        vault.submitAudit(target, 1, "hash", 101, project);
    }

    function test_submitAudit_emptyHash() public {
        vm.prank(auditor1);
        vault.registerAuditor("F", "u");

        vm.prank(auditor1);
        vm.expectRevert("report hash required");
        vault.submitAudit(target, 1, "", 85, project);
    }

    // ─── Findings ────────────────────────────────────────────────────────

    function _submitReport() internal returns (uint256) {
        vm.prank(auditor1);
        vault.registerAuditor("Firm", "url");
        vm.prank(auditor1);
        return vault.submitAudit(target, 1, "QmHash", 85, project);
    }

    function test_addFinding() public {
        uint256 id = _submitReport();

        vm.prank(auditor1);
        vault.addFinding(id, AuditVault.Severity.High, "Reentrancy in withdraw", "Can drain all funds");

        (AuditVault.Severity sev, string memory title, string memory desc, bool ack, bool res) = vault.getFinding(id, 0);
        assertEq(uint8(sev), uint8(AuditVault.Severity.High));
        assertEq(title, "Reentrancy in withdraw");
        assertEq(desc, "Can drain all funds");
        assertFalse(ack);
        assertFalse(res);
    }

    function test_addCriticalFinding() public {
        uint256 id = _submitReport();

        vm.prank(auditor1);
        vault.addFinding(id, AuditVault.Severity.Critical, "Auth bypass", "desc");

        (,,,, uint256 criticals,,,) = vault.auditors(auditor1);
        assertEq(criticals, 1);
    }

    function test_addFinding_notAuditor() public {
        uint256 id = _submitReport();

        vm.prank(project);
        vm.expectRevert("not report auditor");
        vault.addFinding(id, AuditVault.Severity.Low, "title", "desc");
    }

    function test_acknowledgeFinding() public {
        uint256 id = _submitReport();
        vm.prank(auditor1);
        vault.addFinding(id, AuditVault.Severity.Medium, "Issue", "desc");

        vm.prank(project);
        vault.acknowledgeFinding(id, 0);

        (,,, bool ack,) = vault.getFinding(id, 0);
        assertTrue(ack);
    }

    function test_acknowledgeFinding_notProjectOwner() public {
        uint256 id = _submitReport();
        vm.prank(auditor1);
        vault.addFinding(id, AuditVault.Severity.Low, "Issue", "desc");

        vm.prank(auditor1);
        vm.expectRevert("not project owner");
        vault.acknowledgeFinding(id, 0);
    }

    function test_acknowledgeFinding_invalidIndex() public {
        uint256 id = _submitReport();

        vm.prank(project);
        vm.expectRevert("invalid finding");
        vault.acknowledgeFinding(id, 0);
    }

    function test_resolveFinding() public {
        uint256 id = _submitReport();
        vm.prank(auditor1);
        vault.addFinding(id, AuditVault.Severity.High, "Bug", "desc");

        vm.prank(project);
        vault.resolveFinding(id, 0);

        (,,,, bool res) = vault.getFinding(id, 0);
        assertTrue(res);
    }

    function test_resolveFinding_invalidIndex() public {
        uint256 id = _submitReport();

        vm.prank(project);
        vm.expectRevert("invalid finding");
        vault.resolveFinding(id, 5);
    }

    // ─── Report Status ───────────────────────────────────────────────────

    function test_verifyAudit() public {
        uint256 id = _submitReport();

        vm.prank(project);
        vault.verifyAudit(id);

        (,,,, AuditVault.AuditStatus status,,,,, bool pv) = vault.getReport(id);
        assertEq(uint8(status), uint8(AuditVault.AuditStatus.Verified));
        assertTrue(pv);
    }

    function test_disputeAudit() public {
        uint256 id = _submitReport();

        vm.prank(project);
        vault.disputeAudit(id);

        (,,,, AuditVault.AuditStatus status,,,,,) = vault.getReport(id);
        assertEq(uint8(status), uint8(AuditVault.AuditStatus.Disputed));
    }

    function test_disputeResolvedReverts() public {
        uint256 id = _submitReport();

        vm.prank(project);
        vault.disputeAudit(id);

        vm.prank(admin);
        vault.resolveDispute(id);

        vm.prank(project);
        vm.expectRevert("already resolved");
        vault.disputeAudit(id);
    }

    function test_resolveDispute() public {
        uint256 id = _submitReport();

        vm.prank(project);
        vault.disputeAudit(id);

        vm.prank(admin);
        vault.resolveDispute(id);

        (,,,, AuditVault.AuditStatus status,,,,,) = vault.getReport(id);
        assertEq(uint8(status), uint8(AuditVault.AuditStatus.Resolved));
    }

    function test_resolveNotDisputedReverts() public {
        uint256 id = _submitReport();

        vm.prank(admin);
        vm.expectRevert("not disputed");
        vault.resolveDispute(id);
    }

    // ─── View Functions ──────────────────────────────────────────────────

    function test_getContractAuditCount() public {
        _submitReport();
        assertEq(vault.getContractAuditCount(target), 1);
    }

    function test_getContractAuditIds() public {
        uint256 id = _submitReport();
        uint256[] memory ids = vault.getContractAuditIds(target);
        assertEq(ids.length, 1);
        assertEq(ids[0], id);
    }

    function test_getAuditorReportIds() public {
        uint256 id = _submitReport();
        uint256[] memory ids = vault.getAuditorReportIds(auditor1);
        assertEq(ids.length, 1);
        assertEq(ids[0], id);
    }

    function test_getSecurityScore() public {
        _submitReport();
        (uint256 avg, uint256 count) = vault.getSecurityScore(target);
        assertEq(avg, 85);
        assertEq(count, 1);
    }

    function test_getSecurityScore_noAudits() public {
        (uint256 avg, uint256 count) = vault.getSecurityScore(target);
        assertEq(avg, 0);
        assertEq(count, 0);
    }

    function test_getSecurityScore_multiple() public {
        vm.prank(auditor1);
        vault.registerAuditor("Firm1", "url");
        vm.prank(auditor2);
        vault.registerAuditor("Firm2", "url");

        vm.prank(auditor1);
        vault.submitAudit(target, 1, "hash1", 80, project);
        vm.prank(auditor2);
        vault.submitAudit(target, 1, "hash2", 90, project);

        (uint256 avg, uint256 count) = vault.getSecurityScore(target);
        assertEq(avg, 85); // (80+90)/2
        assertEq(count, 2);
    }

    function test_isAudited() public {
        assertFalse(vault.isAudited(target));
        _submitReport();
        assertTrue(vault.isAudited(target));
    }

    function test_totalCounters() public {
        _submitReport();
        assertEq(vault.totalAudits(), 1);

        vm.prank(auditor1);
        vault.addFinding(0, AuditVault.Severity.Low, "t", "d");
        assertEq(vault.totalFindings(), 1);
    }

    // ─── Reputation ──────────────────────────────────────────────────────

    function test_reputationGrowsWithAudits() public {
        vm.prank(auditor1);
        vault.registerAuditor("Firm", "url");

        // 1st audit: 5000 + 500 = 5500
        vm.prank(auditor1);
        vault.submitAudit(target, 1, "h1", 90, project);
        (,,,,,,, uint256 rep) = vault.auditors(auditor1);
        assertEq(rep, 5500);

        // 5th audit: 5000 + 2500 = 7500
        for (uint256 i; i < 4; i++) {
            vm.prank(auditor1);
            vault.submitAudit(makeAddr(string(abi.encodePacked("t", i))), 1, "h", 90, project);
        }
        (,,,,,,, rep) = vault.auditors(auditor1);
        assertEq(rep, 7500);

        // 6th audit: still capped at 7500 (2500 max bonus)
        vm.prank(auditor1);
        vault.submitAudit(makeAddr("t99"), 1, "h", 90, project);
        (,,,,,,, rep) = vault.auditors(auditor1);
        assertEq(rep, 7500);
    }

    function test_verifiedAuditorReputation() public {
        vm.prank(auditor1);
        vault.registerAuditor("Firm", "url");

        vm.prank(admin);
        vault.verifyAuditor(auditor1);

        // After verify: 7500. After 1 audit: 5000 + 500 + 1000(verified) = 6500
        // Wait, verify sets to 7500 directly, then audit recalculates
        vm.prank(auditor1);
        vault.submitAudit(target, 1, "h", 90, project);
        (,,,,,,, uint256 rep) = vault.auditors(auditor1);
        // 5000 + 500 + 1000 = 6500
        assertEq(rep, 6500);
    }

    function test_addFindingToVerifiedReport() public {
        uint256 id = _submitReport();

        vm.prank(project);
        vault.verifyAudit(id);

        // Can still add findings to verified reports
        vm.prank(auditor1);
        vault.addFinding(id, AuditVault.Severity.Info, "Gas opt", "Use unchecked");

        (AuditVault.Severity sev,,,,) = vault.getFinding(id, 0);
        assertEq(uint8(sev), uint8(AuditVault.Severity.Info));
    }

    function test_cannotAddFindingToDisputed() public {
        uint256 id = _submitReport();

        vm.prank(project);
        vault.disputeAudit(id);

        vm.prank(auditor1);
        vm.expectRevert("cannot add to this report");
        vault.addFinding(id, AuditVault.Severity.Low, "t", "d");
    }

    function test_getFinding_invalidIndex() public {
        uint256 id = _submitReport();

        vm.expectRevert("invalid finding");
        vault.getFinding(id, 0);
    }
}