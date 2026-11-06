import { useEffect, useRef } from 'react';

const LAYOUT_EVENTS = ['scroll', 'resize', 'transitionend'] as const;

export const useLayoutMeasure = (
  measure: () => void,
  remeasureKey: unknown,
) => {
  const measureRef = useRef(measure);

  useEffect(() => {
    measureRef.current = measure;
  });

  useEffect(() => {
    let frame = 0;
    const run = () => {
      frame = 0;
      measureRef.current();
    };
    const schedule = () => {
      if (frame === 0) frame = requestAnimationFrame(run);
    };

    run();
    for (const type of LAYOUT_EVENTS) {
      window.addEventListener(type, schedule, { passive: true });
    }

    return () => {
      cancelAnimationFrame(frame);
      for (const type of LAYOUT_EVENTS) {
        window.removeEventListener(type, schedule);
      }
    };
  }, [remeasureKey]);
};
