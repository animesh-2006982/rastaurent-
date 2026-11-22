export interface CalculableCartItem {
  price: number;
  quantity: number;
}

export function calculateSubtotal(items: CalculableCartItem[]): number {
  return items.reduce((total, item) => {
    return total + (Number(item.price) || 0) * (Number(item.quantity) || 0);
  }, 0);
}

export function calculateDiscount(subtotal: number, discountPercent = 0): number {
  return (Number(subtotal) * (Number(discountPercent) || 0)) / 100;
}

export function calculateTax(amount: number, taxPercent = 5): number {
  return (Number(amount) * (Number(taxPercent) || 0)) / 100;
}

export function calculateTotal(subtotal: number, discount = 0, tax = 0): number {
  return Math.max(0, Number(subtotal) - Number(discount) + Number(tax));
}

export function calculateItemTotal(price: number, quantity: number): number {
  return (Number(price) || 0) * (Number(quantity) || 0);
}
