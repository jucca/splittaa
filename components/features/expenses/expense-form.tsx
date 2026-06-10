"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { api } from "@/convex/_generated/api";
import { useConvexMutation, useConvexQuery } from "@/hooks/use-convex-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ParticipantSelector } from "./participant-selector";
import { GroupSelector } from "./group-selector";
import { CategorySelector } from "./category-selector";
import { CurrencySelector } from "./currency-selector";
import { SplitSelector } from "./split-selector";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import {
  getCurrencyDefinition,
  resolveCurrency,
  SUPPORTED_CURRENCY_CODES,
  type CurrencyCode,
} from "@/lib/money/currencies";
import { getAllCategories } from "@/lib/expense-categories";
import type { Participant, SplitRow, SplitType } from "@/lib/types/domain";
import type { Id } from "@/convex/_generated/dataModel";
import { useLocale, useTranslations } from "next-intl";
import { useDateFnsLocale } from "@/lib/i18n/use-date-fns-locale";
import { getConvexErrorFromUnknown } from "@/lib/i18n/convex-errors";
import { resolveLocale } from "@/lib/i18n/locales";

type ExpenseFormValues = {
  description: string;
  amount: string;
  category?: string;
  date: Date;
  paidByUserId: string;
  splitType: SplitType;
  groupId?: string;
  currency: CurrencyCode;
};

