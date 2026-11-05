import type { TMaybeNull } from '@blog/config';
import { useEffect, useRef, useState } from 'react';

type TTrackOverflow = { hasMoreStart: boolean; hasMoreEnd: boolean };

type TUseTrackScrollOptions = {
  selectedIndex: number;
  fadeWidth: number;
};

const NO_OVERFLOW: TTrackOverflow = { hasMoreStart: false, hasMoreEnd: false };

const overflowOf = ({
  scrollLeft,
  scrollWidth,
  clientWidth,
}: HTMLElement): TTrackOverflow => ({
  hasMoreStart: scrollLeft > 0,
  hasMoreEnd: Math.ceil(scrollLeft + clientWidth) < scrollWidth,
});

const scrollLeftToReveal = (
  track: HTMLElement,
  item: HTMLElement,
  fadeWidth: number,
) => {
  const start = item.offsetLeft - fadeWidth;
  const end = item.offsetLeft + item.offsetWidth + fadeWidth;
  if (start < track.scrollLeft) return start;
  if (end > track.scrollLeft + track.clientWidth)
    return end - track.clientWidth;
  return track.scrollLeft;
};

export const useTrackScroll = <
  TTrack extends HTMLElement,
  TItem extends HTMLElement,
>({
  selectedIndex,
  fadeWidth,
}: TUseTrackScrollOptions) => {
  const trackRef = useRef<TMaybeNull<TTrack>>(null);
  const itemRefs = useRef<TMaybeNull<TItem>[]>([]);
  const [overflow, setOverflow] = useState(NO_OVERFLOW);

  const setItemRef = (index: number) => (node: TMaybeNull<TItem>) => {
    itemRefs.current[index] = node;
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
    const item = itemRefs.current[selectedIndex];
    if (!track || !item) return;
    track.scrollLeft = scrollLeftToReveal(track, item, fadeWidth);
    setOverflow(overflowOf(track));
  }, [selectedIndex, fadeWidth]);

  return { trackRef, setItemRef, onScroll, ...overflow };
};
