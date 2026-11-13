/** Menu pizza data (server-safe: no "use client"). Prices: Figma product page (7" £4.50, 9" £6.50, 12" £9.50, 15" £12.50 for the "from £4.50" pizzas). */
export type PizzaTag = "classic" | "meat" | "chicken" | "vegetarian" | "spicy";
export type PizzaSize = '7"' | '9"' | '12"' | '15"';

export type Pizza = {
  id: string;
  name: string;
  price: string;
  description: string;
  image: string;
  tags: PizzaTag[];
};

export const PIZZA_SIZES: PizzaSize[] = ['7"', '9"', '12"', '15"'];

/** Extra cost over the 7" ("from") price for each size. */
export const SIZE_EXTRA: Record<PizzaSize, number> = { '7"': 0, '9"': 2, '12"': 5, '15"': 8 };

/** Price of a pizza at a size, from its "from £x.xx" label. */
export function pizzaPrice(pizza: Pizza, size: PizzaSize): number {
  const base = Number(pizza.price.replace(/[^0-9.]/g, "")) || 0;
  return Math.round((base + SIZE_EXTRA[size]) * 100) / 100;
}

export const pizzas: Pizza[] = [
  {
    id: "margherita",
    name: "Margherita",
    price: "from £3.50",
    description:
      "San Marzano DOP tomatoes, fresh fior di latte, extra virgin olive oil, sweet wild basil.",
    image: "/brand/menu/pizza-margherita.png",
    tags: ["classic", "vegetarian"],
  },
  {
    id: "hawaiian",
    name: "Hawaiian",
    price: "from £4.50",
    description:
      "Tomato Sauce, Mozzarella Cheese, Julienne Turkey Ham, Sweet Pineapple Chunks.",
    image: "/brand/menu/pizza-hawaiian.png",
    tags: ["classic", "meat"],
  },
  {
    id: "pepperoni-plus",
    name: "Pepperoni Plus",
    price: "from £4.50",
    description:
      "Double pepperoni, spicy nduja paste, hot honey drizzle, aged parmesan crust dusting.",
    image: "/brand/menu/pizza-pepperoni-plus.png",
    tags: ["meat", "spicy"],
  },
  {
    id: "meat-feast",
    name: "Meat Feast",
    price: "from £4.50",
    description:
      "Smoked oak brisket, house-made fennel sausage, dynamic shredded chicken, smoked ham.",
    image: "/brand/menu/pizza-meat-feast.png",
    tags: ["meat", "chicken"],
  },
  {
    id: "bbq-feast",
    name: "BBQ Feast",
    price: "from £4.50",
    description:
      "Sweet smoky BBQ sauce base, tender chicken strips, crispy bacon, sweetcorn, and red onions.",
    image: "/brand/menu/pizza-bbq-feast.png",
    tags: ["meat", "chicken"],
  },
  {
    id: "chicken-choice",
    name: "Chicken Choice",
    price: "from £4.50",
    description:
      "Rich tomato sauce base, grilled chicken breast, wild mushrooms, sweet roasted garlic.",
    image: "/brand/menu/pizza-chicken-choice.png",
    tags: ["chicken"],
  },
  {
    id: "vegetarian-delight",
    name: "Vegetarian Delight (v)",
    price: "from £4.50",
    description:
      "Tomato base, mozzarella, fresh mushrooms, sweetcorn, crunchy peppers, red onions.",
    image: "/brand/menu/pizza-vegetarian-delight.png",
    tags: ["vegetarian"],
  },
  {
    id: "american-hot",
    name: "American Hot",
    price: "from £4.50",
    description:
      "Spicy jalapeño slices, dynamic red onion slivers, premium pepperoni, hot roito chilli sauce.",
    image: "/brand/menu/pizza-american-hot.png",
    tags: ["meat", "spicy"],
  },
];

