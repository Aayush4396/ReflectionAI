import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface SecurityBadgeProps {
  onClick?: () => void;
}

export const SecurityBadge: React.FC<SecurityBadgeProps> = ({ onClick }) => {
  return (
    <button
      id="btn-security-badge"
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-emerald-300 bg-emerald-950/70 hover:bg-emerald-900/60 border border-emerald-800/70 rounded-full transition-all cursor-pointer shadow-xs"
      title="Click to view Privacy & Security details"
    >
      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
      <span className="truncate">Private &amp; Secure Cloud Storage</span>
    </button>
  );
};
