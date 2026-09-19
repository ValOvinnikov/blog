export const getHidden = <TContext = { parent?: unknown }>(field: {
  hidden?: unknown;
}): ((context: TContext) => boolean) => {
  if (typeof field.hidden !== 'function') {
    throw new Error('Expected field to define a hidden() fn.');
  }

  return field.hidden as (context: TContext) => boolean;
};
