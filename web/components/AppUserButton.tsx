"use client";

import { UserButton } from "@clerk/nextjs";
import { Heart, Storefront } from "@phosphor-icons/react";
import { useMe } from "@/lib/useMe";

// UserButton with our custom menu items added above Clerk's defaults
// (Manage account, Sign out). Desktop only — the mobile header flattens these
// items into its panel instead of nesting Clerk's dropdown.
export function AppUserButton() {
  // "My restaurants" only renders for verified owners (any restaurant_owners
  // row, via the shared useMe fetch) — everyone else never sees an
  // owner-shaped menu.
  const { owned } = useMe();

  return (
    <UserButton>
      <UserButton.MenuItems>
        {owned && (
          <UserButton.Link
            label="My restaurants"
            labelIcon={<Storefront size={16} />}
            href="/my-restaurants"
          />
        )}
        <UserButton.Link
          label="Saved restaurants"
          labelIcon={<Heart size={16} />}
          href="/saved"
        />
      </UserButton.MenuItems>
    </UserButton>
  );
}
