'use client';

import { BackToTop } from '@blog/ui/atoms';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

/**
 * BackToTopButton — client-side wrapper that owns scroll-position state for
 * `BackToTop`. Listens for scroll (passively, cleaned up on unmount) to
 * toggle visibility once the reader has scrolled past one viewport height,
 * and smooth-scrolls to the top of the page on click.
 */
export const BackToTopButton = () => {
  const t = useTranslations('blogPostPage');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // One viewport height, per the back-to-top epic's spec — the point a
    // reader has scrolled past the initial screen of content.
    const handleScroll = () => {
      setVisible(window.scrollY > window.innerHeight);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <BackToTop
      visible={visible}
      onClick={handleClick}
      ariaLabel={t('backToTop.ariaLabel')}
    />
  );
};
