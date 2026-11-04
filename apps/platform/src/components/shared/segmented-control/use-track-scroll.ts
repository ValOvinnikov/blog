import type { TMaybeNull } from '@blog/config';
import { useEffect, useRef, useState } from 'react';

type TTrackNode = TMaybeNull<HTMLDivElement>;
type TOptionNode = TMaybeNull<HTMLButtonElement>;
type TTrackOverflow = { hasMoreStart: boolean; hasMoreEnd: boolean };

// Matches the fades' w-7, so a scrolled-to option clears the fade on its side.
export const FADE_WIDTH_PX = 28;

const NO_OVERFLOW: TTrackOverflow = { hasMoreStart: false, hasMoreEnd: false };

const overflowOf = ({
  scrollLeft,
  scrollWidth,
  clientWidth,
}: HTMLDivElement): TTrackOverflow => ({
  hasMoreStart: scrollLeft > 0,
  hasMoreEnd: Math.ceil(scrollLeft + clientWidth) < scrollWidth,
});

const scrollLeftToReveal = (track: HTMLDivElement, option: HTMLElement) => {
  const start = option.offsetLeft - FADE_WIDTH_PX;
  const end = option.offsetLeft + option.offsetWidth + FADE_WIDTH_PX;
  if (start < track.scrollLeft) return start;
  if (end > track.scrollLeft + track.clientWidth)
    return end - track.clientWidth;
  return track.scrollLeft;
};

export const useTrackScroll = (selectedIndex: number) => {
  const trackRef = useRef<TTrackNode>(null);
  const optionRefs = useRef<TOptionNode[]>([]);
  const [overflow, setOverflow] = useState(NO_OVERFLOW);

  const setOptionRef = (index: number) => (node: TOptionNode) => {
    optionRefs.current[index] = node;
  };

  const onScroll = () => {
    if (trackRef.current) setOverflow(overflowOf(trackRef.current));
  };

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const observer = new ResizeObserver(() => setOverflow(overflowOf(track)));
    observer.observe(track);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    const option = optionRefs.current[selectedIndex];
    if (!track || !option) return;
    track.scrollLeft = scrollLeftToReveal(track, option);
    setOverflow(overflowOf(track));
  }, [selectedIndex]);

  return { trackRef, setOptionRef, onScroll, ...overflow };
};
