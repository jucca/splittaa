"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { api } from "@/convex/_generated/api";
import { useConvexMutation, useConvexQuery } from "@/hooks/use-convex-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import type { Id } from "@/convex/_generated/dataModel";
import { useLocale, useTranslations } from "next-intl";
import { getConvexErrorFromUnknown } from "@/lib/i18n/convex-errors";
import { resolveLocale } from "@/lib/i18n/locales";

type SettlementFormValues = {
  amount: string;
  note?: string;
  paymentType: "youPaid" | "theyPaid";
};

export type UserSettlementData = {
  counterpart: { userId: Id<"users">; name: string; imageUrl?: string | null };
  netBalance: number;
};

type GroupBalanceMember = {
  userId: Id<"users">;
  name: string;
  imageUrl?: string | null;
  netBalance: number;
};

export type GroupSettlementData = {
  group: { id: Id<"groups"> };
  balances: GroupBalanceMember[];
};

export default function SettlementForm({
  entityType,
  entityData,
  onSuccess,
}: {
  entityType: "user" | "group";
  entityData: UserSettlementData | GroupSettlementData;
  onSuccess?: () => void;
}) {
  const t = useTranslations("settlements.form");
  const tGroups = useTranslations("groups");
  const tShared = useTranslations("shared");
  const locale = resolveLocale(useLocale());

  const settlementSchema = useMemo(
    () =>
      z.object({
        amount: z
          .string()
          .min(1, t("validationAmountRequired"))
          .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
            message: t("validationAmountPositive"),
          }),
        note: z.string().optional(),
        paymentType: z.enum(["youPaid", "theyPaid"]),
      }),
    [t]
  );

  const { data: currentUser } = useConvexQuery(api.users.me);
  const createSettlement = useConvexMutation(api.settlements.createSettlement);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SettlementFormValues>({
    resolver: zodResolver(settlementSchema),
    defaultValues: {
      amount: "",
      note: "",
      paymentType: "youPaid",
    },
  });

  watch("paymentType");

  const handleUserSettlement = async (data: SettlementFormValues) => {
    const amount = parseFloat(data.amount);

    try {
      const userData = entityData as UserSettlementData;
      const paidByUserId =
        data.paymentType === "youPaid"
          ? currentUser!.id
          : userData.counterpart.userId;

      const receivedByUserId =
        data.paymentType === "youPaid"
          ? userData.counterpart.userId
          : currentUser!.id;

      await createSettlement.mutate({
        amount,
        note: data.note,
        paidByUserId,
        receivedByUserId,
      });

      toast.success(t("toastSuccess"));
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error(
        t("toastFailed", {
          message: getConvexErrorFromUnknown(error, locale),
        })
      );
    }
  };

  const handleGroupSettlement = async (
    data: SettlementFormValues,
    selectedUserId: Id<"users">
  ) => {
    if (!selectedUserId) {
      toast.error(t("toastSelectMember"));
      return;
    }

    const amount = parseFloat(data.amount);

    try {
      const groupData = entityData as GroupSettlementData;
      const selectedUser = groupData.balances.find(
        (balance) => balance.userId === selectedUserId
      );

      if (!selectedUser) {
        toast.error(t("toastMemberNotFound"));
        return;
      }

      const paidByUserId =
        data.paymentType === "youPaid" ? currentUser!.id : selectedUser.userId;

      const receivedByUserId =
        data.paymentType === "youPaid" ? selectedUser.userId : currentUser!.id;

      await createSettlement.mutate({
        amount,
        note: data.note,
        paidByUserId,
        receivedByUserId,
        groupId: groupData.group.id,
      });

      toast.success(t("toastSuccess"));
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error(
        t("toastFailed", {
          message: getConvexErrorFromUnknown(error, locale),
        })
      );
    }
  };

  const [selectedGroupMemberId, setSelectedGroupMemberId] =
    useState<Id<"users"> | null>(null);

  const onSubmit = async (data: SettlementFormValues) => {
    if (entityType === "user") {
      await handleUserSettlement(data);
    } else if (entityType === "group" && selectedGroupMemberId) {
      await handleGroupSettlement(data, selectedGroupMemberId);
    }
  };

  if (!currentUser) return null;

  if (entityType === "user") {
    const userData = entityData as UserSettlementData;
    const otherUser = userData.counterpart;
    const netBalance = userData.netBalance;

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-muted p-4 rounded-lg">
          <h3 className="font-medium mb-2">{t("currentBalance")}</h3>
          {netBalance === 0 ? (
            <p>{t("allSettledWithUser", { name: otherUser.name })}</p>
          ) : netBalance > 0 ? (
            <div className="flex justify-between items-center">
              <p>{t("theyOweYou", { name: otherUser.name })}</p>
              <span className="text-xl font-bold text-green-600">
                {formatCurrency(netBalance)}
              </span>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <p>{t("youOweThem", { name: otherUser.name })}</p>
              <span className="text-xl font-bold text-red-600">
                {formatCurrency(Math.abs(netBalance))}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label>{t("whoPaid")}</Label>
          <RadioGroup
            defaultValue="youPaid"
            {...register("paymentType")}
            className="flex flex-col space-y-2"
            onValueChange={(value) => {
              register("paymentType").onChange({
                target: { name: "paymentType", value },
              });
            }}
          >
            <div className="flex items-center space-x-2 border rounded-md p-3">
              <RadioGroupItem value="youPaid" id="youPaid" />
              <Label htmlFor="youPaid" className="flex-grow cursor-pointer">
                <div className="flex items-center">
                  <Avatar className="h-6 w-6 mr-2">
                    <AvatarImage src={currentUser.imageUrl ?? undefined} />
                    <AvatarFallback>
                      {currentUser.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span>
                    {t("youPaidUser", { name: otherUser.name })}
                  </span>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-2 border rounded-md p-3">
              <RadioGroupItem value="theyPaid" id="theyPaid" />
              <Label htmlFor="theyPaid" className="flex-grow cursor-pointer">
                <div className="flex items-center">
                  <Avatar className="h-6 w-6 mr-2">
                    <AvatarImage src={otherUser.imageUrl ?? undefined} />
                    <AvatarFallback>{otherUser.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span>{t("userPaidYou", { name: otherUser.name })}</span>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">{t("amountLabel")}</Label>
          <div className="relative">
            <span className="absolute left-3 top-2.5">€</span>
            <Input
              id="amount"
              placeholder="0.00"
              type="number"
              step="0.01"
              min="0.01"
              className="pl-7"
              {...register("amount")}
            />
          </div>
          {errors.amount && (
            <p className="text-sm text-red-500">{errors.amount.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="note">{t("noteLabel")}</Label>
          <Textarea
            id="note"
            placeholder={t("notePlaceholder")}
            {...register("note")}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? tShared("recording") : t("submit")}
        </Button>
      </form>
    );
  }

  if (entityType === "group") {
    const groupData = entityData as GroupSettlementData;
    const groupMembers = groupData.balances;

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <Label>{t("selectMember")}</Label>
          <div className="space-y-2">
            {groupMembers.map((member: GroupBalanceMember) => {
              const isSelected = selectedGroupMemberId === member.userId;
              const isOwing = member.netBalance < 0;
              const isOwed = member.netBalance > 0;

              return (
                <div
                  key={member.userId}
                  className={`border rounded-md p-3 cursor-pointer transition-colors ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => setSelectedGroupMemberId(member.userId)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.imageUrl ?? undefined} />
                        <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{member.name}</span>
                    </div>
                    <div
                      className={`font-medium ${
                        isOwing
                          ? "text-green-600"
                          : isOwed
                            ? "text-red-600"
                            : ""
                      }`}
                    >
                      {isOwing
                        ? tGroups("theyOweYou", {
                            amount: formatCurrency(Math.abs(member.netBalance)),
                          })
                        : isOwed
                          ? tGroups("youOweThem", {
                              amount: formatCurrency(Math.abs(member.netBalance)),
                            })
                          : tGroups("settled")}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {!selectedGroupMemberId && (
            <p className="text-sm text-amber-600">{t("selectMemberWarning")}</p>
          )}
        </div>

        {selectedGroupMemberId && (
          <>
            <div className="space-y-2">
              <Label>{t("whoPaid")}</Label>
              <RadioGroup
                defaultValue="youPaid"
                {...register("paymentType")}
                className="flex flex-col space-y-2"
                onValueChange={(value) => {
                  register("paymentType").onChange({
                    target: { name: "paymentType", value },
                  });
                }}
              >
                <div className="flex items-center space-x-2 border rounded-md p-3">
                  <RadioGroupItem value="youPaid" id="youPaid" />
                  <Label htmlFor="youPaid" className="flex-grow cursor-pointer">
                    <div className="flex items-center">
                      <Avatar className="h-6 w-6 mr-2">
                        <AvatarImage src={currentUser.imageUrl ?? undefined} />
                        <AvatarFallback>
                          {currentUser.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span>
                        {t("youPaidMember", {
                          name:
                            groupMembers.find(
                              (m: GroupBalanceMember) =>
                                m.userId === selectedGroupMemberId
                            )?.name ?? "",
                        })}
                      </span>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-2 border rounded-md p-3">
                  <RadioGroupItem value="theyPaid" id="theyPaid" />
                  <Label
                    htmlFor="theyPaid"
                    className="flex-grow cursor-pointer"
                  >
                    <div className="flex items-center">
                      <Avatar className="h-6 w-6 mr-2">
                        <AvatarImage
                          src={
                            groupMembers.find(
                              (m: GroupBalanceMember) =>
                                m.userId === selectedGroupMemberId
                            )?.imageUrl ?? undefined
                          }
                        />
                        <AvatarFallback>
                          {groupMembers
                            .find(
                              (m: GroupBalanceMember) =>
                                m.userId === selectedGroupMemberId
                            )
                            ?.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span>
                        {t("memberPaidYou", {
                          name:
                            groupMembers.find(
                              (m: GroupBalanceMember) =>
                                m.userId === selectedGroupMemberId
                            )?.name ?? "",
                        })}
                      </span>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">{t("amountLabel")}</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5">€</span>
                <Input
                  id="amount"
                  placeholder="0.00"
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="pl-7"
                  {...register("amount")}
                />
              </div>
              {errors.amount && (
                <p className="text-sm text-red-500">{errors.amount.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">{t("noteLabel")}</Label>
              <Textarea
                id="note"
                placeholder={t("notePlaceholder")}
                {...register("note")}
              />
            </div>
          </>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting || !selectedGroupMemberId}
        >
          {isSubmitting ? tShared("recording") : t("submit")}
        </Button>
      </form>
    );
  }

  return null;
}
