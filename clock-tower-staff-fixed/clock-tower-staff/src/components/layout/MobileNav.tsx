"use client";

import Link from "next/link";

export default function MobileNav() {
  return (
    <nav className="ct-mobile-nav">
      <Link href="/pos">
        <span>▣</span>
        POS
      </Link>

      <Link href="/tables">
        <span>▦</span>
        Tables
      </Link>

      <Link href="/orders">
        <span>☷</span>
        Orders
      </Link>

      <Link href="/kitchen">
        <span>♨</span>
        Kitchen
      </Link>

      <Link href="/shift">
        <span>◷</span>
        Shift
      </Link>
    </nav>
  );
}