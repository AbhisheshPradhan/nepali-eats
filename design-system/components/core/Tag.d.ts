import * as React from 'react';

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Filled/selected state (for filter chips). @default false */
  active?: boolean;
  /** Enables hover affordance + pointer cursor. @default false */
  clickable?: boolean;
  children?: React.ReactNode;
}

/** Cuisine or attribute chip; doubles as a filter chip. */
export declare function Tag(props: TagProps): JSX.Element;
