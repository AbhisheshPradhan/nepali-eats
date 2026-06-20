import React from 'react';

/**
 * Status badge — small pill for venue state ("Open now", "New", "Local favourite").
 */
export function Badge({ children, tone = 'neutral', solid = false, style = {}, ...rest }) {
  const tones = {
    neutral:  { fg: 'var(--ink-700)',       bg: 'var(--paper-200)',     solidBg: 'var(--ink-700)' },
    open:     { fg: 'var(--coriander-700)',  bg: 'var(--coriander-100)', solidBg: 'var(--coriander-500)' },
    closed:   { fg: 'var(--chili-700)',      bg: 'var(--chili-100)',     solidBg: 'var(--chili-600)' },
    favourite:{ fg: 'var(--marigold-700)',   bg: 'var(--marigold-100)',  solidBg: 'var(--marigold-500)' },
    info:     { fg: 'var(--himalaya-700)',   bg: 'var(--himalaya-100)',  solidBg: 'var(--himalaya-500)' },
  };
  const t = tones[tone] || tones.neutral;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        fontFamily: 'var(--font-body)',
        fontWeight: 700,
        fontSize: '0.78rem',
        letterSpacing: '0.02em',
        padding: '4px 11px',
        borderRadius: 'var(--radius-pill)',
        color: solid ? '#fff' : t.fg,
        background: solid ? t.solidBg : t.bg,
        whiteSpace: 'nowrap',
        ...style,
      }}
      {...rest}
    >
      {children}
    </span>
  );
}
