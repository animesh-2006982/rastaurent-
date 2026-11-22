export interface MenuCategory {
  id: string;
  name: string;
  active: boolean;
  sortOrder?: number;
}

export interface MenuItem {
  id: string;
  name: string;
  categoryId: string;
  categoryName?: string;
  description?: string;
  price: number;
  imageUrl?: string;
  available: boolean;
  active: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

/* Staff POS compatibility */
export type FoodItem = MenuItem;
export type FoodCategory = MenuCategory;