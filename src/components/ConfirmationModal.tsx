import React from 'react';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  details?: string[];
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
  isDarkMode?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  description,
  details,
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  variant = 'primary',
  onConfirm,
  onCancel,
  isDarkMode = false,
}) => {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-[#b84a36]" />,
          btn: 'bg-[#b84a36] hover:bg-[#9e3e2d] text-white',
          badge: 'bg-[#faeee9] text-[#b84a36] border-[#eec2b8]',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-[#e6b000]" />,
          btn: 'bg-[#e6b000] hover:bg-[#c99a00] text-[#14160e]',
          badge: 'bg-[#fff9e6] text-[#b88c00] border-[#f4d068]',
        };
      case 'primary':
      default:
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-[#686e4a]" />,
          btn: 'bg-[#686e4a] hover:bg-[#52573a] text-white',
          badge: 'bg-[#edf0e6] text-[#52573a] border-[#bcc2a4]',
        };
    }
  };

  const currentVariant = getVariantStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className={`relative w-full max-w-lg rounded-2xl shadow-2xl p-6 overflow-hidden border ${
          isDarkMode
            ? 'bg-[#1a1e13] border-[#292e1e] text-[#f9f8f5]'
            : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
        }`}
      >
        {/* Close X */}
        <button
          onClick={onCancel}
          className={`absolute top-4 right-4 p-1 rounded-lg border transition-colors ${
            isDarkMode
              ? 'bg-[#14160e] border-[#292e1e] text-[#a2a992] hover:text-white'
              : 'bg-[#f0ede6] border-[#e7e3da] text-[#6e6856] hover:text-[#100e0a]'
          }`}
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4 mb-4">
          <div className={`p-2.5 rounded-xl border shrink-0 ${currentVariant.badge}`}>
            {currentVariant.icon}
          </div>
          <div>
            <h3 className="font-serif text-xl font-bold">{title}</h3>
            <p
              className={`text-xs mt-1 leading-relaxed ${
                isDarkMode ? 'text-[#8b927a]' : 'text-[#6e6856]'
              }`}
            >
              {description}
            </p>
          </div>
        </div>

        {details && details.length > 0 && (
          <div
            className={`my-4 p-3 rounded-xl border text-xs space-y-1.5 ${
              isDarkMode
                ? 'bg-[#14160e] border-[#292e1e]'
                : 'bg-[#f9f8f5] border-[#e7e3da]'
            }`}
          >
            <span
              className={`font-bold block uppercase text-[10px] tracking-wider ${
                isDarkMode ? 'text-[#8b927a]' : 'text-[#7d7663]'
              }`}
            >
              Operation Scope:
            </span>
            <ul className="space-y-1 pl-1">
              {details.map((detail, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-[#686e4a] dark:text-[#aab187] font-bold">•</span>
                  <span className="font-mono text-[11px] opacity-90">{detail}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div
          className={`mt-6 pt-4 border-t flex items-center justify-end gap-2 ${
            isDarkMode ? 'border-[#24291c]' : 'border-[#e7e3da]'
          }`}
        >
          <button
            type="button"
            onClick={onCancel}
            className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-colors ${
              isDarkMode
                ? 'bg-[#14160e] text-[#f9f8f5] border-[#292e1e] hover:bg-[#202517]'
                : 'bg-[#f0ede6] text-[#332e1e] border-[#e7e3da] hover:bg-[#e7e3da]'
            }`}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors shadow-sm ${currentVariant.btn}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
