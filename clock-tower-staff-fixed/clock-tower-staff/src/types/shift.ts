export interface CashShift {
  id: string;
  employeeId: string;
  employeeName: string;
  openingCash: number;
  cashSales: number;
  cardSales: number;
  upiSales: number;
  expectedCash: number;
  actualCash?: number;
  difference?: number;
  status: "Open" | "Closed";
  openedAt?: unknown;
  closedAt?: unknown;
}