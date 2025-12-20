/**
 * PasswordPromptModal (confirm gate)
 *
 * Despite the name, this is currently a confirmation modal used to gate
 * high-impact admin actions (template edits, tail resets, etc).
 *
 * We keep it lightweight and purely client-side for now.
 */
import React from 'react';
import { AlertTriangle, Shield, X } from 'lucide-react';

export interface PasswordPromptModalProps {
  title: string;
  message: string;
  contactInfo?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const PasswordPromptModal: React.FC<PasswordPromptModalProps> = ({
  title,
  message,
  contactInfo,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}) => {
  return (
    <div className="fixed inset-0 z-[500] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-800">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 bg-amber-500/15 border border-amber-500/30 rounded-xl p-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="text-sm font-extrabold text-white tracking-wide">{title}</div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                <Shield size={12} className="text-amber-500" />
                Restricted admin action
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-2 text-slate-500 hover:text-white"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4">
          <div className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">{message}</div>

          {contactInfo && (
            <div className="mt-4 text-[11px] text-slate-400">
              Need access? Contact <span className="text-amber-300 font-bold">{contactInfo}</span>
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-slate-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold uppercase tracking-wider border border-slate-700"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-black uppercase tracking-wider"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};


