import * as React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Colour intent. @default "neutral" */
  tone?: 'neutral' | 'open' | 'closed' | 'favourite' | 'info';
  /** Solid fill vs soft tint. @default false */
  solid?: boolean;
  children?: React.ReactNode;
}

/** Small status pill for venue state. */
export declare function Badge(props: BadgeProps): JSX.Element;
