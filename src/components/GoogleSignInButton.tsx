import React from 'react';
import { User } from 'firebase/auth';
import { LogOut, CheckCircle2 } from 'lucide-react';

interface GoogleSignInButtonProps {
  user: User | null;
  onSignIn: () => void;
  onSignOut: () => void;
  isLoading?: boolean;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  user,
  onSignIn,
  onSignOut,
  isLoading = false,
}) => {
  if (user) {
    return (
      <div className="flex items-center gap-2.5 bg-slate-900/90 border border-slate-700/80 rounded-lg px-3 py-1.5 shadow-sm text-xs">
        <div className="relative">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || 'Google User'}
              className="w-7 h-7 rounded-full border border-emerald-500/40 object-cover"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-emerald-600/30 text-emerald-300 font-bold flex items-center justify-center text-xs">
              {(user.displayName || user.email || 'U')[0].toUpperCase()}
            </div>
          )}
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-900" />
        </div>
        <div className="flex flex-col text-left leading-tight pr-1">
          <span className="font-medium text-slate-200 truncate max-w-[130px]">
            {user.displayName || 'Authenticated'}
          </span>
          <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
            <CheckCircle2 className="w-2.5 h-2.5" /> Sheets Connected
          </span>
        </div>
        <button
          onClick={onSignOut}
          title="Sign out of Google"
          className="ml-1 p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      className="gsi-material-button shadow-sm"
      onClick={onSignIn}
      disabled={isLoading}
    >
      <div className="gsi-material-button-state"></div>
      <div className="gsi-material-button-content-wrapper">
        <div className="gsi-material-button-icon">
          <svg
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 48 48"
            style={{ display: 'block' }}
          >
            <path
              fill="#EA4335"
              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
            ></path>
            <path
              fill="#4285F4"
              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
            ></path>
            <path
              fill="#FBBC05"
              d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
            ></path>
            <path
              fill="#34A853"
              d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
            ></path>
            <path fill="none" d="M0 0h48v48H0z"></path>
          </svg>
        </div>
        <span className="gsi-material-button-contents font-medium text-xs">
          {isLoading ? 'Connecting...' : 'Connect Google Sheets'}
        </span>
      </div>
    </button>
  );
};
