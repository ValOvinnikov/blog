import type { ILocalizedParams } from '@blog/config';
import { AccountPage } from '@web/components/pages/account-page';
import { buildAccountMetadata } from '@web/metadata/account-metadata';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

type TProps = {
  params: Promise<ILocalizedParams>;
};

export function generateMetadata(): Promise<Metadata> {
  return buildAccountMetadata();
}

// No `generateStaticParams` re-export here beyond the locale segment
// (`[locale]/layout.tsx` already provides that one) — this route reads the
// signed-in reader's own session (`auth()`, inside `AccountPage`), so it's
// inherently per-request dynamic, same stance `/bookmarks` already takes.
export default async function AccountRoute({ params }: TProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AccountPage />;
}
