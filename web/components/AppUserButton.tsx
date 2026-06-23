"use client";

import { UserButton } from "@clerk/nextjs";
import { Heart } from "@phosphor-icons/react";

// UserButton with our custom menu items added above Clerk's defaults
// (Manage account, Sign out). Desktop only — the mobile header flattens these
// items into its panel instead of nesting Clerk's dropdown.
export function AppUserButton() {
  return (
    <UserButton>
      <UserButton.MenuItems>
        <UserButton.Link
          label="Saved restaurants"
          labelIcon={<Heart size={16} />}
          href="/saved"
        />
      </UserButton.MenuItems>
    </UserButton>
  );
}
