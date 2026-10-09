"use client";

import { Button } from "@/components/ui/button";
import { canSignIn, startSignIn } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export function SignInButton({
  callbackUrl,
  children = "Continue with demo",
  className,
  size = "default",
  variant = "default",
  googleConfigured = false,
  demoConfigured = false,
}: {
  callbackUrl?: string;
  children?: React.ReactNode;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "secondary" | "outline" | "ghost" | "link";
  googleConfigured?: boolean;
  demoConfigured?: boolean;
}) {
  const enabled = canSignIn(googleConfigured, demoConfigured);

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      className={cn(className)}
      disabled={!enabled}
      onClick={() =>
        startSignIn({ googleConfigured, demoConfigured, callbackUrl })
      }
    >
      {children}
    </Button>
  );
}
