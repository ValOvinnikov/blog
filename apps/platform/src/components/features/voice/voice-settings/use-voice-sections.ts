'use client';

import type { TMaybeUndefined, TVoiceSurface } from '@blog/config';
import {
  VOICE_CARD_ID,
  VOICE_SECTION_ID,
  type TVoiceSection,
} from '@platform/constants/voice';
import { useMotionScrollBehavior } from '@platform/utils/use-motion-scroll-behavior/use-motion-scroll-behavior';
import { VOICE_SECTIONS_IN_PAGE_ORDER } from '@platform/utils/voice-draft/voice-draft';
import {
  voiceCardHref,
  voiceHashTarget,
  voiceSectionHref,
  voiceSectionOf,
} from '@platform/utils/voice-sections/voice-sections';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { flushSync } from 'react-dom';

const subscribeToNothing = () => () => {};

export const useVoiceSections = () => {
  const firstLoadHashRef = useRef<TMaybeUndefined<string>>(undefined);
  const hash = useSyncExternalStore(
    subscribeToNothing,
    () => (firstLoadHashRef.current ??= window.location.hash),
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

  const setAllSectionsOpen = (isOpen: boolean) =>
    setChosenSections(isOpen ? VOICE_SECTIONS_IN_PAGE_ORDER : []);

  const jumpToSection = (section: TVoiceSection) => {
    const { section: sectionId, heading } = VOICE_SECTION_ID[section];
    hasScrolledToHashRef.current = true;
    flushSync(() => setSectionOpen(section, true));
    document
      .getElementById(heading)
      ?.querySelector('button')
      ?.focus({ preventScroll: true });
    document
      .getElementById(sectionId)
      ?.scrollIntoView({ behavior: scrollBehavior, block: 'start' });
    window.history.replaceState(null, '', voiceSectionHref(section));
  };

  const jumpToCard = (surface: TVoiceSurface) => {
    const { card, heading } = VOICE_CARD_ID[surface];
    hasScrolledToHashRef.current = true;
    flushSync(() => setSectionOpen(voiceSectionOf(surface), true));
    document.getElementById(heading)?.focus({ preventScroll: true });
    document
      .getElementById(card)
      ?.scrollIntoView({ behavior: scrollBehavior, block: 'start' });
    window.history.replaceState(null, '', voiceCardHref(surface));
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
    openSections,
    isSectionOpen: (section: TVoiceSection) => openSections.includes(section),
    setSectionOpen,
    setAllSectionsOpen,
    jumpToSection,
    jumpToCard,
  };
};