export function ExpenseForm({
  type = "individual",
  onSuccess,
}: {
  type?: "individual" | "group";
  onSuccess?: (id?: Id<"users"> | Id<"groups">) => void;
}) {
  const t = useTranslations("expenses.form");
  const tGroups = useTranslations("groups");
  const tShared = useTranslations("shared");
  const locale = resolveLocale(useLocale());
  const dateFnsLocale = useDateFnsLocale();

  const expenseSchema = useMemo(
    () =>
      z.object({
        description: z.string().min(1, t("validationDescriptionRequired")),
        amount: z
          .string()
          .min(1, t("validationAmountRequired"))
          .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
            message: t("validationAmountPositive"),
          }),
        category: z.string().optional(),
        date: z.date(),
        paidByUserId: z.string().min(1, t("validationPayerRequired")),
        splitType: z.enum(["equal", "percentage", "exact"]),
        groupId: z.string().optional(),
        currency: z.enum(SUPPORTED_CURRENCY_CODES),
      }),
    [t]
  );

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedGroup, setSelectedGroup] = useState<{
    id: Id<"groups">;
    members?: Participant[];
  } | null>(null);
  const [splits, setSplits] = useState<SplitRow[]>([]);

  const { data: currentUser } = useConvexQuery(api.users.me);

  const createExpense = useConvexMutation(api.expenses.createExpense);
  const categories = getAllCategories();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: "",
      amount: "",
      category: "",
      date: new Date(),
      paidByUserId: currentUser?.id || "",
      splitType: "equal",
      groupId: undefined,
      currency: "EUR",
    },
  });

  const amountValue = watch("amount");
  const paidByUserId = watch("paidByUserId");
  const selectedCurrency = resolveCurrency(watch("currency"));
  const expenseCurrency = getCurrencyDefinition(selectedCurrency);
  const isSoloExpense =
    type === "individual" && participants.length === 1;

  useEffect(() => {
    if (currentUser?.preferredCurrency) {
      setValue("currency", resolveCurrency(currentUser.preferredCurrency));
    }
  }, [currentUser, setValue]);

  useEffect(() => {
    if (participants.length === 0 && currentUser) {
      setParticipants([
        {
          id: currentUser.id,
          name: currentUser.name,
          imageUrl: currentUser.imageUrl,
        },
      ]);
    }
  }, [currentUser, participants]);

  const onSubmit = async (data: ExpenseFormValues) => {
    try {
      const amount = parseFloat(data.amount);

      const formattedSplits =
        isSoloExpense && currentUser
          ? [
              {
                userId: currentUser.id,
                amount,
                paid: true,
              },
            ]
          : splits.map((split) => ({
              userId: split.userId,
              amount: split.amount,
              paid: split.userId === data.paidByUserId,
            }));

      if (!isSoloExpense) {
        const totalSplitAmount = formattedSplits.reduce(
          (sum, split) => sum + split.amount,
          0
        );
        const tolerance = 0.01;

        if (Math.abs(totalSplitAmount - amount) > tolerance) {
          toast.error(t("splitsMismatch"));
          return;
        }
      }

      const groupId =
        type === "individual"
          ? undefined
          : (data.groupId as Id<"groups"> | undefined);

      await createExpense.mutate({
        description: data.description,
        amount: amount,
        category: data.category || "other",
        date: data.date.getTime(),
        paidByUserId: data.paidByUserId,
        splitType: data.splitType,
        splits: formattedSplits,
        groupId,
        currency: selectedCurrency,
      });

      toast.success(t("toastCreated"));
      reset();

      const otherParticipant = participants.find(
        (p) => p.id !== currentUser?.id
      );
      const otherUserId = otherParticipant?.id;

      if (onSuccess) {
        if (type === "individual") {
          onSuccess(otherUserId);
        } else if (type === "group" && groupId) {
          onSuccess(groupId);
        }
      }
    } catch (error) {
      toast.error(
        t("toastCreateFailed", {
          message: getConvexErrorFromUnknown(error, locale),
        })
      );
    }
  };

  if (!currentUser) return null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="description">{t("descriptionLabel")}</Label>
            <Input
              id="description"
              placeholder={t("descriptionPlaceholder")}
              {...register("description")}
            />
            {errors.description && (
              <p className="text-sm text-red-500">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">{t("amountLabel")}</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-2.5 text-muted-foreground">
                  {expenseCurrency.symbol}
                </span>
                <Input
                  id="amount"
                  placeholder={
                    expenseCurrency.fractionDigits === 0 ? "0" : "0.00"
                  }
                  type="number"
                  step={expenseCurrency.fractionDigits === 0 ? "1" : "0.01"}
                  min={expenseCurrency.fractionDigits === 0 ? "1" : "0.01"}
                  className="pl-8"
                  {...register("amount")}
                />
              </div>
              <div className="w-[9.5rem] shrink-0">
                <CurrencySelector
                  value={selectedCurrency}
                  onChange={(currency) => setValue("currency", currency)}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{t("currencyHint")}</p>
            {errors.amount && (
              <p className="text-sm text-red-500">{errors.amount.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category">{t("categoryLabel")}</Label>

            <CategorySelector
              categories={categories || []}
              onChange={(categoryId) => {
                if (categoryId) {
                  setValue("category", categoryId);
                }
              }}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("dateLabel")}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, "PPP", { locale: dateFnsLocale })
                  ) : (
                    <span>{t("datePlaceholder")}</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (!date) return;
                    setSelectedDate(date);
                    setValue("date", date);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {type === "group" && (
          <div className="space-y-2">
            <Label>{t("groupLabel")}</Label>
            <GroupSelector
              onChange={(group) => {
                if (!selectedGroup || selectedGroup.id !== group.id) {
                  setSelectedGroup(group);
                  setValue("groupId", group.id);

                  if (group.members && Array.isArray(group.members)) {
                    setParticipants(group.members);
                  }
                }
              }}
            />
            {!selectedGroup && (
              <p className="text-xs text-amber-600">
                {tGroups("selectGroupToContinue")}
              </p>
            )}
          </div>
        )}

        {type === "individual" && (
          <div className="space-y-2">
            <Label>{t("participantsLabel")}</Label>
            <ParticipantSelector
              participants={participants}
              onParticipantsChange={setParticipants}
            />
            {isSoloExpense && (
              <p className="text-xs text-muted-foreground">
                {t("participantsOptionalHint")}
              </p>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label>{t("payerLabel")}</Label>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            {...register("paidByUserId")}
          >
            <option value="">{t("payerPlaceholder")}</option>
            {participants.map((participant) => (
              <option key={participant.id} value={participant.id}>
                {participant.id === currentUser.id
                  ? tShared("you")
                  : participant.name}
              </option>
            ))}
          </select>
          {errors.paidByUserId && (
            <p className="text-sm text-red-500">
              {errors.paidByUserId.message}
            </p>
          )}
        </div>

        {!isSoloExpense && (
          <div className="space-y-2">
            <Label>{t("splitTypeLabel")}</Label>
            <Tabs
              defaultValue="equal"
              onValueChange={(value) =>
                setValue("splitType", value as SplitType)
              }
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="equal">{t("splitEqual")}</TabsTrigger>
                <TabsTrigger value="percentage">{t("splitPercentage")}</TabsTrigger>
                <TabsTrigger value="exact">{t("splitExact")}</TabsTrigger>
              </TabsList>
              <TabsContent value="equal" className="pt-4">
                <p className="text-sm text-muted-foreground">
                  {t("splitEqualHint")}
                </p>
                <SplitSelector
                  type="equal"
                  amount={parseFloat(amountValue) || 0}
                  participants={participants}
                  paidByUserId={paidByUserId}
                  currencySymbol={expenseCurrency.symbol}
                  onSplitsChange={setSplits}
                />
              </TabsContent>
              <TabsContent value="percentage" className="pt-4">
                <p className="text-sm text-muted-foreground">
                  {t("splitPercentageHint")}
                </p>
                <SplitSelector
                  type="percentage"
                  amount={parseFloat(amountValue) || 0}
                  participants={participants}
                  paidByUserId={paidByUserId}
                  currencySymbol={expenseCurrency.symbol}
                  onSplitsChange={setSplits}
                />
              </TabsContent>
              <TabsContent value="exact" className="pt-4">
                <p className="text-sm text-muted-foreground">
                  {t("splitExactHint")}
                </p>
                <SplitSelector
                  type="exact"
                  amount={parseFloat(amountValue) || 0}
                  participants={participants}
                  paidByUserId={paidByUserId}
                  currencySymbol={expenseCurrency.symbol}
                  onSplitsChange={setSplits}
                />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          data-testid="expense-submit"
          disabled={isSubmitting || participants.length === 0}
        >
          {isSubmitting ? tShared("creating") : t("submit")}
        </Button>
      </div>
    </form>
  );
}
