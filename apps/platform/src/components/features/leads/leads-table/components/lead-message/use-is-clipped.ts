import { useEffect, useRef, useState } from 'react';

export const useIsClipped = <T extends HTMLElement>() => {
  const ref = useRef<T>(null);
  const [isClipped, setIsClipped] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }
    const observer = new ResizeObserver(() => {
      setIsClipped(element.scrollHeight > element.clientHeight);
    });
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return { ref, isClipped };
};
