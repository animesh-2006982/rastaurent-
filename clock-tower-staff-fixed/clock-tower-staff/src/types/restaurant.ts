export type UserRole =
  | "admin"
  | "manager"
  | "cashier"
  | "waiter"
  | "kitchen";

export interface StaffUser {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  photoURL?: string;
  active?: boolean;
  createdAt?: unknown;
}

export interface RestaurantSettings {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  currency?: string;
  taxPercent?: number;
  serviceChargePercent?: number;
  logoUrl?: string;
}