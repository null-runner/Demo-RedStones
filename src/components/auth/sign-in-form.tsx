"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { z } from "zod/v3";

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

const signInSchema = z.object({
  email: z.string().email("Email non valida"),
  password: z.string().min(1, "Password richiesta"),
});

type SignInValues = z.infer<typeof signInSchema>;

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: SignInValues) => {
    setFormError(null);
    const result = (await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    })) as unknown as { error?: string } | undefined;
    if (result?.error) {
      setFormError("Credenziali non valide");
      return;
    }
    const safeCallback =
      callbackUrl?.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : "/";
    router.push(safeCallback);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Accedi</h1>
        <p className="text-muted-foreground text-sm">
          Inserisci le tue credenziali per accedere al CRM
        </p>
      </div>

      <Form {...form}>
        <form
          onSubmit={(e) => {
            void form.handleSubmit(onSubmit)(e);
          }}
          className="space-y-4"
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="nome@azienda.it" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {formError && <p className="text-destructive text-sm font-medium">{formError}</p>}

          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Accesso in corso..." : "Accedi"}
          </Button>
        </form>
      </Form>

      <p className="text-muted-foreground text-center text-sm">
        Non hai un account?{" "}
        <Link href="/sign-up" className="text-primary underline underline-offset-4">
          Registrati
        </Link>
      </p>
    </div>
  );
}
