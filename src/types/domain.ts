export type UserRole = 'guest' | 'admin';

export type Room = {
  id: string;
  room_number: string;
  pin_code: string;
  assigned_google_id: string | null;
  is_blocked: boolean;
};

export type MenuCategory = 'Food' | 'Beverage' | 'Amenities';

export type MenuItem = {
  id: string;
  title: string;
  category: MenuCategory;
  price: number;
  is_available: boolean;
};

export type OrderItemInput = {
  item_id: string;
  quantity: number;
};

export type OrderStatus =
  | 'Pending'
  | 'Printed'
  | 'Preparing'
  | 'Delivered'
  | 'Completed'
  | 'Canceled';

export type Order = {
  id: string;
  room_number: string;
  items: OrderItemInput[];
  total_price: number;
  status: OrderStatus;
  created_at: string;
};

export type BoundSession = {
  room: Room | null;
  role: UserRole;
};

export type SalesSummary = {
  totalRevenue: number;
  totalOrders: number;
  deliveredOrders: number;
  canceledOrders: number;
  averageOrderValue: number;
};

export type PrinterSupport = {
  isSupported: boolean;
  message: string | null;
};

export type PrinterEndpoint = {
  configurationValue: number;
  interfaceNumber: number;
  endpointNumber: number;
};
