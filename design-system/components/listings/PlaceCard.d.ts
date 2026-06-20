import * as React from 'react';

export interface PlaceCardProps {
  name: string;
  /** Photo URL; falls back to a warm gradient + venue icon */
  image?: string | null;
  /** @default "Restaurant" */
  venueType?: 'Restaurant' | 'Cafe' | 'Food truck' | 'Stall';
  /** Cuisine / attribute tags (first 3 shown) */
  cuisines?: string[];
  rating?: number | null;
  reviewCount?: number | null;
  suburb?: string;
  /** e.g. "0.8 km" */
  distance?: string;
  /** 1–4, rendered as $–$$$$. @default 2 */
  priceLevel?: number;
  /** @default true */
  isOpen?: boolean;
  /** Today's hours summary, e.g. "Open · until 9:30pm" or "Closed · opens 11am" */
  hoursLine?: string | null;
  favourite?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

/**
 * Signature venue listing card — photo, name, rating, cuisines and quick facts.
 * @startingPoint section="Listings" subtitle="The core venue card" viewport="380x460"
 */
export declare function PlaceCard(props: PlaceCardProps): JSX.Element;
