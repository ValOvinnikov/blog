import type {
  TMaybeNull,
  TMaybeUndefined,
  TNullable,
} from '@blog/config/types';

import {
  COOKIE_STATEMENT_SLUG,
  NEWSLETTER_RESULT_SLUGS,
  type TLocaleIsoCode,
  type TNewsletterResult,
} from '@blog/config/constants';

const toNewsletterLinkQuery = (token: string, locale?: TLocaleIsoCode) => {
  const tokenQuery = `token=${encodeURIComponent(token)}`;
  return locale ? `${tokenQuery}&lang=${locale}` : tokenQuery;
};

export const routes = {
  home: () => '/',
  blogIndex: (page = 1) => (page === 1 ? '/blog' : `/blog/page/${page}`),
  post: (slug: string) => `/blog/${slug}`,
  topic: (slug: string, page = 1) =>
    page === 1 ? `/topics/${slug}` : `/topics/${slug}/page/${page}`,
  tag: (slug: string, page = 1) =>
    page === 1 ? `/tags/${slug}` : `/tags/${slug}/page/${page}`,
  topics: () => '/topics',
  tags: () => '/tags',
  bookmarks: () => '/bookmarks',
  account: () => '/account',
  /** A Route Handler, not a page, so it's outside `[locale]`. */
  accountExport: () => '/api/account/export',
  newsletterConfirm: (token: string, locale?: TLocaleIsoCode) =>
    `/api/newsletter/confirm?${toNewsletterLinkQuery(token, locale)}`,
  newsletterUnsubscribe: (token: string, locale?: TLocaleIsoCode) =>
    `/api/newsletter/unsubscribe?${toNewsletterLinkQuery(token, locale)}`,
  newsletterUnsubscribeSubmit: (locale?: TLocaleIsoCode) =>
    locale
      ? `/api/newsletter/unsubscribe?lang=${locale}`
      : '/api/newsletter/unsubscribe',
  newsletterUnsubscribeConfirmation: () => '/newsletter/unsubscribe',
  newsletterResult: (result: TNewsletterResult) =>
    `/newsletter/${NEWSLETTER_RESULT_SLUGS[result]}`,
  landingPage: (slug: string) => `/${slug}`,
  privacyDocument: (slug: string) => `/privacy/${slug}`,
  legalDocument: (slug: string) => `/legal/${slug}`,
  cookieStatement: () => routes.legalDocument(COOKIE_STATEMENT_SLUG),
  terms: () => '/terms',
  privacy: () => '/privacy',
  legal: () => '/legal',
  switchLanguage: (to: string, from: string) =>
    `/api/switch-language?${new URLSearchParams({ to, from }).toString()}`,
  rssFeed: () => '/rss.xml',
  tagRssFeed: (slug: string) => `${routes.tag(slug)}/rss.xml`,
} as const;

const PAGE_HREF_BUILDERS = {
  page_home: () => routes.home(),
  page_landing: (slug) => (slug ? routes.landingPage(slug) : undefined),
  page_post: (slug) => (slug ? routes.post(slug) : undefined),
  page_postIndex: () => routes.blogIndex(),
  page_topic: (slug) => (slug ? routes.topic(slug) : undefined),
  page_topicIndex: () => routes.topics(),
  page_tag: (slug) => (slug ? routes.tag(slug) : undefined),
  page_tagIndex: () => routes.tags(),
  page_privacyIndex: () => routes.privacy(),
  page_privacyDocument: (slug) =>
    slug ? routes.privacyDocument(slug) : undefined,
  page_legalIndex: () => routes.legal(),
  page_legalDocument: (slug) => (slug ? routes.legalDocument(slug) : undefined),
  page_cookieStatement: () => routes.cookieStatement(),
} satisfies Record<
  string,
  (slug: TNullable<string>) => TMaybeUndefined<string>
>;

type TLinkablePageType = keyof typeof PAGE_HREF_BUILDERS;

const isLinkablePageType = (type: string): type is TLinkablePageType =>
  type in PAGE_HREF_BUILDERS;

export const pageHref = (
  type: TNullable<string>,
  slug?: TMaybeNull<string>,
): TMaybeUndefined<string> =>
  type && isLinkablePageType(type) ? PAGE_HREF_BUILDERS[type](slug) : undefined;
