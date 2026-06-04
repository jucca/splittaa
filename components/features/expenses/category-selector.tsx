"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ExpenseCategoryOption } from "@/lib/types/domain";
import { useTranslations } from "next-intl";
import { getCategoryLabel } from "@/lib/i18n/category-label";

export function CategorySelector({
  categories,
  onChange,
}: {
  categories: ExpenseCategoryOption[];
  onChange?: (categoryId: string) => void;
}) {
  const t = useTranslations("expenses.categorySelector");
  const tCategories = useTranslations("categories");
  const [selectedCategory, setSelectedCategory] = useState("");

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);

    if (onChange && categoryId !== selectedCategory) {
      onChange(categoryId);
    }
  };

  if (!categories || categories.length === 0) {
    return <div>{t("noCategories")}</div>;
  }

  if (!selectedCategory && categories.length > 0) {
    const defaultCategory =
      categories.find((cat: ExpenseCategoryOption) => cat.isDefault) ||
      categories[0];

    setTimeout(() => {
      setSelectedCategory(defaultCategory.id);
      if (onChange) {
        onChange(defaultCategory.id);
      }
    }, 0);
  }

  return (
    <Select value={selectedCategory} onValueChange={handleCategoryChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={t("placeholder")} />
      </SelectTrigger>
      <SelectContent>
        {categories.map((category: ExpenseCategoryOption) => (
          <SelectItem key={category.id} value={category.id}>
            <div className="flex items-center gap-2">
              <span>{getCategoryLabel(tCategories, category.id)}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
