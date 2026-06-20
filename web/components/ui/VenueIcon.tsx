"use client";
import {
  ForkKnife,
  Coffee,
  Truck,
  Storefront,
  IceCream,
  BeerBottle,
  type IconProps,
} from "@phosphor-icons/react";
import type { VenueType } from "@/lib/types";

const MAP: Record<string, React.ComponentType<IconProps>> = {
  Restaurant: ForkKnife,
  "Café": Coffee,
  Takeaway: ForkKnife,
  "Food Truck": Truck,
  Caterer: Storefront,
  Dessert: IceCream,
  Bar: BeerBottle,
};

export function VenueIcon({
  type,
  ...props
}: { type?: VenueType | string | null } & Omit<IconProps, "type">) {
  const Icon = (type && MAP[type]) || ForkKnife;
  return <Icon weight="fill" {...props} />;
}
