'use client';

import type { TMaybeUndefined, TVoiceSurface } from '@blog/config';
import { VOICE_CARD_ID, type TVoiceSection } from '@platform/constants/voice';
import { useMotionScrollBehavior } from '@platform/utils/use-motion-scroll-behavior/use-motion-scroll-behavior';
import {
  voiceCardHref,
  voiceHashTarget,
  voiceSectionOf,
} from '@platform/utils/voice-sections/voice-sections';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { flushSync } from 'react-dom';

const subscribeToNothing = () => () => {};

export const useVoiceSections = () => {
  const hash = useSyncExternalStore(
    subscribeToNothing,
    () => window.location.hash,
    () => '',
  );
  const hashTarget = voiceHashTarget(hash);
  const [chosenSections, setChosenSections] =
    useState<TMaybeUndefined<readonly TVoiceSection[]>>();
  const openSections =
    chosenSections ?? (hashTarget ? [hashTarget.section] : []);
  const scrollBehavior = useMotionScrollBehavior();
  const hasScrolledToHashRef = useRef(false);

  const setSectionOpen = (section: TVoiceSection, isOpen: boolean) =>
    setChosenSections((current = openSections) =>
      current.filter((open) => open !== section).concat(isOpen ? section : []),
    );

  const jumpToCard = (surface: TVoiceSurface) => {
    const { card, heading } = VOICE_CARD_ID[surface];
    hasScrolledToHashRef.current = true;
    flushSync(() => setSectionOpen(voiceSectionOf(surface), true));
    document.getElementById(heading)?.focus({ preventScroll: true });
    document
      .getElementById(card)
      ?.scrollIntoView({ behavior: scrollBehavior, block: 'start' });
    window.history.replaceState(
      window.history.state,
      '',
      voiceCardHref(surface),
    );
  };

  const hashTargetId = hashTarget?.id;
  useEffect(() => {
    if (!hashTargetId || hasScrolledToHashRef.current) return;
    hasScrolledToHashRef.current = true;
    document
      .getElementById(hashTargetId)
      ?.scrollIntoView({ behavior: scrollBehavior, block: 'start' });
  }, [hashTargetId, scrollBehavior]);

  return {
    isSectionOpen: (section: TVoiceSection) => openSections.includes(section),
    setSectionOpen,
    jumpToCard,
  };
};
