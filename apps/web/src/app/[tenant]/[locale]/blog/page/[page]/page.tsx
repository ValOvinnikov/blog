import { routes, type ITenantLocalizedParams } from '@blog/config';
import { PostIndexPage } from '@web/components/pages/post-index-page';
import { permanentRedirect } from '@web/i18n/navigation';
import { buildPostIndexMetadata } from '@web/metadata/post-index-metadata';
import { parsePageParam } from '@web/utils/parse-page-param/parse-page-param';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

type TProps = {
  params: Promise<ITenantLocalizedParams & { page: string }>;
};

export function generateStaticParams() {
  return [];
}

/** Full Route Cache backstop for a missed purge — kept equal to `CONTENT_ROUTE_REVALIDATE_SECONDS` (Next requires a literal here, not an import). */
export const revalidate = 21600;

export async function generateMetadata({ params }: TProps): Promise<Metadata> {
  const { tenant, page: rawPage } = await params;
  const page = parsePageParam(rawPage);
  if (page === null || page < 2) return {};
  return buildPostIndexMetadata(page, tenant);
}

export default async function PostIndexNumberedPage({ params }: TProps) {
  const { locale, tenant, page: rawPage } = await params;
  setRequestLocale(locale);

  const page = parsePageParam(rawPage);

  // Non-canonical / non-numeric → hard 404 (never a soft-404).
  if (page === null) {
    notFound();
  }

  // Page 1 has exactly one URL: /blog. 308 — SEO-equivalent to a 301.
  if (page === 1) {
    permanentRedirect({ href: routes.blogIndex(1), locale });
  }

  return <PostIndexPage page={page} locale={locale} tenant={tenant} />;
}
