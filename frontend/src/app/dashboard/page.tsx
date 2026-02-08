"use client";
import { useState } from "react";
import { ConnectKitButton } from "connectkit";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { isAddress } from "viem";
import { AUDIT_VAULT_ADDRESS, AUDIT_VAULT_ABI } from "@/config/contract";

const SEV_LABELS = ["Info", "Low", "Medium", "High", "Critical"];
const SEV_COLORS = ["text-blue-400", "text-cyan-400", "text-yellow-400", "text-orange-400", "text-red-400"];
const SEV_BG = ["bg-blue-900/30", "bg-cyan-900/30", "bg-yellow-900/30", "bg-orange-900/30", "bg-red-900/30"];
const STATUS_LABELS = ["Submitted", "Verified", "Disputed", "Resolved"];
const STATUS_COLORS = ["text-yellow-400", "text-green-400", "text-red-400", "text-blue-400"];

type Tab = "overview" | "submit" | "findings" | "lookup" | "auditor";

export default function Dashboard() {
  const [tab, setTab] = useState<Tab>("overview");
  const { address, isConnected } = useAccount();

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "submit", label: "Submit Audit", icon: "📄" },
    { id: "findings", label: "Findings", icon: "🔍" },
    { id: "lookup", label: "Lookup", icon: "🔗" },
    { id: "auditor", label: "Auditor", icon: "👤" },
  ];

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🔐</span>
            <div>
              <h1 className="text-xl font-bold">AuditVault</h1>
              <p className="text-xs text-gray-400">On-Chain Audit Registry</p>
            </div>
          </div>
          <ConnectKitButton />
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${tab === t.id ? "bg-orange-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
        {tab === "overview" && <OverviewTab address={address} isConnected={isConnected} />}
        {tab === "submit" && <SubmitTab />}
        {tab === "findings" && <FindingsTab />}
        {tab === "lookup" && <LookupTab />}
        {tab === "auditor" && <AuditorTab address={address} isConnected={isConnected} />}
      </div>
    </div>
  );
}

function Card({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-gray-900 border border-gray-800 rounded-xl p-6 ${className}`}>
      <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">{title}</h3>
      {children}
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

/* ─── Overview Tab ────────────────────────────────────────────────── */
function OverviewTab({ address, isConnected }: { address?: `0x${string}`; isConnected: boolean }) {
  const { data: totalAudits } = useReadContract({ address: AUDIT_VAULT_ADDRESS, abi: AUDIT_VAULT_ABI, functionName: "totalAudits" });
  const { data: totalFindings } = useReadContract({ address: AUDIT_VAULT_ADDRESS, abi: AUDIT_VAULT_ABI, functionName: "totalFindings" });
  const { data: nextId } = useReadContract({ address: AUDIT_VAULT_ADDRESS, abi: AUDIT_VAULT_ABI, functionName: "nextReportId" });
  const { data: ownerAddr } = useReadContract({ address: AUDIT_VAULT_ADDRESS, abi: AUDIT_VAULT_ABI, functionName: "owner" });
  const { data: auditorData } = useReadContract({ address: AUDIT_VAULT_ADDRESS, abi: AUDIT_VAULT_ABI, functionName: "auditors", args: address ? [address] : undefined });

  const short = (a: string | undefined) => a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "—";
  const a = auditorData as unknown as [string, string, bigint, bigint, bigint, bigint, boolean, bigint] | undefined;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card title="Total Audits"><Stat label="Reports Submitted" value={totalAudits?.toString() || "0"} /></Card>
        <Card title="Total Findings"><Stat label="Across All Reports" value={totalFindings?.toString() || "0"} /></Card>
        <Card title="Reports"><Stat label="Next Report ID" value={nextId?.toString() || "0"} /></Card>
        <Card title="Registry Owner"><Stat label="Admin" value={short(ownerAddr as string)} /></Card>
      </div>

      {isConnected && a && a[5] > 0n && (
        <Card title="Your Auditor Profile">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><p className="text-xs text-gray-500">Name</p><p className="font-medium">{a[0]}</p></div>
            <div><p className="text-xs text-gray-500">Audits</p><p className="font-medium">{a[2].toString()}</p></div>
            <div><p className="text-xs text-gray-500">Findings</p><p className="font-medium">{a[3].toString()}</p></div>
            <div><p className="text-xs text-gray-500">Critical</p><p className="font-medium text-red-400">{a[4].toString()}</p></div>
            <div><p className="text-xs text-gray-500">Verified</p><p className={`font-medium ${a[6] ? "text-green-400" : "text-gray-500"}`}>{a[6] ? "✅ Yes" : "⬜ No"}</p></div>
            <div><p className="text-xs text-gray-500">Reputation</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-800 rounded-full h-2"><div className="bg-orange-500 h-2 rounded-full" style={{ width: `${Number(a[7]) / 100}%` }} /></div>
                <span className="text-sm font-medium">{(Number(a[7]) / 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Recent reports */}
      {Number(nextId || 0) > 0 && (
        <Card title={`Recent Audit Reports`}>
          <div className="space-y-2">
            {Array.from({ length: Math.min(Number(nextId || 0), 5) }, (_, i) => Number(nextId || 0) - 1 - i).map(id => (
              <ReportRow key={id} reportId={id} />
            ))}
          </div>
        </Card>
      )}

      <Card title="Contract">
        <div className="flex flex-wrap gap-4 text-sm">
          <div><span className="text-gray-500">Address:</span> <a href={`https://sepolia.celoscan.io/address/${AUDIT_VAULT_ADDRESS}`} target="_blank" className="font-mono text-orange-400 hover:underline">{short(AUDIT_VAULT_ADDRESS)}</a></div>
          <div><span className="text-gray-500">Network:</span> <span className="text-gray-300">Celo Sepolia</span></div>
        </div>
      </Card>
    </div>
  );
}

