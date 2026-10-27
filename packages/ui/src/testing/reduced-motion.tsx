import type { ReactNode } from 'react';

const REDUCED_MOTION_RULES = `
  [data-reduced-motion] *, [data-reduced-motion] *::before { animation: none !important; }
  [data-reduced-motion] [class~="motion-reduce:invisible"] { visibility: hidden; }
  [data-reduced-motion] [class~="motion-reduce:visible"] { visibility: visible; }
  [data-reduced-motion] [class~="motion-reduce:before:w-full"]::before { width: 100%; }
  [data-reduced-motion] [class~="motion-reduce:before:content-['⠿']"]::before { content: '⠿'; }
  [data-reduced-motion] [class~="motion-reduce:before:content-['•••']"]::before { content: '•••'; }
`;

// Storybook cannot emulate `prefers-reduced-motion`, so this re-applies the `motion-reduce:` rules the busy button and spinner use.
export const ReducedMotion = ({ children }: { children: ReactNode }) => (
  <div data-reduced-motion="">
    <style>{REDUCED_MOTION_RULES}</style>
    {children}
  </div>
);
