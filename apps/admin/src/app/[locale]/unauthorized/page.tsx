import { getTranslations } from 'next-intl/server';

export default async function UnauthorizedPage() {
  const t = await getTranslations('unauthorizedPage');

  return (
    <main>
      <h1>{t('heading')}</h1>
      <p>{t('description')}</p>
    </main>
  );
}