function ReportRow({ reportId }: { reportId: number }) {
  const { data } = useReadContract({ address: AUDIT_VAULT_ADDRESS, abi: AUDIT_VAULT_ABI, functionName: "getReport", args: [BigInt(reportId)] });
  if (!data) return <div className="animate-pulse bg-gray-800 h-14 rounded-lg" />;
  const r = data as unknown as [string, bigint, string, bigint, number, string, bigint, bigint, string, boolean];
  const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

  return (
    <div className="flex items-center gap-4 bg-gray-800/50 rounded-lg px-4 py-3 text-sm">
      <span className="text-xs text-gray-500 w-8">#{reportId}</span>
      <span className="font-mono text-xs text-gray-400" title={r[0]}>{short(r[0])}</span>
      <span className="text-gray-600">by</span>
      <span className="font-mono text-xs text-gray-400">{short(r[2])}</span>
      <div className="flex items-center gap-1">
        <span className="text-lg font-bold text-white">{r[6].toString()}</span>
        <span className="text-xs text-gray-500">/100</span>
      </div>
      <span className="text-xs text-gray-500">{r[7].toString()} findings</span>
      <span className={`text-xs font-medium ${STATUS_COLORS[r[4]]}`}>{STATUS_LABELS[r[4]]}</span>
      {r[9] && <span className="text-xs text-green-400">✅ Verified</span>}
      <span className="text-xs text-gray-600 ml-auto">{new Date(Number(r[3]) * 1000).toLocaleDateString()}</span>
    </div>
  );
}

