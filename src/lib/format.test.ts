import { describe, expect, it } from 'vitest';

import { getTotalItemUnits, summarizeOrders } from '@/lib/format';
import type { Order } from '@/types/domain';

describe('format helpers', () => {
  it('counts total item units across an order payload', () => {
    expect(
      getTotalItemUnits([
        { item_id: 'a', quantity: 2 },
        { item_id: 'b', quantity: 3 },
      ]),
    ).toBe(5);
  });

  it('summarizes revenue without canceled orders contributing to revenue', () => {
    const orders: Order[] = [
      {
        id: '1',
        room_number: '101',
        items: [{ item_id: 'a', quantity: 1 }],
        total_price: 12,
        status: 'Delivered',
        created_at: new Date().toISOString(),
      },
      {
        id: '2',
        room_number: '102',
        items: [{ item_id: 'b', quantity: 1 }],
        total_price: 7,
        status: 'Canceled',
        created_at: new Date().toISOString(),
      },
    ];

    expect(summarizeOrders(orders)).toMatchObject({
      totalRevenue: 12,
      totalOrders: 2,
      deliveredOrders: 1,
      canceledOrders: 1,
      averageOrderValue: 6,
    });
  });
});
