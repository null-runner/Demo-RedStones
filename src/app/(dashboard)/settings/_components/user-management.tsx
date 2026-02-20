"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod/v3";

import type { UserRow } from "../_lib/users.service";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const inviteSchema = z.object({
  email: z.string().email("Email non valida"),
  role: z.enum(["admin", "member"]),
});

type InviteForm = z.infer<typeof inviteSchema>;

type Props = {
  initialUsers: UserRow[];
  currentUserId: string;
};

export function UserManagement({ initialUsers, currentUserId }: Props) {
  const [users, setUsers] = useState<UserRow[]>(initialUsers);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const form = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "", role: "member" },
  });

  const pendingDeleteUser = users.find((u) => u.id === pendingDeleteId);

  async function handleDelete(userId: string) {
    const res = await fetch(`/api/settings/users/${userId}`, { method: "DELETE" });
    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setPendingDeleteId(null);
    } else if (res.status === 400) {
      toast.error("Deve rimanere almeno un Admin nel sistema");
      setPendingDeleteId(null);
    } else if (res.status === 403) {
      toast.error("Non puoi rimuovere il tuo account");
      setPendingDeleteId(null);
    } else {
      toast.error("Errore durante la rimozione");
      setPendingDeleteId(null);
    }
  }

  async function onSubmit(data: InviteForm) {
    const res = await fetch("/api/settings/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.status === 409) {
      form.setError("email", { message: "Email già registrata nel sistema" });
      return;
    }

    if (!res.ok) {
      toast.error("Errore durante l'invito");
      return;
    }

    const newUser = (await res.json()) as UserRow;
    setUsers((prev) => [newUser, ...prev]);
    form.reset();
    toast.success("Utente invitato con successo");
  }

  return (
    <div className="space-y-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Ruolo</TableHead>
            <TableHead>Data registrazione</TableHead>
            <TableHead>Azioni</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Badge
                    variant={
                      user.role === "admin"
                        ? "default"
                        : user.role === "member"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {user.role}
                  </Badge>
                  {user.invitedAt !== null && <Badge variant="outline">Invitato</Badge>}
                </div>
              </TableCell>
              <TableCell>{user.createdAt.toLocaleDateString("it-IT")}</TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={user.id === currentUserId}
                  onClick={() => {
                    setPendingDeleteId(user.id);
                  }}
                >
                  <Trash2 className="mr-1 h-4 w-4" />
                  Rimuovi
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog
        open={pendingDeleteId !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma rimozione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler rimuovere {pendingDeleteUser?.name}? Questa azione è
              irreversibile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDeleteId) void handleDelete(pendingDeleteId);
              }}
            >
              Rimuovi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="border-t pt-6">
        <h3 className="mb-4 text-sm font-semibold">Invita nuovo utente</h3>
        <Form {...form}>
          <form
            onSubmit={(e) => {
              void form.handleSubmit(onSubmit)(e);
            }}
            className="flex items-end gap-4"
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="utente@esempio.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ruolo</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Ruolo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={form.formState.isSubmitting}>
              Invia invito
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
