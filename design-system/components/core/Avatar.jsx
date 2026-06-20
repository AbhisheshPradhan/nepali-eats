import React from 'react';

/**
 * Avatar — round profile/venue image with initials fallback.
 */
export function Avatar({ src = null, name = '', size = 44, ring = false, style = {} }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
  const dim = { width: `${size}px`, height: `${size}px` };
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 'var(--radius-pill)',
        overflow: 'hidden',
        flex: 'none',
        background: 'var(--marigold-300)',
        color: 'var(--ink-900)',
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: `${size * 0.4}px`,
        boxShadow: ring ? '0 0 0 3px var(--paper-50), 0 0 0 5px var(--marigold-500)' : 'none',
        ...dim,
        ...style,
      }}
    >
      {src ? (
        <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        initials || '🙂'
      )}
    </span>
  );
}
