import { AlertTriangle, CheckCircle2, Usb } from 'lucide-react';

import { cn } from '@/lib/utils';

type PrinterBannerProps = {
  isSupported: boolean;
  isConnected: boolean;
  message: string | null;
};

export function PrinterBanner({
  isSupported,
  isConnected,
  message,
}: PrinterBannerProps) {
  const Icon = !isSupported ? AlertTriangle : isConnected ? CheckCircle2 : Usb;

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-2xl px-4 py-3 text-sm',
        !isSupported
          ? 'bg-rose-500/15 text-rose-100 ring-1 ring-rose-400/30'
          : isConnected
            ? 'bg-emerald-500/15 text-emerald-100 ring-1 ring-emerald-400/30'
            : 'bg-amber-500/15 text-amber-100 ring-1 ring-amber-400/30',
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        <div className="font-medium">
          {!isSupported
            ? 'Browser capability unavailable'
            : isConnected
              ? 'Printer connected'
              : 'Printer disconnected'}
        </div>
        <p className="mt-1 text-xs text-inherit/90">
          {message ??
            'Connect a paired 80mm thermal printer to enable instant KOT/BOT receipts.'}
        </p>
      </div>
    </div>
  );
}
