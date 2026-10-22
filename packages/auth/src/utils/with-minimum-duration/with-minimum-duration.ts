/** Holds a response back until `minimumMs` have passed, so its timing cannot tell its outcomes apart. */
export async function withMinimumDuration<T>(
  minimumMs: number,
  task: () => Promise<T>,
): Promise<T> {
  const startedAt = Date.now();

  try {
    return await task();
  } finally {
    const remainingMs = minimumMs - (Date.now() - startedAt);
    if (remainingMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, remainingMs));
    }
  }
}
