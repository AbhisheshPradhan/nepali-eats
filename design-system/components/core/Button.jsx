import React from 'react';

/**
 * NepaliEats Button — chunky, friendly, pill-shaped by default.
 * Variants: primary (chili), secondary (marigold), outline, ghost.
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  pill = true,
  block = false,
  disabled = false,
  iconLeft = null,
  iconRight = null,
  style = {},
  ...rest
}) {
  const sizes = {
    sm: { padding: '8px 16px', fontSize: '0.9375rem', gap: '6px' },
    md: { padding: '12px 22px', fontSize: '1.0625rem', gap: '8px' },
    lg: { padding: '16px 30px', fontSize: '1.2rem', gap: '10px' },
  };

  const variants = {
    primary: {
      background: 'var(--brand-primary)',
      color: 'var(--text-on-primary)',
      border: '2px solid transparent',
    },
    secondary: {
      background: 'var(--brand-secondary)',
      color: 'var(--ink-900)',
      border: '2px solid transparent',
    },
    outline: {
      background: 'transparent',
      color: 'var(--brand-primary)',
      border: '2px solid var(--brand-primary)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--ink-700)',
      border: '2px solid transparent',
    },
  };

  const base = {
    display: block ? 'flex' : 'inline-flex',
    width: block ? '100%' : undefined,
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    lineHeight: 1,
    letterSpacing: '0.005em',
    borderRadius: pill ? 'var(--radius-pill)' : 'var(--radius-md)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'transform var(--dur-fast) var(--ease-bounce), box-shadow var(--dur-base) var(--ease-out), background var(--dur-base) var(--ease-out)',
    ...sizes[size],
    ...variants[variant],
    ...style,
  };

  const onDown = (e) => { if (!disabled) e.currentTarget.style.transform = 'scale(0.95)'; };
  const onUp = (e) => { if (!disabled) e.currentTarget.style.transform = 'scale(1)'; };
  const onEnter = (e) => {
    if (disabled) return;
    if (variant === 'primary') { e.currentTarget.style.background = 'var(--brand-primary-hover)'; e.currentTarget.style.boxShadow = 'var(--shadow-pop)'; }
    else if (variant === 'secondary') { e.currentTarget.style.background = 'var(--brand-secondary-hover)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }
    else if (variant === 'outline') { e.currentTarget.style.background = 'var(--chili-100)'; }
    else { e.currentTarget.style.background = 'var(--paper-200)'; }
  };
  const onLeave = (e) => {
    if (disabled) return;
    e.currentTarget.style.background = variants[variant].background;
    e.currentTarget.style.boxShadow = 'none';
    e.currentTarget.style.transform = 'scale(1)';
  };

  return (
    <button
      style={base}
      disabled={disabled}
      onMouseDown={onDown}
      onMouseUp={onUp}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      {...rest}
    >
      {iconLeft}
      {children}
      {iconRight}
    </button>
  );
}
