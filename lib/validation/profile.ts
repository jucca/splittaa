import { z } from "zod";
import {
  normalizeUsername,
  validateDisplayName,
  validateUsername,
} from "@/lib/usernames";

export const profileFormSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "Näyttönimi on pakollinen")
    .max(50, "Näyttönimi on liian pitkä")
    .refine(validateDisplayName, "Virheellinen näyttönimi"),
  username: z
    .string()
    .transform(normalizeUsername)
    .refine((u) => validateUsername(u).ok, {
      message:
        "Käyttäjänimen tulee olla 3–20 merkkiä: pienet kirjaimet, numerot ja alaviiva",
    }),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;
