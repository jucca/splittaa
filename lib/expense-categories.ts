// lib/expense-categories.js
import {
  Coffee,
  ShoppingBag,
  Utensils,
  Plane,
  Car,
  Home,
  Film,
  ShoppingCart,
  Ticket,
  Wifi,
  Droplets,
  GraduationCap,
  Heart,
  Stethoscope,
  Gift,
  Smartphone,
  MoreHorizontal,
  CreditCard,
  Baby,
  Music,
  Book,
  DollarSign,
} from "lucide-react";

export const EXPENSE_CATEGORIES = {
  foodDrink: {
    id: "foodDrink",
    name: "Ruoka ja juoma",
    icon: Utensils,
    color: "#E53935",
  },
  coffee: {
    id: "coffee",
    name: "Kahvi",
    icon: Coffee,
    color: "#795548",
  },
  groceries: {
    id: "groceries",
    name: "Ruokaostokset",
    icon: ShoppingCart,
    color: "#43A047",
  },
  shopping: {
    id: "shopping",
    name: "Ostokset",
    icon: ShoppingBag,
    color: "#8E24AA",
  },
  travel: {
    id: "travel",
    name: "Matkustus",
    icon: Plane,
    color: "#1E88E5",
  },
  transportation: {
    id: "transportation",
    name: "Liikenne",
    icon: Car,
    color: "#546E7A",
  },
  housing: {
    id: "housing",
    name: "Asuminen",
    icon: Home,
    color: "#A1887F",
  },
  entertainment: {
    id: "entertainment",
    name: "Viihde",
    icon: Film,
    color: "#FB8C00",
  },
  tickets: {
    id: "tickets",
    name: "Liput",
    icon: Ticket,
    color: "#D81B60",
  },
  utilities: {
    id: "utilities",
    name: "Palvelut",
    icon: Wifi,
    color: "#F9A825",
  },
  water: {
    id: "water",
    name: "Vesi",
    icon: Droplets,
    color: "#039BE5",
  },
  education: {
    id: "education",
    name: "Koulutus",
    icon: GraduationCap,
    color: "#5E35B1",
  },
  health: {
    id: "health",
    name: "Terveys",
    icon: Stethoscope,
    color: "#C62828",
  },
  personal: {
    id: "personal",
    name: "Henkilökohtainen",
    icon: Heart,
    color: "#EC407A",
  },
  gifts: {
    id: "gifts",
    name: "Lahjat",
    icon: Gift,
    color: "#FF7043",
  },
  technology: {
    id: "technology",
    name: "Teknologia",
    icon: Smartphone,
    color: "#3949AB",
  },
  bills: {
    id: "bills",
    name: "Laskut ja maksut",
    icon: CreditCard,
    color: "#607D8B",
  },
  baby: {
    id: "baby",
    name: "Vauvat ja lapset",
    icon: Baby,
    color: "#FFB300",
  },
  music: {
    id: "music",
    name: "Musiikki",
    icon: Music,
    color: "#9C27B0",
  },
  books: {
    id: "books",
    name: "Kirjat",
    icon: Book,
    color: "#5D4037",
  },
  other: {
    id: "other",
    name: "Muu",
    icon: MoreHorizontal,
    color: "#9E9E9E",
  },
  general: {
    id: "general",
    name: "Yleinen kulu",
    icon: DollarSign,
    color: "#00897B",
  },
};

export type ExpenseCategoryId = keyof typeof EXPENSE_CATEGORIES;

export const CATEGORY_IDS = Object.keys(
  EXPENSE_CATEGORIES,
) as ExpenseCategoryId[];

export const normalizeCategoryId = (
  categoryId: string | undefined,
): ExpenseCategoryId => {
  if (!categoryId || categoryId === "Other") {
    return "other";
  }
  const key = categoryId as ExpenseCategoryId;
  return key in EXPENSE_CATEGORIES ? key : "other";
};

export const getCategoryColor = (categoryId: string): string => {
  return EXPENSE_CATEGORIES[normalizeCategoryId(categoryId)].color;
};

export const getCategoryById = (categoryId: string) => {
  const key = categoryId as ExpenseCategoryId;
  return EXPENSE_CATEGORIES[key] ?? EXPENSE_CATEGORIES.other;
};

export const getAllCategories = () => {
  return Object.values(EXPENSE_CATEGORIES);
};

export const getCategoryIcon = (categoryId: string) => {
  const category = getCategoryById(categoryId);
  return category.icon;
};
