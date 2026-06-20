import * as React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style. @default "primary" */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  /** @default "md" */
  size?: 'sm' | 'md' | 'lg';
  /** Pill (fully rounded) vs md radius. @default true */
  pill?: boolean;
  /** Full-width block button. @default false */
  block?: boolean;
  disabled?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  children?: React.ReactNode;
}

/**
 * Primary call-to-action button for NepaliEats.
 * @startingPoint section="Core" subtitle="Chunky pill buttons in 4 variants" viewport="700x220"
 */
export declare function Button(props: ButtonProps): JSX.Element;
