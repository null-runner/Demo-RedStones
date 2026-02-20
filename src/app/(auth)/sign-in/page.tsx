import { Suspense } from "react";

import { SignInForm } from "@/components/auth/sign-in-form";

export default function SignInPage() {
  return (
    <div className="bg-background w-full max-w-sm rounded-lg border p-8 shadow-sm">
      <Suspense>
        <SignInForm />
      </Suspense>
    </div>
  );
}
