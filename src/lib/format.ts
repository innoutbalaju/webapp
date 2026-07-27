import type { Order, OrderItemInput, SalesSummary } from '@/types/domain';

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function getTotalItemUnits(items: OrderItemInput[]) {
  return items.reduce((total, item) => total + item.quantity, 0);
}

export function summarizeOrders(orders: Order[]): SalesSummary {
  const totalRevenue = orders.reduce((sum, order) => {
    if (order.status === 'Canceled') {
      return sum;
    }

    return sum + Number(order.total_price ?? 0);
  }, 0);

  const deliveredOrders = orders.filter(
    (order) => order.status === 'Delivered' || order.status === 'Completed',
  ).length;

  const canceledOrders = orders.filter(
    (order) => order.status === 'Canceled',
  ).length;

  return {
    totalRevenue,
    totalOrders: orders.length,
    deliveredOrders,
    canceledOrders,
    averageOrderValue: orders.length ? totalRevenue / orders.length : 0,
  };
}
