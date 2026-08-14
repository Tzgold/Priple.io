import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Choose a new Priple password.",
};

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <p className="font-mono text-[12px] text-zinc-500">Loading reset form…</p>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
