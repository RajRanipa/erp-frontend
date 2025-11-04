

'use client';
import React from 'react';

function cn(...args) {
  return args.filter(Boolean).join(' ');
}

/**
 * Spinner – accessible, modern spinner.
 */
export function Spinner({ size = 'md', className = '', label = 'Loading…' }) {
  const sizeMap = { sm: 16, md: 24, lg: 32, xl: 48 };
  const px = sizeMap[size] ?? sizeMap.md;
  return (
    <div className={cn('inline-flex items-center gap-2', className)} role="status" aria-live="polite" aria-busy="true">
      <svg
        width={px}
        height={px}
        viewBox="0 0 24 24"
        className="animate-spin"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-20" fill="none" />
        <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" className="opacity-80" fill="none" strokeLinecap="round" />
      </svg>
      {label ? <span className="text-sm text-white-500">{label}</span> : null}
    </div>
  );
}

/**
 * Skeleton – shimmer placeholder for content blocks.
 * Wrap content area while loading; children are ignored while loading.
 */
export function Skeleton({
  width = '100%',
  height = 16,
  className = '',
  lines = 1,
}) {
  const h = typeof height === 'number' ? `${height}px` : height;
  const w = typeof width === 'number' ? `${width}px` : width;
  return (
    <div className={cn('space-y-2', className)} aria-hidden>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="relative overflow-hidden bg-white/5 rounded-lg h-full min-h-[16px]"
          style={{ width: w}}
        >
          <div className="shimmer" />
        </div>
      ))}
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .shimmer {
          position: absolute;
          inset: 0;
          transform: translateX(-100%);
          background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,.08) 50%, rgba(255,255,255,0) 100%);
          animation: shimmer 1.2s infinite;
        }
      `}</style>
    </div>
  );
}

/**
 * Loading – one component to cover spinner, overlay, and skeleton states.
 *
 * Props:
 *  - variant: 'spinner' | 'overlay' | 'skeleton'
 *  - text: optional label
 *  - fullscreen: for overlay variant
 *  - size: spinner size ('sm'|'md'|'lg'|'xl')
 *  - children: for skeleton variant, render as structure hints (ignored while loading)
 */
export default function Loading({
  variant = 'spinner',
  text = 'Loading…',
  fullscreen = false,
  size = 'md',
  className = '',
  children,
}) {
  if (variant === 'overlay') {
    return (
      <div
        className={cn(
          'pointer-events-none fixed inset-0 z-50 flex items-center justify-center',
          'bg-black/40 backdrop-blur-sm',
          fullscreen ? '' : '',
          className
        )}
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div className="pointer-events-auto rounded-xl bg-black/60 px-4 py-3 shadow-xl ring-1 ring-white/10">
          <Spinner size="lg" label={text} />
        </div>
      </div>
    );
  }

  if (variant === 'skeleton') {
    return (
      <div className={cn('w-full ', className)}>
        {children || (
          <>
            <Skeleton height={18} className='mb-2 h-full'/>
            {/* <Skeleton height={14} width="80%" /> */}
            {/* <Skeleton height={14} width="60%" /> */}
          </>
        )}
      </div>
    );
  }

  // Default: spinner
  return <Spinner size={size} className={className} label={text} />;
}