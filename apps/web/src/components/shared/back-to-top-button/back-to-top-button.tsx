'use client';

import { BackToTop } from '@blog/ui/components/atoms/back-to-top';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

/**
 * Queries by test id rather than the bare `footer` tag — a tagged post also
 * renders `Article.Footer`'s `<footer>` earlier in the DOM, which
 * `querySelector` would otherwise match first.
 */
export const BackToTopButton = () => {
  const t = useTranslations('blogPostPage');
  const [scrolledPastViewport, setScrolledPastViewport] = useState(false);
  const [footerVisible, setFooterVisible] = useState(false);

  useEffect(() => {
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
