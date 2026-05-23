import React from "react";
import { createRoot } from "react-dom/client";
import {
  AlertTriangle,
  ArrowDownUp,
  Bell,
  ChevronDown,
  Compass,
  Fingerprint,
  Globe2,
  History,
  LockKeyhole,
  QrCode,
  ScanLine,
  Send,
  ShieldCheck,
  Sparkles,
  Wallet,
  Zap
} from "lucide-react";
import "./styles.css";

const tokens = [
  { symbol: "IFX", name: "InfinityX", amount: "10,000,000,000", value: "Launch supply", accent: "#13c9a5" },
  { symbol: "SOL", name: "Solana", amount: "0.015", value: "Authority wallet", accent: "#7c3aed" },
  { symbol: "USDC", name: "USD Coin", amount: "0.00", value: "Payments ready", accent: "#2563eb" }
];

const chains = ["Solana", "Polygon", "Base", "BNB", "Ethereum"];

function App() {
  return (
    <main className="phone-shell">
      <section className="wallet-app">
        <header className="app-top">
          <button className="icon-button" aria-label="Wallet locked"><LockKeyhole size={20} /></button>
          <button className="network-pill">Solana <ChevronDown size={16} /></button>
          <button className="icon-button" aria-label="Notifications"><Bell size={20} /></button>
        </header>

        <section className="account-card">
          <div className="account-row">
            <div className="avatar">IX</div>
            <div>
              <p>Account 1</p>
              <strong>8Ghno...xX9t</strong>
            </div>
            <button aria-label="Scan QR"><QrCode size={19} /></button>
          </div>

          <div className="balance">
            <span>Total Balance</span>
            <h1>$0.00</h1>
            <p>InfinityX mainnet token launch wallet</p>
          </div>

          <div className="actions">
            <button><Send size={20} /><span>Send</span></button>
            <button><ScanLine size={20} /><span>Receive</span></button>
            <button><ArrowDownUp size={20} /><span>Swap</span></button>
            <button><Compass size={20} /><span>Discover</span></button>
          </div>
        </section>

        <section className="swap-strip">
          <div>
            <strong>Best-route swaps</strong>
            <span>DEX aggregation, low-fee routing, cross-chain later</span>
          </div>
          <button><Zap size={18} /> Route</button>
        </section>

        <nav className="tabs" aria-label="Wallet tabs">
          <button className="active">Tokens</button>
          <button>NFTs</button>
          <button>Activity</button>
        </nav>

        <section className="token-list">
          {tokens.map((token) => (
            <article className="token-row" key={token.symbol}>
              <div className="token-icon" style={{ background: token.accent }}>{token.symbol.slice(0, 2)}</div>
              <div>
                <strong>{token.name}</strong>
                <span>{token.amount} {token.symbol}</span>
              </div>
              <em>{token.value}</em>
            </article>
          ))}
        </section>

        <section className="security-card">
          <div className="section-title">
            <ShieldCheck size={20} />
            <strong>AI Security</strong>
          </div>
          <div className="risk-row">
            <AlertTriangle size={18} />
            <span>Contract simulation and drain warnings enabled in the roadmap.</span>
          </div>
          <div className="risk-row calm">
            <Fingerprint size={18} />
            <span>Passkeys, biometrics, MPC, and social recovery planned.</span>
          </div>
        </section>

        <section className="chain-card">
          <div className="section-title">
            <Globe2 size={20} />
            <strong>Universal Chains</strong>
          </div>
          <div className="chain-grid">
            {chains.map((chain) => <span key={chain}>{chain}</span>)}
          </div>
        </section>

        <footer className="bottom-nav">
          <button className="active"><Wallet size={20} /><span>Wallet</span></button>
          <button><ArrowDownUp size={20} /><span>Swap</span></button>
          <button><Sparkles size={20} /><span>AI</span></button>
          <button><History size={20} /><span>Activity</span></button>
        </footer>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
