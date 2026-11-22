import React, { useState } from "react";
import { ArrowRight, Check, Lock, Smartphone } from "lucide-react";
import "./auth.css";

const OTP_LENGTH = 4;
const normalizeMobile = (value) => String(value || "").replace(/\D/g, "").slice(-10);

function readAccounts() {
  try {
    const raw = localStorage.getItem("kaveri-customer-accounts");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAccounts(accounts) {
  try {
    localStorage.setItem("kaveri-customer-accounts", JSON.stringify(accounts));
  } catch {}
}

export default function UserLogin({ hotel = {}, onAuthenticated, nav }) {
  const [mode, setMode] = useState("login");
  const [step, setStep] = useState("details");
  const [mobile, setMobile] = useState("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [otp, setOtp] = useState("");
  const [sentOtp, setSentOtp] = useState("");
  const [error, setError] = useState("");

  const switchMode = (next) => {
    setMode(next);
    setStep("details");
    setOtp("");
    setSentOtp("");
    setError("");
  };

  const sendOtp = (event) => {
    event.preventDefault();
    setError("");
    const clean = normalizeMobile(mobile);

    if (clean.length !== 10) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }

    if (mode === "signup" && (!name.trim() || !address.trim())) {
      setError("Name and address are required for a new account.");
      return;
    }

    if (mode === "login") {
      const accounts = readAccounts();
      let exists = accounts.some((user) => normalizeMobile(user.mobile) === clean);
      if (!exists) {
        try {
          const saved = JSON.parse(localStorage.getItem("kaveri-current-user") || "null");
          exists = normalizeMobile(saved?.mobile) === clean;
        } catch {}
      }
      if (!exists) {
        setError("No account found. Please select Create Account first.");
        return;
      }
    }

    const generated = String(Math.floor(1000 + Math.random() * 9000));
    setMobile(clean);
    setSentOtp(generated);
    setOtp("");
    setStep("otp");
  };

  const verifyOtp = (event) => {
    event.preventDefault();
    setError("");

    if (otp.length !== OTP_LENGTH || otp !== sentOtp) {
      setError("Incorrect OTP. Please check the 4-digit code.");
      return;
    }

    const clean = normalizeMobile(mobile);
    const accounts = readAccounts();
    let saved = accounts.find((user) => normalizeMobile(user.mobile) === clean) || null;

    if (mode === "signup") {
      if (saved) {
        setMode("login");
        setStep("details");
        setError("This mobile number is already registered. Please login instead.");
        return;
      }

      saved = {
        id: `customer-${clean}`,
        name: name.trim(),
        address: address.trim(),
        mobile: clean
      };
      saveAccounts([...accounts, saved]);
    } else if (!saved) {
      try {
        const current = JSON.parse(localStorage.getItem("kaveri-current-user") || "null");
        if (normalizeMobile(current?.mobile) === clean) saved = current;
      } catch {}
    }

    const customer = {
      id: saved?.id || `customer-${clean}`,
      name: saved?.name || name.trim() || "Guest",
      address: saved?.address || address.trim() || "",
      mobile: clean
    };

    try {
      localStorage.setItem("kaveri-current-user", JSON.stringify(customer));
    } catch {}

    onAuthenticated?.(customer);
    nav?.("order");
  };

  return (
    <main className="customer-auth-page">
      <div className="customer-auth-shell">
        <section className="customer-auth-visual">
          <span>YOUR TABLE · YOUR STAY</span>
          <h1>Eat well.<br /><em>Stay longer.</em></h1>
          <p>{hotel.name || "Our restaurant"} brings dining and comfortable rooms together in one guest experience.</p>
          <div className="customer-auth-trust">
            <div><Check size={16} /> Fast ordering</div>
            <div><Check size={16} /> Room booking</div>
            <div><Check size={16} /> Order tracking</div>
          </div>
        </section>

        <section className="customer-auth-card">
          <button type="button" className="customer-site-back" onClick={() => nav?.("landing")}>
            ← Back to Home
          </button>

          <div className="customer-auth-heading">
            <span>{mode === "login" ? "WELCOME BACK" : "NEW GUEST"}</span>
            <h2>{mode === "login" ? "Login to order." : "Create your account."}</h2>
            <p>Mobile number + 4-digit OTP. No password required.</p>
          </div>

          <div className="customer-auth-tabs">
            <button type="button" className={mode === "login" ? "active" : ""} onClick={() => switchMode("login")}>Login</button>
            <button type="button" className={mode === "signup" ? "active" : ""} onClick={() => switchMode("signup")}>Create Account</button>
          </div>

          {step === "details" ? (
            <form onSubmit={sendOtp} className="customer-auth-form">
              {mode === "signup" && (
                <>
                  <label>Full name<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" /></label>
                  <label>Address<textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Delivery address" rows={3} /></label>
                </>
              )}
              <label>Mobile number
                <div className="customer-mobile-field">
                  <span>+91</span><Smartphone size={16} />
                  <input inputMode="numeric" maxLength={10} value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0,10))} placeholder="98765 43210" />
                </div>
              </label>
              <button type="submit" className="customer-auth-submit">Send 4-Digit OTP<ArrowRight size={17} /></button>
            </form>
          ) : (
            <form onSubmit={verifyOtp} className="customer-auth-form">
              <div className="customer-otp-note"><Lock size={18} /><div><strong>OTP sent to +91 {mobile}</strong><span>Development OTP: {sentOtp}</span></div></div>
              <label>Enter OTP<input className="customer-otp-input" inputMode="numeric" maxLength={4} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0,4))} placeholder="1234" /></label>
              <button type="submit" className="customer-auth-submit">Verify & Continue<ArrowRight size={17} /></button>
              <button type="button" className="customer-back-link" onClick={() => { setStep("details"); setOtp(""); }}>Change mobile number</button>
            </form>
          )}

          {error && <div className="customer-auth-error">{error}</div>}
        </section>
      </div>
    </main>
  );
}
