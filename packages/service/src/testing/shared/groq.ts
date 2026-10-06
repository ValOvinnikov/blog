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
