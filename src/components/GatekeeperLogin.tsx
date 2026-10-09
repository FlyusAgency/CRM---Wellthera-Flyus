import React, { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { WelltheraLogo } from './WelltheraLogo';

interface GatekeeperLoginProps {
  onAuthenticated: () => void;
  isDarkMode?: boolean;
}

export const GatekeeperLogin: React.FC<GatekeeperLoginProps> = ({
  onAuthenticated,
  isDarkMode = false,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // Check credentials:
    // Email: crm@wellthera.ca
    // Password: CRM2026FlyUs/Wellthera
    const isEmailValid = cleanEmail === 'crm@wellthera.ca' || cleanEmail === 'crm@wellthrera.ca';
    const isPasswordValid = cleanPassword === 'CRM2026FlyUs/Wellthera';

    setTimeout(() => {
      if (isEmailValid && isPasswordValid) {
        if (rememberMe) {
          localStorage.setItem('wellthera_auth_gate', 'authenticated');
          localStorage.setItem('wellthera_gate_email', cleanEmail);
        } else {
          sessionStorage.setItem('wellthera_auth_gate', 'authenticated');
          sessionStorage.setItem('wellthera_gate_email', cleanEmail);
        }
        onAuthenticated();
      } else {
        setErrorMessage('Invalid credentials. Please verify your staff email and password.');
        setIsSubmitting(false);
      }
    }, 300);
  };

  const handleQuickFill = () => {
    setEmail('crm@wellthera.ca');
    setPassword('CRM2026FlyUs/Wellthera');
    setErrorMessage(null);
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-200 ${
        isDarkMode
          ? 'bg-[#10120b] text-[#f9f8f5]'
          : 'bg-[#f5f4ee] text-[#332e1e]'
      }`}
    >
      <div className="w-full max-w-md animate-in fade-in duration-300">
        {/* Brand Card */}
        <div
          className={`p-6 sm:p-8 rounded-3xl border shadow-xl backdrop-blur-md transition-colors ${
            isDarkMode
              ? 'bg-[#181b12]/95 border-[#292e1e]'
              : 'bg-[#ffffff]/95 border-[#e7e3da]'
          }`}
        >
          {/* Logo & Clinic Header */}
          <div className="text-center space-y-2 mb-6">
            <div className="inline-flex p-3 rounded-2xl border border-inherit bg-black/5 dark:bg-white/5 mb-1">
              <WelltheraLogo size="lg" variant={isDarkMode ? 'gold' : 'olive'} />
            </div>
            <h1 className="font-serif font-bold text-2xl tracking-tight">
              Wellthera Integrated Health
            </h1>
            <p className="text-xs uppercase font-sans tracking-widest text-[#686e4a] dark:text-[#aab187] font-semibold">
              Clinic Management & Partner Intelligence
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 mt-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Protected Staff Portal • Authorized Personnel Only</span>
            </div>
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Staff Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold block text-[#686e4a] dark:text-[#c7ccaa]">
                Authorized Staff Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 opacity-40" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="crm@wellthera.ca"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-hidden focus:ring-2 focus:ring-[#686e4a] transition-all font-sans ${
                    isDarkMode
                      ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5] placeholder:text-neutral-600'
                      : 'bg-[#faf9f5] border-[#d8d4c9] text-[#332e1e] placeholder:text-neutral-400'
                  }`}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#686e4a] dark:text-[#c7ccaa]">
                  Access Password
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 opacity-40" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm outline-hidden focus:ring-2 focus:ring-[#686e4a] transition-all font-sans ${
                    isDarkMode
                      ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5] placeholder:text-neutral-600'
                      : 'bg-[#faf9f5] border-[#d8d4c9] text-[#332e1e] placeholder:text-neutral-400'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-80 transition-opacity cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Session & Quick Fill */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-[#bcc2a4] text-[#686e4a] focus:ring-[#686e4a]"
                />
                <span className="opacity-80">Remember this device</span>
              </label>

              <button
                type="button"
                onClick={handleQuickFill}
                className="text-[11px] font-semibold text-[#686e4a] dark:text-[#c7ccaa] hover:underline flex items-center gap-1 cursor-pointer"
                title="Fill authorized credentials"
              >
                <Sparkles className="w-3 h-3 text-[#d9a726]" />
                <span>Quick Fill</span>
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 px-4 rounded-xl font-semibold text-sm bg-[#41472B] hover:bg-[#52573a] text-white shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
            >
              <span>{isSubmitting ? 'Verifying Credentials...' : 'Sign In to Dashboard'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Footer note */}
          <div className="mt-6 pt-4 border-t border-inherit text-center space-y-1 text-[11px] opacity-70">
            <p>Wellthera Integrated Health • Barrie Clinic</p>
            <p>464 Big Bay Point Rd, Barrie, ON • (705) 555-0100</p>
          </div>
        </div>
      </div>
    </div>
  );
};
