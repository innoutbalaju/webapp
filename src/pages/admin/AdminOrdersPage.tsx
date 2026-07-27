import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { CheckCheck, ChefHat, CircleOff, Printer, RefreshCw, Usb } from 'lucide-react';

import { AdminShell } from '@/components/AdminShell';
import { EmptyState } from '@/components/EmptyState';
import { PrinterBanner } from '@/components/PrinterBanner';
import { SectionCard } from '@/components/SectionCard';
import { StatusBadge } from '@/components/StatusBadge';
import { playAlertTone } from '@/lib/audio';
import { getErrorMessage } from '@/lib/errors';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { buildReceiptBuffer } from '@/lib/printing/receipt';
import {
  getPrinterSupport,
  printBytes,
  requestPrinterDevice,
  type WebUsbDevice,
} from '@/lib/printing/webusb';
import { supabase } from '@/lib/supabase';
import { useSessionStore } from '@/store/sessionStore';
import type { MenuItem, Order } from '@/types/domain';

type PrintState = Record<string, 'idle' | 'printing' | 'printed' | 'failed'>;

export default function AdminOrdersPage() {
  const role = useSessionStore((state) => state.role);

  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [printerDevice, setPrinterDevice] = useState<WebUsbDevice | null>(null);
  const [printState, setPrintState] = useState<PrintState>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [flashFailure, setFlashFailure] = useState(false);

  const printerSupport = getPrinterSupport();

  useEffect(() => {
    let ignore = false;

    async function bootstrap() {
      const [{ data: orderData, error: orderError }, { data: menuData, error: menuError }] =
        await Promise.all([
          supabase.from('orders').select('*').order('created_at', { ascending: false }),
          supabase.from('menu_items').select('*'),
        ]);

      if (ignore) {
        return;
      }

      if (orderError) {
        setErrorMessage(getErrorMessage(orderError));
      } else {
        setOrders((orderData as Order[]) ?? []);
      }

      if (menuError) {
        setErrorMessage(getErrorMessage(menuError));
      } else {
        setMenuItems((menuData as MenuItem[]) ?? []);
      }
    }

    bootstrap();

    const channel = supabase
      .channel('admin-orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        async (payload) => {
          const { data } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });

          setOrders((data as Order[]) ?? []);

          if (payload.eventType === 'INSERT') {
            const order = payload.new as Order;
            await playAlertTone(920, 220);
            if (printerDevice) {
              void handlePrint(order);
            }
          }
        },
      )
      .subscribe();

    return () => {
      ignore = true;
      supabase.removeChannel(channel);
    };
  }, [printerDevice]);

  const menuMap = useMemo(
    () => Object.fromEntries(menuItems.map((item) => [item.id, item])),
    [menuItems],
  );

  if (role !== 'admin') {
    return <Navigate replace to="/login" />;
  }

  async function connectPrinter() {
    try {
      const device = await requestPrinterDevice();
      setPrinterDevice(device);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    }
  }

  async function handlePrint(order: Order) {
    if (!printerDevice) {
      setPrintState((current) => ({ ...current, [order.id]: 'failed' }));
      setErrorMessage('Printer is disconnected. Connect an 80mm device and retry.');
      setFlashFailure(true);
      await playAlertTone(240, 400);
      window.setTimeout(() => setFlashFailure(false), 600);
      return;
    }

    try {
      setPrintState((current) => ({ ...current, [order.id]: 'printing' }));
      const buffer = buildReceiptBuffer(order, menuItems);
      await printBytes(printerDevice, buffer);
      setPrintState((current) => ({ ...current, [order.id]: 'printed' }));

      if (order.status === 'Pending') {
        await (supabase.from('orders') as any)
          .update({ status: 'Printed' })
          .eq('id', order.id);
      }
    } catch (error) {
      setPrintState((current) => ({ ...current, [order.id]: 'failed' }));
      setErrorMessage(getErrorMessage(error));
      setFlashFailure(true);
      await playAlertTone(240, 400);
      window.setTimeout(() => setFlashFailure(false), 600);
    }
  }

  async function updateStatus(orderId: string, status: Order['status']) {
    const { error } = await (supabase.from('orders') as any)
      .update({ status })
      .eq('id', orderId);

    if (error) {
      setErrorMessage(getErrorMessage(error));
    }
  }

  return (
    <>
      {flashFailure ? (
        <div className="pointer-events-none fixed inset-0 z-50 bg-rose-500/25" />
      ) : null}

      <AdminShell
        title="Live order queue"
        subtitle="Incoming orders appear in realtime, trigger audio alerts, and print to the paired 80mm thermal device."
        headerExtras={
          <div className="space-y-3">
            <PrinterBanner
              isConnected={Boolean(printerDevice)}
              isSupported={printerSupport.isSupported}
              message={printerSupport.message}
            />
            <button
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-300 px-4 py-3 text-sm font-medium text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!printerSupport.isSupported}
              onClick={connectPrinter}
              type="button"
            >
              <Usb className="h-4 w-4" />
              Connect 80mm Printer
            </button>
          </div>
        }
      >
        {errorMessage ? (
          <div className="mb-5 rounded-2xl bg-rose-500/15 px-4 py-3 text-sm text-rose-200 ring-1 ring-rose-400/30">
            {errorMessage}
          </div>
        ) : null}

        {orders.length === 0 ? (
          <EmptyState
            title="No live orders"
            description="New guest orders will stream into this queue automatically."
          />
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {orders.map((order) => {
              const items = order.items.map((item) => ({
                ...item,
                title: menuMap[item.item_id]?.title ?? 'Unknown item',
              }));

              const orderPrintState = printState[order.id] ?? 'idle';

              return (
                <SectionCard
                  key={order.id}
                  title={`Room ${order.room_number}`}
                  description={formatDateTime(order.created_at)}
                  actions={<StatusBadge status={order.status} />}
                >
                  <div className="space-y-4">
                    <div className="space-y-2 rounded-3xl bg-white/5 p-4 text-sm">
                      {items.map((item) => (
                        <div key={item.item_id} className="flex items-center justify-between">
                          <span className="text-slate-200">
                            {item.quantity} x {item.title}
                          </span>
                          <span className="text-slate-400">
                            {formatCurrency(
                              Number(menuMap[item.item_id]?.price ?? 0) * item.quantity,
                            )}
                          </span>
                        </div>
                      ))}
                      <div className="border-t border-white/10 pt-3">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-300">Total</span>
                          <span className="font-medium text-amber-50">
                            {formatCurrency(order.total_price)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-2 md:grid-cols-2">
                      <button
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-500/15 px-4 py-3 text-sm text-indigo-100 transition hover:bg-indigo-500/25"
                        onClick={() => updateStatus(order.id, 'Preparing')}
                        type="button"
                      >
                        <ChefHat className="h-4 w-4" />
                        Mark as Preparing
                      </button>
                      <button
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500/15 px-4 py-3 text-sm text-emerald-100 transition hover:bg-emerald-500/25"
                        onClick={() => updateStatus(order.id, 'Delivered')}
                        type="button"
                      >
                        <CheckCheck className="h-4 w-4" />
                        Mark as Delivered
                      </button>
                      <button
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-500/15 px-4 py-3 text-sm text-rose-100 transition hover:bg-rose-500/25"
                        onClick={() => updateStatus(order.id, 'Canceled')}
                        type="button"
                      >
                        <CircleOff className="h-4 w-4" />
                        Cancel Order
                      </button>
                      <button
                        className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm transition ${
                          orderPrintState === 'failed'
                            ? 'bg-rose-600 text-white hover:bg-rose-500'
                            : 'bg-white/5 text-slate-100 hover:bg-white/10'
                        }`}
                        onClick={() => handlePrint(order)}
                        type="button"
                      >
                        {orderPrintState === 'failed' ? (
                          <>
                            <RefreshCw className="h-4 w-4" />
                            Failed - Click to Retry Print
                          </>
                        ) : (
                          <>
                            <Printer className="h-4 w-4" />
                            Reprint Ticket
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </SectionCard>
              );
            })}
          </div>
        )}
      </AdminShell>
    </>
  );
}
