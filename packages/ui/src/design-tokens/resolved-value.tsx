import { useEffect, useRef, useState } from 'react';

export type TResolvedValueProps = {
  /** CSS custom property to resolve, e.g. `--color-accent-solid`. */
  cssVar: string;
};

/**
 * Reads the live computed value of a CSS custom property off its own DOM node
 * and renders it as text. Re-reads on every render so the displayed value
 * tracks the Storybook light/dark toolbar toggle (which flips the `.dark`
 * class and therefore the resolved custom property).
 */
export const ResolvedValue = ({ cssVar }: TResolvedValueProps) => {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState('');

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const read = () =>
      setValue(getComputedStyle(node).getPropertyValue(cssVar).trim());

    read();

    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, [cssVar]);

  return (
    <span ref={ref} className="font-mono text-code text-muted">
      {value}
    </span>
  );
};