/* ─── Submit Audit Tab ────────────────────────────────────────────── */
function SubmitTab() {
  const [contract, setContract] = useState("");
  const [chainId, setChainId] = useState("44787");
  const [hash, setHash] = useState("");
  const [score, setScore] = useState("");
  const [projectOwner, setProjectOwner] = useState("");

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const submit = () => {
    if (!isAddress(contract) || !hash || !score || !isAddress(projectOwner)) return;
    writeContract({
      address: AUDIT_VAULT_ADDRESS, abi: AUDIT_VAULT_ABI, functionName: "submitAudit",
      args: [contract as `0x${string}`, BigInt(chainId), hash, BigInt(score), projectOwner as `0x${string}`]
    });
  };

  return (
    <Card title="Submit New Audit Report">
      <div className="space-y-4 max-w-lg">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Contract Address (audited)</label>
          <input value={contract} onChange={e => setContract(e.target.value)} placeholder="0x..." className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm font-mono focus:border-orange-500 outline-none" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Chain ID</label>
          <select value={chainId} onChange={e => setChainId(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:border-orange-500 outline-none">
            <option value="1">Ethereum (1)</option>
            <option value="10">Optimism (10)</option>
            <option value="42161">Arbitrum (42161)</option>
            <option value="8453">Base (8453)</option>
            <option value="137">Polygon (137)</option>
            <option value="42220">Celo (42220)</option>
            <option value="44787">Celo Sepolia (44787)</option>
            <option value="534352">Scroll (534352)</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Report Hash (IPFS CID or identifier)</label>
          <input value={hash} onChange={e => setHash(e.target.value)} placeholder="QmHash... or bafybei..." className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm font-mono focus:border-orange-500 outline-none" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Security Score (0-100)</label>
          <input value={score} onChange={e => setScore(e.target.value)} type="number" min="0" max="100" placeholder="85" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm font-mono focus:border-orange-500 outline-none" />
          {score && <div className="mt-2 bg-gray-800 rounded-full h-3"><div className={`h-3 rounded-full ${Number(score) >= 80 ? "bg-green-500" : Number(score) >= 60 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${Math.min(Number(score), 100)}%` }} /></div>}
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Project Owner Address</label>
          <input value={projectOwner} onChange={e => setProjectOwner(e.target.value)} placeholder="0x..." className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm font-mono focus:border-orange-500 outline-none" />
        </div>
        <button onClick={submit} disabled={isPending || confirming} className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition">
          {isPending ? "Signing…" : confirming ? "Confirming…" : "Submit Audit Report"}
        </button>
        {isSuccess && <p className="text-sm text-green-400">✅ Audit report submitted! <a href={`https://sepolia.celoscan.io/tx/${txHash}`} target="_blank" className="underline">View tx</a></p>}
      </div>
    </Card>
  );
}

/* ─── Findings Tab ────────────────────────────────────────────────── */
function FindingsTab() {
  const [reportId, setReportId] = useState("");
  const [severity, setSeverity] = useState("3");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [ackReportId, setAckReportId] = useState("");
  const [ackIdx, setAckIdx] = useState("");

  const { writeContract: addFind, isPending: adding } = useWriteContract();
  const { writeContract: ackFind, isPending: acking } = useWriteContract();
  const { writeContract: resFind, isPending: resolving } = useWriteContract();

  // View a finding
  const [viewReportId, setViewReportId] = useState("");
  const [viewIdx, setViewIdx] = useState("");
  const { data: findingData } = useReadContract({
    address: AUDIT_VAULT_ADDRESS, abi: AUDIT_VAULT_ABI, functionName: "getFinding",
    args: viewReportId && viewIdx ? [BigInt(viewReportId), BigInt(viewIdx)] : undefined,
  });
  const f = findingData as unknown as [number, string, string, boolean, boolean] | undefined;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card title="Add Finding (Auditor)">
        <div className="space-y-3">
          <input value={reportId} onChange={e => setReportId(e.target.value)} placeholder="Report ID" type="number" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm font-mono focus:border-orange-500 outline-none" />
          <select value={severity} onChange={e => setSeverity(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:border-orange-500 outline-none">
            {SEV_LABELS.map((l, i) => <option key={i} value={i}>{l}</option>)}
          </select>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Finding title" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:border-orange-500 outline-none" />
          <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description or IPFS hash" rows={3} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:border-orange-500 outline-none resize-none" />
          <button disabled={adding || !reportId || !title} onClick={() => addFind({ address: AUDIT_VAULT_ADDRESS, abi: AUDIT_VAULT_ABI, functionName: "addFinding", args: [BigInt(reportId), parseInt(severity), title, desc] })} className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition">
            {adding ? "Adding…" : "Add Finding"}
          </button>
        </div>
      </Card>

      <Card title="View Finding">
        <div className="space-y-3">
          <div className="flex gap-2">
            <input value={viewReportId} onChange={e => setViewReportId(e.target.value)} placeholder="Report ID" type="number" className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm font-mono focus:border-orange-500 outline-none" />
            <input value={viewIdx} onChange={e => setViewIdx(e.target.value)} placeholder="Index" type="number" className="w-24 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm font-mono focus:border-orange-500 outline-none" />
          </div>
          {f && (
            <div className={`${SEV_BG[f[0]]} border border-gray-700 rounded-lg p-4 space-y-2`}>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold ${SEV_COLORS[f[0]]}`}>{SEV_LABELS[f[0]]}</span>
                <span className="text-sm font-medium text-white">{f[1]}</span>
              </div>
              <p className="text-xs text-gray-400">{f[2]}</p>
              <div className="flex gap-3 text-xs">
                <span className={f[3] ? "text-yellow-400" : "text-gray-600"}>
                  {f[3] ? "✅ Acknowledged" : "⬜ Not Acknowledged"}
                </span>
                <span className={f[4] ? "text-green-400" : "text-gray-600"}>
                  {f[4] ? "✅ Resolved" : "⬜ Not Resolved"}
                </span>
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card title="Acknowledge / Resolve Finding (Project Owner)">
        <div className="space-y-3">
          <div className="flex gap-2">
            <input value={ackReportId} onChange={e => setAckReportId(e.target.value)} placeholder="Report ID" type="number" className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm font-mono focus:border-orange-500 outline-none" />
            <input value={ackIdx} onChange={e => setAckIdx(e.target.value)} placeholder="Finding #" type="number" className="w-24 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm font-mono focus:border-orange-500 outline-none" />
          </div>
          <div className="flex gap-2">
            <button disabled={acking || !ackReportId || !ackIdx} onClick={() => ackFind({ address: AUDIT_VAULT_ADDRESS, abi: AUDIT_VAULT_ABI, functionName: "acknowledgeFinding", args: [BigInt(ackReportId), BigInt(ackIdx)] })} className="flex-1 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition text-sm">
              {acking ? "…" : "Acknowledge"}
            </button>
            <button disabled={resolving || !ackReportId || !ackIdx} onClick={() => resFind({ address: AUDIT_VAULT_ADDRESS, abi: AUDIT_VAULT_ABI, functionName: "resolveFinding", args: [BigInt(ackReportId), BigInt(ackIdx)] })} className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition text-sm">
              {resolving ? "…" : "Mark Resolved"}
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ─── Lookup Tab ──────────────────────────────────────────────────── */
function LookupTab() {
  const [contractAddr, setContractAddr] = useState("");

  const { data: isAudited } = useReadContract({
    address: AUDIT_VAULT_ADDRESS, abi: AUDIT_VAULT_ABI, functionName: "isAudited",
    args: isAddress(contractAddr) ? [contractAddr as `0x${string}`] : undefined,
  });
  const { data: scoreData } = useReadContract({
    address: AUDIT_VAULT_ADDRESS, abi: AUDIT_VAULT_ABI, functionName: "getSecurityScore",
    args: isAddress(contractAddr) ? [contractAddr as `0x${string}`] : undefined,
  });
  const { data: auditIds } = useReadContract({
    address: AUDIT_VAULT_ADDRESS, abi: AUDIT_VAULT_ABI, functionName: "getContractAuditIds",
    args: isAddress(contractAddr) ? [contractAddr as `0x${string}`] : undefined,
  });

  const s = scoreData as unknown as [bigint, bigint] | undefined;

  return (
    <Card title="Contract Security Lookup">
      <div className="space-y-4 max-w-xl">
        <input value={contractAddr} onChange={e => setContractAddr(e.target.value)} placeholder="Contract address to check…" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm font-mono focus:border-orange-500 outline-none" />

        {isAddress(contractAddr) && isAudited !== undefined && (
          <div className="space-y-4">
            <div className={`text-center p-6 rounded-xl ${isAudited ? "bg-green-900/20 border border-green-800" : "bg-red-900/20 border border-red-800"}`}>
              <div className="text-4xl mb-2">{isAudited ? "✅" : "⚠️"}</div>
              <p className={`text-lg font-bold ${isAudited ? "text-green-400" : "text-red-400"}`}>
                {isAudited ? "AUDITED" : "NOT AUDITED"}
              </p>
            </div>

            {s && s[1] > 0n && (
              <div className="text-center space-y-2">
                <p className="text-xs text-gray-500">Average Security Score ({s[1].toString()} audits)</p>
                <div className="text-5xl font-bold text-white">{s[0].toString()}<span className="text-lg text-gray-500">/100</span></div>
                <div className="bg-gray-800 rounded-full h-4 max-w-xs mx-auto">
                  <div className={`h-4 rounded-full ${Number(s[0]) >= 80 ? "bg-green-500" : Number(s[0]) >= 60 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${Number(s[0])}%` }} />
                </div>
              </div>
            )}

            {auditIds && (auditIds as bigint[]).length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500">Audit Reports:</p>
                {(auditIds as bigint[]).map(id => (
                  <ReportRow key={id.toString()} reportId={Number(id)} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

/* ─── Auditor Tab ─────────────────────────────────────────────────── */
function AuditorTab({ address, isConnected }: { address?: `0x${string}`; isConnected: boolean }) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [lookupAddr, setLookupAddr] = useState("");

  const { writeContract: register, isPending: registering } = useWriteContract();
  const { writeContract: verify, isPending: verifying } = useWriteContract();
  const { writeContract: verifyReport, isPending: verifyingReport } = useWriteContract();
  const { writeContract: dispute, isPending: disputing } = useWriteContract();

  const [reportAction, setReportAction] = useState("");

  const { data: auditorData } = useReadContract({
    address: AUDIT_VAULT_ADDRESS, abi: AUDIT_VAULT_ABI, functionName: "auditors",
    args: isAddress(lookupAddr) ? [lookupAddr as `0x${string}`] : address ? [address] : undefined,
  });
  const { data: reportIds } = useReadContract({
    address: AUDIT_VAULT_ADDRESS, abi: AUDIT_VAULT_ABI, functionName: "getAuditorReportIds",
    args: isAddress(lookupAddr) ? [lookupAddr as `0x${string}`] : address ? [address] : undefined,
  });

  const a = auditorData as unknown as [string, string, bigint, bigint, bigint, bigint, boolean, bigint] | undefined;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Register as Auditor">
          <div className="space-y-3">
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Auditor / Firm name" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:border-orange-500 outline-none" />
            <input value={url} onChange={e => setUrl(e.target.value)} placeholder="Website URL" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm focus:border-orange-500 outline-none" />
            <button disabled={registering || !name} onClick={() => register({ address: AUDIT_VAULT_ADDRESS, abi: AUDIT_VAULT_ABI, functionName: "registerAuditor", args: [name, url] })} className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg transition">
              {registering ? "Registering…" : "Register"}
            </button>
          </div>
        </Card>

        <Card title="Lookup Auditor">
          <div className="space-y-3">
            <input value={lookupAddr} onChange={e => setLookupAddr(e.target.value)} placeholder="Auditor address (blank = yours)" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm font-mono focus:border-orange-500 outline-none" />
            {a && a[5] > 0n && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="font-medium">{a[0]}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">URL</span><a href={a[1]} target="_blank" className="text-orange-400 hover:underline">{a[1]}</a></div>
                <div className="flex justify-between"><span className="text-gray-500">Audits</span><span>{a[2].toString()}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Findings</span><span>{a[3].toString()}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Critical</span><span className="text-red-400">{a[4].toString()}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Verified</span><span className={a[6] ? "text-green-400" : "text-gray-500"}>{a[6] ? "✅" : "⬜"}</span></div>
                <div>
                  <span className="text-gray-500 text-xs">Reputation</span>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 bg-gray-800 rounded-full h-3"><div className="bg-orange-500 h-3 rounded-full" style={{ width: `${Number(a[7]) / 100}%` }} /></div>
                    <span className="text-sm font-bold">{(Number(a[7]) / 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            )}
            {a && a[5] === 0n && isAddress(lookupAddr) && <p className="text-gray-500 text-sm">Not registered</p>}
          </div>
        </Card>
      </div>

      <Card title="Report Actions (Project Owner)">
        <div className="flex gap-3 max-w-lg">
          <input value={reportAction} onChange={e => setReportAction(e.target.value)} placeholder="Report ID" type="number" className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm font-mono focus:border-orange-500 outline-none" />
          <button disabled={verifyingReport || !reportAction} onClick={() => verifyReport({ address: AUDIT_VAULT_ADDRESS, abi: AUDIT_VAULT_ABI, functionName: "verifyAudit", args: [BigInt(reportAction)] })} className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-lg transition text-sm">
            ✅ Verify
          </button>
          <button disabled={disputing || !reportAction} onClick={() => dispute({ address: AUDIT_VAULT_ADDRESS, abi: AUDIT_VAULT_ABI, functionName: "disputeAudit", args: [BigInt(reportAction)] })} className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-lg transition text-sm">
            ⚖️ Dispute
          </button>
        </div>
      </Card>

      {reportIds && (reportIds as bigint[]).length > 0 && (
        <Card title="Auditor's Reports">
          <div className="space-y-2">
            {(reportIds as bigint[]).map(id => <ReportRow key={id.toString()} reportId={Number(id)} />)}
          </div>
        </Card>
      )}
    </div>
  );
}
