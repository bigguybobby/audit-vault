import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4">
      <div className="max-w-2xl text-center space-y-8">
        <div className="text-7xl">🔐</div>
        <h1 className="text-5xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
          AuditVault
        </h1>
        <p className="text-xl text-gray-400">
          On-Chain Smart Contract Audit Registry
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {[
            { icon: "👤", label: "Auditor Registry", desc: "Register & verify" },
            { icon: "📄", label: "Audit Reports", desc: "IPFS-backed reports" },
            { icon: "🔍", label: "Findings", desc: "5 severity levels" },
            { icon: "⭐", label: "Reputation", desc: "Auto-scored" },
            { icon: "✅", label: "Verification", desc: "Project confirms" },
            { icon: "⚖️", label: "Disputes", desc: "Resolution flow" },
            { icon: "📊", label: "Security Score", desc: "Per-contract avg" },
            { icon: "🔗", label: "Multi-Chain", desc: "Any EVM chain" },
          ].map((f) => (
            <div key={f.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="text-2xl mb-2">{f.icon}</div>
              <div className="font-medium text-white">{f.label}</div>
              <div className="text-xs text-gray-500">{f.desc}</div>
            </div>
          ))}
        </div>
        <div className="flex gap-4 justify-center">
          <Link href="/dashboard" className="bg-orange-600 hover:bg-orange-700 text-white font-medium px-8 py-3 rounded-xl transition text-lg">
            Launch Dashboard
          </Link>
          <a href="https://github.com/bigguybobby/audit-vault" target="_blank" className="bg-gray-800 hover:bg-gray-700 text-white font-medium px-8 py-3 rounded-xl transition text-lg">
            GitHub
          </a>
        </div>
        <div className="text-xs text-gray-600 space-y-1">
          <p>Deployed on Celo Sepolia • 37/37 Tests • 100% Coverage • Slither Clean</p>
          <p>Targeting: Optimism Season 9 Audit Grants & Scroll Security Subsidy</p>
        </div>
      </div>
    </div>
  );
}
