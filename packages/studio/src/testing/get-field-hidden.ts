/**
 * Extracts a field's `hidden` predicate function, throwing if the field
 * doesn't define one — for exercising conditional visibility against a
 * fabricated form context.
 */
export const getHidden = <TContext = { parent?: unknown }>(field: {
  hidden?: unknown;
}): ((context: TContext) => boolean) => {
  if (typeof field.hidden !== 'function') {
    throw new Error('Expected field to define a hidden() fn.');
  }

  return field.hidden as (context: TContext) => boolean;
};
