import { evaluate, parse } from 'groq-js';

export const mockGroqFetch =
  (dataset: unknown[], fetchError?: Error) =>
  async (query: string, params: Record<string, unknown> = {}) => {
    if (fetchError) throw fetchError;

    return (await evaluate(parse(query), { dataset, params })).get();
  };
