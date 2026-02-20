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

const GUEST_EMAIL = "guest@demo.redstones.local";

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
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);

  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const handleDemoMode = async () => {
    setIsLoadingDemo(true);
    try {
      const resetRes = await fetch("/api/auth/guest", { method: "POST" });
      if (!resetRes.ok) {
        setFormError("Errore durante la preparazione della demo. Riprova.");
        return;
      }
      const result = (await signIn("credentials", {
        email: GUEST_EMAIL,
        password: "",
        redirect: false,
      })) as unknown as { error?: string } | undefined;
      if (result?.error) {
        setFormError("Errore di autenticazione demo. Riprova.");
        return;
      }
      router.push("/");
    } catch {
      setFormError("Errore di rete. Riprova.");
    } finally {
      setIsLoadingDemo(false);
    }
  };

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
                  <Input
                    type="email"
                    placeholder="nome@azienda.it"
                    disabled={isLoadingDemo}
                    {...field}
                  />
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
                  <Input
                    type="password"
                    placeholder="••••••••"
                    disabled={isLoadingDemo}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {formError && <p className="text-destructive text-sm font-medium">{formError}</p>}

          <Button
            type="submit"
            className="w-full"
            disabled={form.formState.isSubmitting || isLoadingDemo}
          >
            {form.formState.isSubmitting ? "Accesso in corso..." : "Accedi"}
          </Button>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background text-muted-foreground px-2">oppure</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={isLoadingDemo || form.formState.isSubmitting}
            onClick={() => {
              void handleDemoMode();
            }}
          >
            {isLoadingDemo ? "Preparazione demo in corso..." : "Esplora in Demo Mode"}
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
