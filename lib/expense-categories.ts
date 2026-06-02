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
  },
  coffee: {
    id: "coffee",
    name: "Kahvi",
    icon: Coffee,
  },
  groceries: {
    id: "groceries",
    name: "Ruokaostokset",
    icon: ShoppingCart,
  },
  shopping: {
    id: "shopping",
    name: "Ostokset",
    icon: ShoppingBag,
  },
  travel: {
    id: "travel",
    name: "Matkustus",
    icon: Plane,
  },
  transportation: {
    id: "transportation",
    name: "Liikenne",
    icon: Car,
  },
  housing: {
    id: "housing",
    name: "Asuminen",
    icon: Home,
  },
  entertainment: {
    id: "entertainment",
    name: "Viihde",
    icon: Film,
  },
  tickets: {
    id: "tickets",
    name: "Liput",
    icon: Ticket,
  },
  utilities: {
    id: "utilities",
    name: "Palvelut",
    icon: Wifi,
  },
  water: {
    id: "water",
    name: "Vesi",
    icon: Droplets,
  },
  education: {
    id: "education",
    name: "Koulutus",
    icon: GraduationCap,
  },
  health: {
    id: "health",
    name: "Terveys",
    icon: Stethoscope,
  },
  personal: {
    id: "personal",
    name: "Henkilökohtainen",
    icon: Heart,
  },
  gifts: {
    id: "gifts",
    name: "Lahjat",
    icon: Gift,
  },
  technology: {
    id: "technology",
    name: "Teknologia",
    icon: Smartphone,
  },
  bills: {
    id: "bills",
    name: "Laskut ja maksut",
    icon: CreditCard,
  },
  baby: {
    id: "baby",
    name: "Vauvat ja lapset",
    icon: Baby,
  },
  music: {
    id: "music",
    name: "Musiikki",
    icon: Music,
  },
  books: {
    id: "books",
    name: "Kirjat",
    icon: Book,
  },
  other: {
    id: "other",
    name: "Muu",
    icon: MoreHorizontal,
  },
  general: {
    id: "general",
    name: "Yleinen kulu",
    icon: DollarSign,
  },
};

export type ExpenseCategoryId = keyof typeof EXPENSE_CATEGORIES;

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
