import React from 'react';
import { useUIStore } from '../../stores/uiStore';

export function Toast() {
  const { toast, hideToast } = useUIStore();

  if (!toast.visible) return null;

  return (
    <div
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg text-sm text-zinc-200 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200"
      onClick={hideToast}
    >
      <span className="text-blue-400">ℹ</span>
      <span>{toast.message}</span>
    </div>
  );
}
