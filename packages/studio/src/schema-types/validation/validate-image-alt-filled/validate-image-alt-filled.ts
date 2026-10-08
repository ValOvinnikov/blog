import { validateDefaultLanguageFilled } from '@blog/studio/schema-types/validation/validate-default-language-filled/validate-default-language-filled';
import type { ValidationContext } from 'sanity';

type TImageParent = { asset?: unknown };

export const validateImageAltFilled = (message: string) => {
  const validateFilled = validateDefaultLanguageFilled(message);

  return (alt: unknown, context: ValidationContext): string | true =>
    (context.parent as TImageParent | undefined)?.asset
      ? validateFilled(alt)
      : true;
};
