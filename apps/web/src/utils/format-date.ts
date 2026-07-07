export const formatDate = (iso: string, locale: string): string =>
  new Date(iso).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
