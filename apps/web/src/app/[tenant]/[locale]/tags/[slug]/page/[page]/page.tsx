import { routes, type ITenantLocalizedParams } from '@blog/config';
import { TagPage } from '@web/components/pages/tag-page';
import { permanentRedirect } from '@web/i18n/navigation';
import { buildTagMetadata } from '@web/metadata/tag-metadata';
import { parsePageParam } from '@web/utils/parse-page-param/parse-page-param';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

type TProps = {
  params: Promise<ITenantLocalizedParams & { slug: string; page: string }>;
};

export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: TProps): Promise<Metadata> {
  const { tenant, slug, page: rawPage } = await params;
  const page = parsePageParam(rawPage);
  if (page === null || page < 2) return {};
  return buildTagMetadata(slug, tenant, page);
}

export default async function TagNumberedPage({ params }: TProps) {
  const { locale, tenant, slug, page: rawPage } = await params;
  setRequestLocale(locale);

  const page = parsePageParam(rawPage);

  // Non-canonical / non-numeric → hard 404 (never a soft-404).
  if (page === null) {
    notFound();
  }

  // Page 1 has exactly one URL: /tags/{slug}. 308 — SEO-equivalent to a 301.
  if (page === 1) {
    permanentRedirect({ href: routes.tag(slug, 1), locale });
  }

  return <TagPage slug={slug} page={page} locale={locale} tenant={tenant} />;
}
