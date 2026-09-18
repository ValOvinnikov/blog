/**
 * Exercises a field's `validation` builder against a minimal mock `Rule`
 * that responds to any chained call by returning itself, reporting whether
 * `.required()` was invoked anywhere in the chain.
 */
export const wasRequiredCalled = (field: { validation?: unknown }): boolean => {
  if (typeof field.validation !== 'function') {
    throw new Error('Expected field to define validation.');
  }

  let requiredCalled = false;

  const handler: ProxyHandler<() => unknown> = {
    get(_target, prop) {
      if (prop === 'required') {
        return () => {
          requiredCalled = true;
          return rule;
        };
      }
      return () => rule;
    },
  };

  const rule = new Proxy(() => rule, handler);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- exercising a real Sanity validation builder against a minimal mock Rule
  (field.validation as any)(rule);

  return requiredCalled;
};
