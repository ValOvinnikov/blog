'use client';

import { useEffect, useRef } from 'react';

/** Publishes the referenced element's rendered height on `:root` so CSS elsewhere can offset against it. */
export const useHeightCssVariable = <T extends HTMLElement>(
  name: `--${string}`,
) => {
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }
    const { style } = document.documentElement;
    const observer = new ResizeObserver(() => {
      style.setProperty(name, `${element.getBoundingClientRect().height}px`);
    });
    observer.observe(element);

    return () => {
      observer.disconnect();
      style.removeProperty(name);
    };
  }, [name]);

  return ref;
};
