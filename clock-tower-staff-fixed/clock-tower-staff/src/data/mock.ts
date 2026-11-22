import type { MenuItem, FoodCategory } from "@/types/menu";
import type { RestaurantTable } from "@/types/table";
import type { Employee } from "@/types/employee";
import type { Order } from "@/types/order";

export const categories: FoodCategory[] = [
  { id: "all", name: "All" },
  { id: "starters", name: "Starters" },
  { id: "main-course", name: "Main Course" },
  { id: "biryani", name: "Biryani" },
  { id: "pizza", name: "Pizza" },
  { id: "burger", name: "Burger" },
  { id: "beverages", name: "Beverages" },
];

const food = (item: Omit<MenuItem, "categoryId">): MenuItem => ({
  ...item,
  categoryId: item.category.toLowerCase().replace(/\s+/g, "-"),
});

export const menuItems: MenuItem[] = [
  food({ id: "food-1", name: "Chicken Biryani", category: "Biryani", price: 220, discountPrice: 199, description: "Aromatic basmati rice with tender chicken, special spices and herbs.", image: "https://images.unsplash.com/photo-1563379091339-03246963d96c?auto=format&fit=crop&w=900&q=85", available: true, prepTime: 20, ingredients: [
    { id: "i1", name: "Basmati Rice", stock: 48, unit: "kg", minimum: 10 },
    { id: "i2", name: "Chicken", stock: 18, unit: "kg", minimum: 10 },
    { id: "i3", name: "Onion", stock: 30, unit: "kg", minimum: 10 },
    { id: "i4", name: "Oil", stock: 25, unit: "L", minimum: 5 },
    { id: "i5", name: "Spices", stock: 12, unit: "kg", minimum: 3 },
  ], modifiers: [
    { id: "m1", name: "Extra Chicken", price: 80 },
    { id: "m2", name: "Extra Egg", price: 20 },
    { id: "m3", name: "Raita", price: 30 },
    { id: "m4", name: "Extra Rice", price: 40 },
  ] }),
  food({ id: "food-2", name: "Mutton Biryani", category: "Biryani", price: 280, description: "Slow-cooked mutton biryani with fragrant rice.", image: "https://images.unsplash.com/photo-1701579231306-6eab5c8a4fcb?auto=format&fit=crop&w=900&q=85", available: true, prepTime: 25, ingredients: [], modifiers: [] }),
  food({ id: "food-3", name: "Egg Biryani", category: "Biryani", price: 240, description: "Spiced biryani with eggs and aromatic basmati rice.", image: "https://images.unsplash.com/photo-1599043513900-ed6fe01d3833?auto=format&fit=crop&w=900&q=85", available: true, prepTime: 18, ingredients: [], modifiers: [] }),
  food({ id: "food-4", name: "Veg Biryani", category: "Biryani", price: 180, description: "Seasonal vegetables with fragrant basmati rice.", image: "https://images.unsplash.com/photo-1630383249896-424e482df921?auto=format&fit=crop&w=900&q=85", available: true, prepTime: 15, ingredients: [], modifiers: [] }),
  food({ id: "food-5", name: "Chicken Pizza", category: "Pizza", price: 350, description: "Loaded chicken pizza with cheese and herbs.", image: "https://images.unsplash.com/photo-1566843972142-a7fcb70de55a?auto=format&fit=crop&w=900&q=85", available: true, prepTime: 20, ingredients: [], modifiers: [] }),
  food({ id: "food-6", name: "Margherita Pizza", category: "Pizza", price: 320, description: "Classic tomato, mozzarella and basil pizza.", image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=900&q=85", available: true, prepTime: 18, ingredients: [], modifiers: [] }),
  food({ id: "food-7", name: "Chicken Burger", category: "Burger", price: 220, description: "Crispy chicken burger with fresh vegetables.", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=85", available: true, prepTime: 12, ingredients: [], modifiers: [] }),
  food({ id: "food-8", name: "Veg Burger", category: "Burger", price: 180, description: "Crispy vegetable patty burger.", image: "https://images.unsplash.com/photo-1520072959219-c595dc870360?auto=format&fit=crop&w=900&q=85", available: true, prepTime: 10, ingredients: [], modifiers: [] }),
  food({ id: "food-9", name: "French Fries", category: "Starters", price: 120, description: "Golden crisp fries with seasoning.", image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=900&q=85", available: true, prepTime: 8, ingredients: [], modifiers: [] }),
  food({ id: "food-10", name: "Coke", category: "Beverages", price: 60, description: "Chilled soft drink.", image: "https://images.unsplash.com/photo-1629203849820-fdd70d49c38e?auto=format&fit=crop&w=900&q=85", available: true, prepTime: 2, ingredients: [], modifiers: [] }),
];

export const tables: RestaurantTable[] = Array.from({ length: 12 }, (_, index) => {
  const id = `T${String(index + 1).padStart(2, "0")}`;
  const seats = [4, 4, 2, 6, 4, 4, 2, 4, 4, 6, 4, 2][index];
  const status = [1, 5, 9].includes(index) ? "Occupied" : index === 3 ? "Reserved" : "Available";
  const amount = index === 1 ? 850 : index === 5 ? 1240 : index === 9 ? 560 : 0;
  return { id, number: id, seats, capacity: seats, status, amount } as RestaurantTable;
});

export const employees: Employee[] = [
  { id: "CT-102", name: "Rahul Das", role: "Cashier", phone: "9876543210", status: "Active", pin: "1234" },
  { id: "CT-103", name: "Amit Kumar", role: "Waiter", phone: "9876543211", status: "Active", pin: "1234" },
  { id: "CT-104", name: "Sonia Devi", role: "Kitchen", phone: "9876543212", status: "Active", pin: "1234" },
  { id: "CT-105", name: "Priya Sharma", role: "Manager", phone: "9876543213", status: "Active", pin: "1234" },
  { id: "CT-106", name: "Rihan Dey", role: "Waiter", phone: "9876543214", status: "Inactive", pin: "1234" },
];

export const sampleOrders: Order[] = [
  { id: "#1042", table: "T02", type: "Dine In", customer: "Walk-in Customer", items: [
    { id: "food-1-1", foodId: "food-1", name: "Chicken Biryani", price: 220, quantity: 2, qty: 2, image: menuItems[0].image, modifiers: [] },
    { id: "food-10-1", foodId: "food-10", name: "Coke", price: 60, quantity: 1, qty: 1, image: menuItems[9].image, modifiers: [] },
    { id: "food-9-1", foodId: "food-9", name: "French Fries", price: 120, quantity: 1, qty: 1, image: menuItems[8].image, modifiers: [] },
  ], status: "New", createdAt: "2 min ago", total: 651 },
  { id: "#1038", table: "T04", type: "Dine In", customer: "Walk-in Customer", items: [
    { id: "food-5-1", foodId: "food-5", name: "Chicken Pizza", price: 350, quantity: 1, qty: 1, image: menuItems[4].image, modifiers: [] },
    { id: "food-10-2", foodId: "food-10", name: "Coke", price: 60, quantity: 2, qty: 2, image: menuItems[9].image, modifiers: [] },
  ], status: "Preparing", createdAt: "8 min", total: 493 },
  { id: "#1035", table: "T01", type: "Dine In", customer: "Rahul", items: [
    { id: "food-8-1", foodId: "food-8", name: "Veg Burger", price: 180, quantity: 2, qty: 2, image: menuItems[7].image, modifiers: [] },
    { id: "food-9-2", foodId: "food-9", name: "French Fries", price: 120, quantity: 1, qty: 1, image: menuItems[8].image, modifiers: [] },
  ], status: "Ready", createdAt: "Ready", total: 504 },
];

export const restaurantDefaults = {
  name: "CLOCK TOWER",
  subtitle: "RESTAURANT & CAFE",
  phone: "+91 9876543210",
  address: "Dharmanagar, Tripura",
  heroTitle: "Taste The Tradition",
  heroSubtitle: "Authentic food, fresh ingredients and unforgettable flavours.",
  heroImage: menuItems[0].image,
  buttonText: "Order Now",
};
