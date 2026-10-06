import { type FieldDefinition } from 'sanity';

export type TOptionalNameLocalizedFieldOptions = Partial<
  Omit<FieldDefinition, 'type'>
>;

export type TLocalizedFieldOptions = TOptionalNameLocalizedFieldOptions &
  Pick<FieldDefinition, 'name'>;
