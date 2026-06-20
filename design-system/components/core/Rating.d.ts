import * as React from 'react';

export interface RatingProps {
  /** Score, e.g. 4.6 */
  value?: number;
  /** Max stars. @default 5 */
  max?: number;
  /** Optional review count shown in parens */
  count?: number | null;
  /** Star pixel size. @default 18 */
  size?: number;
  /** Show numeric value. @default true */
  showValue?: boolean;
  style?: React.CSSProperties;
}

/** Marigold star rating with optional numeric value and review count. */
export declare function Rating(props: RatingProps): JSX.Element;
