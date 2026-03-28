// ═══════════════════════════════════════════════════════════════════
// LocalFashion Shared Types
// ═══════════════════════════════════════════════════════════════════

export type UserRole = 'buyer' | 'seller' | 'delivery' | 'agent' | 'admin';

export type OrderStatus =
  | 'pending_payment'
  | 'confirmed'
  | 'accepted'
  | 'preparing'
  | 'ready_for_pickup'
  | 'assigned'
  | 'picked_up'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'return_requested'
  | 'refunded';

export type StoreStatus = 'pending' | 'active' | 'suspended' | 'closed';
export type DeliveryStatus = 'offline' | 'online' | 'on_delivery';
export type VehicleType = 'bicycle' | 'motorcycle' | 'auto';
export type LockType = 'soft' | 'hard';

export interface JwtPayload {
  sub: string;       // user_id
  phone: string;
  role: UserRole;
  city_id: string;
  exp?: number;
}

export interface City {
  id: string;
  name: string;
  lat: number;
  lng: number;
  delivery_radius_km: number;
  platform_fee_pct: number;
  is_active: boolean;
}

export interface User {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  city_id?: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface Store {
  id: string;
  owner_user_id: string;
  city_id: string;
  name: string;
  description?: string;
  address: string;
  lat?: number;
  lng?: number;
  category_id?: string;
  logo_url?: string;
  banner_url?: string;
  return_policy_days: number;
  prep_time_mins: number;
  status: StoreStatus;
  created_at: string;
}

export interface Product {
  id: string;
  store_id: string;
  city_id: string;
  name: string;
  description?: string;
  price: number;
  mrp?: number;
  category_id?: string;
  brand?: string;
  tags?: string[];
  sold_count: number;
  is_active: boolean;
  created_at: string;
  // Joined fields
  store_name?: string;
  primary_image?: string;
  avg_rating?: number;
  review_count?: number;
  eta_minutes?: number;
  variants?: Variant[];
}

export interface Variant {
  id: string;
  product_id: string;
  size?: string;
  color?: string;
  color_hex?: string;
  stock_quantity: number;
  sku?: string;
  price_override?: number;
}

export interface CartItem {
  id: string;
  user_id: string;
  variant_id: string;
  quantity: number;
  // Joined
  variant?: Variant;
  product?: Product;
}

export interface Order {
  id: string;
  buyer_id: string;
  store_id: string;
  city_id: string;
  status: OrderStatus;
  subtotal: number;
  delivery_fee: number;
  platform_fee: number;
  total_amount: number;
  address_snapshot: Address;
  otp?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  created_at: string;
  accepted_at?: string;
  ready_at?: string;
  picked_up_at?: string;
  delivered_at?: string;
  cancelled_at?: string;
  // Joined
  items?: OrderItem[];
  store?: Store;
  delivery_partner?: DeliveryPartner;
}

export interface OrderItem {
  id: string;
  order_id: string;
  variant_id: string;
  product_id: string;
  quantity: number;
  price_at_purchase: number;
  product_snapshot?: any;
  // Joined
  product?: Product;
  variant?: Variant;
}

export interface Address {
  label?: string;
  full_address: string;
  area?: string;
  city?: string;
  pincode?: string;
  lat?: number;
  lng?: number;
}

export interface DeliveryPartner {
  id: string;
  user_id: string;
  city_id: string;
  vehicle_type: VehicleType;
  status: DeliveryStatus;
  current_lat?: number;
  current_lng?: number;
  current_order_id?: string;
  // Joined
  user?: User;
}

export interface Rating {
  id: string;
  order_id: string;
  buyer_id: string;
  product_id?: string;
  product_rating?: number;
  delivery_rating?: number;
  review_text?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title?: string;
  body?: string;
  data?: Record<string, any>;
  is_read: boolean;
  sent_at: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

export interface ProductFilters {
  city_id: string;
  q?: string;
  category_id?: string;
  sizes?: string[];
  colors?: string[];
  min_price?: number;
  max_price?: number;
  brand?: string;
  store_id?: string;
  min_rating?: number;
  sort?: 'sold_count' | 'price_asc' | 'price_desc' | 'created_at' | 'avg_rating';
  page?: number;
  limit?: number;
}
