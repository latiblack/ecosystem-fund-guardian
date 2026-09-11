import { useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ShieldCheck, LogOut, ArrowLeft } from "lucide-react";
import { useWallet } from "../context/WalletContext";

const DESTINATIONS = {
  "/create": "Create Project",
  "/explore": "Explore Funds",
  "/submit": "Submit Proof",
};

export default function Auth() {
  const [params] = useSearchParams();
  const { isConnected, disconnectWallet } = useWallet();
  const next = params.get("next");
  const dest = DESTINATIONS[next] ? next : "/explore";

  // Once the wallet is connected, enter the app
  useEffect(() => {
    if (isConnected) {
      const t = setTimeout(() => {
        window.location.replace(dest);
      }, 400);
      return () => clearTimeout(t);
    }
  }, [isConnected, dest]);

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-icon">
          <ShieldCheck size={28} />
        </div>
        <h1>Connect your wallet</h1>
        <p>
          Ecosystem Fund Guardian uses your wallet to verify who you are and
          lock project funds. Connecting is free — nothing is charged.
        </p>

        <div className="auth-connect">
          <ConnectButton
            accountStatus={isConnected ? "full" : "connect"}
            chainStatus="icon"
            showBalance={false}
          />
        </div>

        {isConnected ? (
          <>
            <div className="auth-status">
              Wallet connected — taking you to {DESTINATIONS[dest]}…
            </div>
            <button className="auth-different" onClick={disconnectWallet}>
              <LogOut size={13} /> Use a different wallet
            </button>
          </>
        ) : (
          <div className="auth-hint">
            Choose from MetaMask, Base, Rainbow, WalletConnect and more.
          </div>
        )}

        <Link to="/" className="auth-back">
          <ArrowLeft size={12} /> Back to home
        </Link>
      </div>
    </div>
  );
}
