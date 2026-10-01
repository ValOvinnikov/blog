export function buildLocalizedValueExpression(field: string): string {
  return `coalesce(${field}[language == $locale][0].value, ${field}[language == $defaultLocale][0].value)`;
}
