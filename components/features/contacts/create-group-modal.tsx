"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { api } from "@/convex/_generated/api";
import { useConvexMutation, useConvexQuery } from "@/hooks/use-convex-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { GroupInviteShare } from "@/components/features/groups/group-invite-share";
import type { Participant } from "@/lib/types/domain";
import type { Id } from "@/convex/_generated/dataModel";
import type { FunctionReturnType } from "convex/server";

const groupSchema = z.object({
  name: z.string().min(1, "Ryhmän nimi on pakollinen"),
  description: z.string().optional(),
});

type GroupFormValues = z.infer<typeof groupSchema>;

type CreateGroupResult = FunctionReturnType<typeof api.contacts.createGroup>;

export function CreateGroupModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (groupId: Id<"groups">) => void;
}) {
  const [selectedMembers, setSelectedMembers] = useState<Participant[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [commandOpen, setCommandOpen] = useState(false);
  const [createdResult, setCreatedResult] = useState<CreateGroupResult | null>(
    null
  );

  const { data: currentUser } = useConvexQuery(api.users.me);
  const createGroup = useConvexMutation(api.contacts.createGroup);
  const { data: searchResults, isLoading: isSearching } = useConvexQuery(
    api.users.searchUsers,
    { query: searchQuery }
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const addMember = (user: Participant) => {
    if (!selectedMembers.some((m: Participant) => m.id === user.id)) {
      setSelectedMembers([...selectedMembers, user]);
    }
    setCommandOpen(false);
  };

  const removeMember = (userId: Id<"users">) => {
    setSelectedMembers(selectedMembers.filter((m: Participant) => m.id !== userId));
  };

  const onSubmit = async (data: GroupFormValues) => {
    try {
      const memberIds = selectedMembers.map((member) => member.id);

      const result = await createGroup.mutate({
        name: data.name,
        description: data.description,
        members: memberIds,
      });

      setCreatedResult(result);

      if (result.directInviteCount > 0) {
        toast.success(
          `Ryhmä luotu! ${result.directInviteCount} kutsua lähetetty.`
        );
      } else {
        toast.success("Ryhmä luotu onnistuneesti!");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error("Ryhmän luonti epäonnistui: " + message);
    }
  };

  const handleClose = () => {
    reset();
    setSelectedMembers([]);
    setCreatedResult(null);
    onClose();
  };

  const handleDone = () => {
    if (createdResult && onSuccess) {
      onSuccess(createdResult.groupId);
    }
    handleClose();
  };

  if (createdResult) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ryhmä luotu</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {createdResult.directInviteCount > 0 && (
              <p className="text-sm text-muted-foreground">
                Kutsut lähetettiin sähköpostilla ja näkyvät sovelluksessa
                kutsutuille käyttäjille.
              </p>
            )}

            <GroupInviteShare openInvite={createdResult.openInvite} />
          </div>

          <DialogFooter>
            <Button type="button" onClick={handleDone}>
              Valmis
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Luo uusi ryhmä</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Ryhmän nimi</Label>
            <Input
              id="name"
              placeholder="Anna ryhmän nimi"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Kuvaus (valinnainen)</Label>
            <Textarea
              id="description"
              placeholder="Anna ryhmän kuvaus"
              {...register("description")}
            />
          </div>

          <div className="space-y-2">
            <Label>Kutsu jäseniä (valinnainen)</Label>
            <p className="text-xs text-muted-foreground">
              Kutsutut saavat linkin hyväksyä tai hylätä liittymisen. Voit myös
              jakaa liittymiskoodin tai QR-koodin luonnin jälkeen.
            </p>
            <div className="flex flex-wrap gap-2 mb-2">
              {currentUser && (
                <Badge variant="secondary" className="px-3 py-1">
                  <Avatar className="h-5 w-5 mr-2">
                    <AvatarImage src={currentUser.imageUrl ?? undefined} />
                    <AvatarFallback>
                      {currentUser.name?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span>{currentUser.name} (sinä)</span>
                </Badge>
              )}

              {selectedMembers.map((member) => (
                <Badge
                  key={member.id}
                  variant="secondary"
                  className="px-3 py-1"
                >
                  <Avatar className="h-5 w-5 mr-2">
                    <AvatarImage src={member.imageUrl ?? undefined} />
                    <AvatarFallback>
                      {member.name?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span>{member.name}</span>
                  <button
                    type="button"
                    onClick={() => removeMember(member.id)}
                    className="ml-2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}

              <Popover open={commandOpen} onOpenChange={setCommandOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1 text-xs"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    Lisää kutsuttava
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0" align="start" side="bottom">
                  <Command>
                    <CommandInput
                      placeholder="Hae nimellä tai sähköpostilla..."
                      value={searchQuery}
                      onValueChange={setSearchQuery}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {searchQuery.length < 2 ? (
                          <p className="py-3 px-4 text-sm text-center text-muted-foreground">
                            Kirjoita vähintään 2 merkkiä hakeaksesi
                          </p>
                        ) : isSearching ? (
                          <p className="py-3 px-4 text-sm text-center text-muted-foreground">
                            Haetaan...
                          </p>
                        ) : (
                          <p className="py-3 px-4 text-sm text-center text-muted-foreground">
                            Käyttäjiä ei löytynyt
                          </p>
                        )}
                      </CommandEmpty>
                      <CommandGroup heading="Käyttäjät">
                        {searchResults?.map((user: Participant) => (
                          <CommandItem
                            key={user.id}
                            value={user.name + user.email}
                            onSelect={() => addMember(user)}
                          >
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={user.imageUrl ?? undefined} />
                                <AvatarFallback>
                                  {user.name?.charAt(0) || "?"}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="text-sm">{user.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {user.email}
                                </span>
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Peruuta
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Luodaan..." : "Luo ryhmä"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
