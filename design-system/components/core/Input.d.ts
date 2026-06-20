import * as React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Leading icon node */
  iconLeft?: React.ReactNode;
  /** @default "md" */
  size?: 'sm' | 'md' | 'lg';
  /** Styles for the inner <input> */
  style?: React.CSSProperties;
  /** Styles for the pill wrapper */
  wrapStyle?: React.CSSProperties;
}

/** Pill text input with optional leading icon and marigold focus ring. */
export declare function Input(props: InputProps): JSX.Element;
