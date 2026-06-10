import * as z from "zod";

export const expenseFormSchema = z.object({
  description: z.string().min(1, "Kuvaus on pakollinen"),
  amount: z
    .string()
    .min(1, "Summa on pakollinen")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Summan on oltava positiivinen luku",
    }),
  category: z.string().optional(),
  date: z.date(),
  paidByUserId: z.string().min(1, "Maksaja on pakollinen"),
  splitType: z.enum(["equal", "percentage", "exact"]),
  groupId: z.string().optional(),
  currency: z.string().optional(),
});

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;
