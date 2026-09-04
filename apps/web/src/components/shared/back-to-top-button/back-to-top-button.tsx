'use client';

import { BackToTop } from '@blog/ui/atoms/back-to-top';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

/**
 * BackToTopButton — client-side wrapper that owns scroll-position state for
 * `BackToTop`. Listens for scroll (passively, cleaned up on unmount) to
 * toggle visibility once the reader has scrolled past one viewport height,
 * and smooth-scrolls to the top of the page on click. Also watches the
 * site chrome `<footer data-testid="site-footer">` (rendered once, in
 * `[locale]/layout.tsx`) via `IntersectionObserver` (cleaned up on unmount)
 * and hides the button once it scrolls into view, so the fixed bottom-right
 * button never overlaps footer content (e.g. the RSS icon link). Queries by
 * test id rather than the bare `footer` tag — a tagged post also renders
 * `Article.Footer`'s `<footer>` earlier in the DOM, which `querySelector`
 * would otherwise match first.
 */
export const BackToTopButton = () => {
  const t = useTranslations('blogPostPage');
  const [scrolledPastViewport, setScrolledPastViewport] = useState(false);
  const [footerVisible, setFooterVisible] = useState(false);

  useEffect(() => {
    // One viewport height, per the back-to-top epic's spec — the point a
    // reader has scrolled past the initial screen of content.
    const handleScroll = () => {
      setScrolledPastViewport(window.scrollY > window.innerHeight);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    const footer = document.querySelector('footer[data-testid="site-footer"]');
    if (!footer) return;

    const observer = new IntersectionObserver(([entry]) => {
      setFooterVisible(entry?.isIntersecting ?? false);
    });

    observer.observe(footer);

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <BackToTop
      isVisible={scrolledPastViewport && !footerVisible}
      onClick={handleClick}
      ariaLabel={t('backToTop.ariaLabel')}
    />
  );
};
