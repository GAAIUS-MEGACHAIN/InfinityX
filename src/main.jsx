import React from "react";
import { createRoot } from "react-dom/client";
import {
  AlertTriangle,
  ArrowDownUp,
  BadgeCheck,
  Bell,
  Fingerprint,
  Globe2,
  LockKeyhole,
  QrCode,
  Radar,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Wallet,
  Zap
} from "lucide-react";
import "./styles.css";

const chains = [
  { name: "Solana", status: "Primary", fee: "< $0.01", color: "#13c9a5" },
  { name: "Polygon", status: "Ready", fee: "Low", color: "#8b5cf6" },
  { name: "Base", status: "Ready", fee: "Low", color: "#3772ff" },
  { name: "BNB", status: "Ready", fee: "Low", color: "#f0b90b" },
  { name: "Ethereum", status: "Protected", fee: "Variable", color: "#64748b" }
];

const assets = [
  { symbol: "IFX", name: "InfinityX", amount: "10,000,000,000", value: "Launch supply" },
  { symbol: "SOL", name: "Solana", amount: "0.00", value: "Fund authority wallet" },
  { symbol: "USDC", name: "USD Coin", amount: "0.00", value: "Stable payments" }
];

const warnings = [
  "Unlimited token approval detected",
  "New token has low liquidity",
  "Bridge route requires 2 chain hops"
];

function App() {
  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">IX</div>
          <div>
            <h1>InfinityX Wallet</h1>
            <p>Universal Web3 Super App</p>
          </div>
        </div>
        <nav className="nav">
          <button className="active"><Wallet size={18} /> Wallet</button>
          <button><ArrowDownUp size={18} /> Swap</button>
          <button><ShieldCheck size={18} /> Security</button>
          <button><Radar size={18} /> Discover</button>
          <button><Fingerprint size={18} /> Recovery</button>
        </nav>
        <div className="network-card">
          <span>Main network</span>
          <strong>Solana first</strong>
          <p>InfinityX token launch authority is ready for funding.</p>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div className="search">
            <Search size={18} />
            <input placeholder="Search token, address, dApp, chain" />
          </div>
          <div className="top-actions">
            <button aria-label="Scan QR"><QrCode size={19} /></button>
            <button aria-label="Notifications"><Bell size={19} /></button>
            <button className="connect"><LockKeyhole size={18} /> Locked</button>
          </div>
        </header>

        <section className="hero-band">
          <div>
            <p className="eyebrow">Chain abstraction ready</p>
            <h2>One wallet for every chain, trade, identity, and payment.</h2>
          </div>
          <div className="hero-actions">
            <button className="primary"><Send size={18} /> Send</button>
            <button className="secondary"><ArrowDownUp size={18} /> Swap</button>
          </div>
        </section>

        <section className="grid">
          <div className="panel portfolio">
            <div className="panel-title">
              <h3>Portfolio</h3>
              <span>Token-2022 ready</span>
            </div>
            {assets.map((asset) => (
              <div className="asset-row" key={asset.symbol}>
                <div className="asset-icon">{asset.symbol.slice(0, 2)}</div>
                <div>
                  <strong>{asset.name}</strong>
                  <p>{asset.amount} {asset.symbol}</p>
                </div>
                <span>{asset.value}</span>
              </div>
            ))}
          </div>

          <div className="panel swap">
            <div className="panel-title">
              <h3>DEX Aggregator</h3>
              <Zap size={18} />
            </div>
            <div className="swap-box">
              <label>From</label>
              <div><strong>SOL</strong><span>0.00</span></div>
            </div>
            <div className="swap-mid"><ArrowDownUp size={18} /></div>
            <div className="swap-box">
              <label>To</label>
              <div><strong>IFX</strong><span>Best route</span></div>
            </div>
            <button className="primary wide">Find Liquidity</button>
          </div>

          <div className="panel security">
            <div className="panel-title">
              <h3>AI Security</h3>
              <Sparkles size={18} />
            </div>
            {warnings.map((warning) => (
              <div className="warning" key={warning}>
                <AlertTriangle size={17} />
                <span>{warning}</span>
              </div>
            ))}
          </div>

          <div className="panel chains">
            <div className="panel-title">
              <h3>Universal Chains</h3>
              <Globe2 size={18} />
            </div>
            <div className="chain-list">
              {chains.map((chain) => (
                <div className="chain" key={chain.name}>
                  <span style={{ background: chain.color }} />
                  <strong>{chain.name}</strong>
                  <em>{chain.status}</em>
                  <small>{chain.fee}</small>
                </div>
              ))}
            </div>
          </div>

          <div className="panel recovery">
            <div className="panel-title">
              <h3>Smart Recovery</h3>
              <BadgeCheck size={18} />
            </div>
            <div className="recovery-grid">
              <button><Fingerprint size={18} /> Passkey</button>
              <button><ShieldCheck size={18} /> Social</button>
              <button><LockKeyhole size={18} /> MPC</button>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
