import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create a Priple account to access your research dashboard.",
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
