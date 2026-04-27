"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  return (
    <Button
      onClick={() => void signOut({ callbackUrl: "/login" })}
      size="sm"
      variant="ghost"
    >
      Sign out
    </Button>
  );
}
