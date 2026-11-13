/** Build Your Own pizza: options and prices (from the Figma "pizzaway-v2-build-your-own" page). */

export type SizeId = "7" | "9" | "12" | "15";
export type SauceId = "tomato" | "bbq";
export type CrustId = "thin" | "deep-pan" | "stone-baked";
export type ToppingCategory = "vegetables" | "meats" | "seafood";

export const SIZES: { id: SizeId; label: string; summary: string; price: number }[] = [
  { id: "7", label: '7"', summary: '7" Mini Base', price: 3.5 },
  { id: "9", label: '9"', summary: '9" Small Base', price: 6 },
  { id: "12", label: '12"', summary: '12" Medium Base', price: 9 },
  { id: "15", label: '15"', summary: '15" Large Base', price: 11 },
];

export const SAUCES: { id: SauceId; label: string; summary: string }[] = [
  { id: "tomato", label: "Tomato Sauce (Classic)", summary: "San Marzano Tomato Sauce" },
  { id: "bbq", label: "Smoky BBQ Sauce", summary: "Smoky BBQ Sauce" },
];

export const CRUSTS: { id: CrustId; label: string; summary: string }[] = [
  { id: "thin", label: "Thin Crust", summary: "Thin Crust" },
  { id: "deep-pan", label: "Deep Pan", summary: "Deep Pan Crust" },
  { id: "stone-baked", label: "Stone-baked Italian", summary: "Stone-baked Italian Crust" },
];

/** Flat price per topping (Figma: "from £0.60 each"; summary row 3 toppings = £1.80). */
export const TOPPING_PRICE = 0.6;

export const TOPPINGS: { id: string; label: string; category: ToppingCategory }[] = [
  { id: "double-cheese", label: "Double Cheese", category: "vegetables" },
  { id: "mushrooms", label: "Mushrooms", category: "vegetables" },
  { id: "red-onions", label: "Red Onions", category: "vegetables" },
  { id: "green-chillies", label: "Green Chillies", category: "vegetables" },
  { id: "fresh-tomatoes", label: "Fresh Tomatoes", category: "vegetables" },
  { id: "green-peppers", label: "Green Peppers", category: "vegetables" },
  { id: "sweetcorn", label: "Sweetcorn", category: "vegetables" },
  { id: "jalapenos", label: "Jalapeños", category: "vegetables" },
  { id: "black-olives", label: "Black Olives", category: "vegetables" },
  { id: "pineapple", label: "Pineapple", category: "vegetables" },
  { id: "tandoori-chicken", label: "Tandoori Chicken", category: "meats" },
  { id: "pepperoni", label: "Pepperoni", category: "meats" },
  { id: "turkey-ham", label: "Turkey Ham", category: "meats" },
  { id: "beef", label: "Beef", category: "meats" },
  { id: "meatballs", label: "Meatballs", category: "meats" },
  { id: "prawns", label: "Prawns", category: "seafood" },
  { id: "tuna", label: "Tuna", category: "seafood" },
  { id: "anchovies", label: "Anchovies", category: "seafood" },
];

export const TOPPING_CATEGORIES: { id: ToppingCategory; label: string }[] = [
  { id: "vegetables", label: "VEGETABLES" },
  { id: "meats", label: "MEATS" },
  { id: "seafood", label: "SEAFOOD" },
];

export const STEPS = [
  { id: 1, label: "Size", anchor: "byo-size" },
  { id: 2, label: "Base", anchor: "byo-base" },
  { id: 3, label: "Toppings", anchor: "byo-toppings" },
  { id: 4, label: "Extras", anchor: "byo-summary" },
] as const;

export const MAX_QTY = 20;
