export type EmployeeRole = "Owner" | "Manager" | "Cashier" | "Waiter" | "Kitchen";
export type EmployeeStatus = "Active" | "Inactive";

export interface AuthUser {
  id: string;
  employeeId: string;
  name: string;
  phone: string;
  email?: string;
  role: EmployeeRole;
  status: EmployeeStatus;
  joinedAt: string;
  permissions: string[];
  loggedInAt?: string;
}

export interface Employee {
  id: string;
  name: string;
  role: EmployeeRole;
  phone: string;
  status: EmployeeStatus;
  avatar?: string;
  pin?: string;
}
