"use client";

import { useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useConvexMutation } from "@/hooks/use-convex-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

type SendDebtRequestButtonProps = {
  debtorUserId: Id<"users">;
  debtorName: string;
  amount: number;
  groupId?: Id<"groups">;
  groupName?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
};

export function SendDebtRequestButton({
  debtorUserId,
  debtorName,
  amount,
  groupId,
  groupName,
  variant = "outline",
  size = "sm",
  className,
}: SendDebtRequestButtonProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const sendDebtRequest = useConvexMutation(api.debtRequests.sendDebtRequest);

  const handleSend = async () => {
    try {
      await sendDebtRequest.mutate({
        debtorUserId,
        groupId,
        message: message.trim() || undefined,
      });
      toast.success(`Velkapyyntö lähetetty käyttäjälle ${debtorName}`);
      setOpen(false);
      setMessage("");
    } catch (error) {
      const data = (error as { data?: { code?: string; message?: string } })
        ?.data;
      const fallback =
        error instanceof Error ? error.message : "Lähetys epäonnistui";
      toast.error(data?.message ?? fallback);
    }
  };

  const contextLabel = groupName
    ? `ryhmässä ${groupName}`
    : "henkilökohtaisessa jaossa";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant={variant}
          size={size}
          className={className}
          data-testid="send-debt-request"
        >
          <Send className="h-4 w-4 mr-1" />
          Lähetä velkapyyntö
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Velkapyyntö</DialogTitle>
          <DialogDescription>
            Lähetä erillinen pyyntö käyttäjälle {debtorName} (
            {formatCurrency(amount)} {contextLabel}). Velallinen saa viestin
            postilaatikkoon ja sähköpostilla, jos osoite on tiedossa. Tämä ei
            korvaa automaattista saldomuistutusta.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="debt-request-message">Viesti (valinnainen)</Label>
          <Textarea
            id="debt-request-message"
            placeholder="Esim. Muistathan maksaa viikonloppureissun osuutesi"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={500}
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Peruuta
          </Button>
          <Button
            type="button"
            onClick={handleSend}
            disabled={sendDebtRequest.isLoading}
          >
            {sendDebtRequest.isLoading ? "Lähetetään..." : "Lähetä pyyntö"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
