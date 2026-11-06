import type { TMaybeNull, TMaybeUndefined } from '@blog/config';
import type { TVoiceSection } from '@platform/constants/voice';
import { useLayoutMeasure } from '@platform/utils/use-layout-measure/use-layout-measure';
import { findActiveVoiceSection } from '@platform/utils/voice-sections/voice-sections';
import { type RefObject, useEffect, useRef, useState } from 'react';

import { stickyTopOf } from './sticky-top';

// Measured from where the bar pins, not where it sits in flow: a jump lands its header 16px under it, and 4px more keeps that header past the line.
const ACTIVATION_LINE_OFFSET_PX = 20;

const RELEASE_EVENTS = ['scrollend', 'wheel', 'touchmove', 'keydown'] as const;

export const useActiveVoiceSection = (
  barRef: RefObject<TMaybeNull<HTMLElement>>,
  openSections: readonly TVoiceSection[],
) => {
  const [activeSection, setActiveSection] =
    useState<TMaybeUndefined<TVoiceSection>>();
  const isHeldRef = useRef(false);
  const activeRef = useRef<TMaybeUndefined<TVoiceSection>>(undefined);

  useLayoutMeasure(() => {
    const bar = barRef.current;
    if (!bar || isHeldRef.current) return;
    const next = findActiveVoiceSection(
      stickyTopOf(bar) + bar.offsetHeight + ACTIVATION_LINE_OFFSET_PX,
    );
    if (next === activeRef.current) return;
    activeRef.current = next;
    setActiveSection(next);
  }, openSections);

  useEffect(() => {
    const release = () => {
      isHeldRef.current = false;
    };
    for (const type of RELEASE_EVENTS) {
      window.addEventListener(type, release, { passive: true });
    }

    return () => {
      for (const type of RELEASE_EVENTS) {
        window.removeEventListener(type, release);
      }
    };
  }, []);

  const holdActiveSection = (section: TVoiceSection) => {
    isHeldRef.current = true;
    activeRef.current = section;
    setActiveSection(section);
  };

  return { activeSection, holdActiveSection };
};
