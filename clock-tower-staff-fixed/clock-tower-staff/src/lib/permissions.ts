import type { EmployeeRole } from "@/types/employee";

const permissions: Record<EmployeeRole, string[]> = {
  Owner: ["*"],
  Manager: ["dashboard", "orders", "menu", "inventory", "employees", "customers", "tables", "reports", "settings", "pos", "kitchen", "shift"],
  Cashier: ["pos", "orders", "payments", "tables", "shift", "customers"],
  Waiter: ["pos", "tables", "orders", "customers"],
  Kitchen: ["kitchen", "orders"],
};

export function can(role: EmployeeRole, permission: string): boolean {
  return permissions[role]?.includes("*") || permissions[role]?.includes(permission) || false;
}
