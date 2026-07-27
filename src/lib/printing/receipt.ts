import ReceiptPrinterEncoder from '@point-of-sale/receipt-printer-encoder';

import { env } from '@/lib/env';
import { formatDateTime, formatCurrency } from '@/lib/format';
import type { MenuItem, Order } from '@/types/domain';

export function buildReceiptBuffer(order: Order, menuItems: MenuItem[]) {
  const encoder = new ReceiptPrinterEncoder({
    language: 'esc-pos',
    width: 48,
  });

  encoder
    .initialize()
    .align('center')
    .bold(true)
    .line(env.hotelName)
    .bold(false)
    .line('KOT / BOT')
    .newline()
    .bold(true)
    .size(2, 2)
    .line(`Room ${order.room_number}`)
    .size(1, 1)
    .bold(false)
    .line(formatDateTime(order.created_at))
    .newline()
    .align('left');

  order.items.forEach((item) => {
    const menuItem = menuItems.find((candidate) => candidate.id === item.item_id);
    const itemName = menuItem?.title ?? 'Unknown item';
    const itemPrice = Number(menuItem?.price ?? 0) * item.quantity;

    encoder
      .table(
        [
          { width: 6, align: 'left' },
          { width: 28, align: 'left' },
          { width: 14, align: 'right' },
        ],
        [[`x${item.quantity}`, itemName, formatCurrency(itemPrice)]],
      )
      .newline();
  });

  encoder
    .line('------------------------------------------------')
    .bold(true)
    .table(
      [
        { width: 30, align: 'left' },
        { width: 18, align: 'right' },
      ],
      [['TOTAL', formatCurrency(order.total_price)]],
    )
    .bold(false)
    .newline()
    .align('center')
    .line('Non-Cancelable Order')
    .line('Placed via Room App')
    .newline()
    .cut();

  return encoder.encode() as Uint8Array;
}
