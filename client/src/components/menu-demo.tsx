"use client";

import { useApp } from "@/context/app-context";
import { useCartStore } from "@/store/cart-store";

const MENU = [
  { id: "margherita", name: "Margherita", price: 9 },
  { id: "pepperoni", name: "Pepperoni", price: 11 },
];

export function MenuDemo() {
  const { brand } = useApp();
  const { items, add, total } = useCartStore();
  return (
    <section>
      <h1>{brand} 🍕</h1>
      <ul>
        {MENU.map((p) => (
          <li key={p.id}>
            {p.name} - ${p.price} <button onClick={() => add(p)}>Add</button>
          </li>
        ))}
      </ul>
      <p>Items: {items.reduce((n, i) => n + i.qty, 0)} | Total: ${total()}</p>
    </section>
  );
}
