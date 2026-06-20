import React from 'react';

/**
 * Tag — cuisine / attribute chip ("Momo", "Newari", "Veg-friendly").
 * Clickable filter chip when `active`/onClick supplied.
 */
export function Tag({ children, active = false, clickable = false, style = {}, ...rest }) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontFamily: 'var(--font-body)',
    fontWeight: 600,
    fontSize: '0.9rem',
    padding: '6px 14px',
    borderRadius: 'var(--radius-pill)',
    border: '1.5px solid',
    cursor: clickable ? 'pointer' : 'default',
    transition: 'all var(--dur-fast) var(--ease-out)',
    color: active ? '#fff' : 'var(--ink-700)',
    background: active ? 'var(--brand-primary)' : 'var(--surface-card)',
    borderColor: active ? 'var(--brand-primary)' : 'var(--border-strong)',
    ...style,
  };
  return (
    <span
      style={base}
      onMouseEnter={(e) => { if (clickable && !active) { e.currentTarget.style.borderColor = 'var(--brand-primary)'; e.currentTarget.style.color = 'var(--brand-primary)'; } }}
      onMouseLeave={(e) => { if (clickable && !active) { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--ink-700)'; } }}
      {...rest}
    >
      {children}
    </span>
  );
}
