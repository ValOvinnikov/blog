import { evaluate, parse } from 'groq-js';

export async function evaluateGroqExpression(
  expression: string,
  dataset: unknown[],
  root: unknown,
): Promise<unknown> {
  const value = await evaluate(parse(expression), { root, dataset });

  return value.get();
}
