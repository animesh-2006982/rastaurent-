import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";
import "@/components/layout/sidebar.css";
import "@/components/front-desk/front-desk.css";

import { AuthProvider } from "@/context/AuthContext";
import { RestaurantProvider } from "@/context/RestaurantContext";
import { CartProvider } from "@/context/CartContext";

export const metadata: Metadata = {
  title: "Clock Tower Staff POS",
  description: "Clock Tower Restaurant & Cafe Staff POS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <RestaurantProvider>
            <CartProvider>
              {children}
            </CartProvider>
          </RestaurantProvider>
        </AuthProvider>
      </body>
    </html>
  );
}