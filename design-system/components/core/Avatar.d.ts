import * as React from 'react';

export interface AvatarProps {
  src?: string | null;
  /** Used for initials fallback + alt text */
  name?: string;
  /** Pixel diameter. @default 44 */
  size?: number;
  /** Marigold ring outline. @default false */
  ring?: boolean;
  style?: React.CSSProperties;
}

/** Round avatar with image or initials fallback. */
export declare function Avatar(props: AvatarProps): JSX.Element;
