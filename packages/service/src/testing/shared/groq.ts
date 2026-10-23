import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { evaluate, parse } from 'groq-js';

export async function evaluateGroqExpression(
  expression: string,
  dataset: unknown[],
  root: unknown,
  params?: Record<string, unknown>,
): Promise<unknown> {
  const value = await evaluate(parse(expression), { root, dataset, params });

  return value.get();
}

export async function evaluateGroqSlugs(
  expression: string,
  dataset: unknown[],
  params: Record<string, unknown>,
): Promise<string[]> {
  const rows = await evaluateGroqExpression(
    expression,
    dataset,
    undefined,
    params,
  );

  return (rows as { slug: string }[]).map(({ slug }) => slug);
}

export async function evaluateGroqIds(
  expression: string,
  dataset: unknown[],
  params: Record<string, unknown>,
): Promise<string[]> {
  const rows = await evaluateGroqExpression(
    expression,
    dataset,
    undefined,
    params,
  );

  return (rows as { _id: string }[]).map(({ _id }) => _id);
}

export function evaluateGroqInLocale(
  query: string,
  dataset: unknown[],
  locale?: string,
): Promise<unknown> {
  return evaluateGroqExpression(
    query,
    dataset,
    null,
    locale ? { locale, defaultLocale: LOCALE_ISO_CODES.EN } : {},
  );
}

export function createLocalizedFieldResolver(
  query: string,
  toDocument: (entries: unknown[]) => Record<string, unknown>,
) {
  return (entries: unknown[], locale: string): Promise<unknown> =>
    evaluateGroqInLocale(query, [toDocument(entries)], locale);
}
