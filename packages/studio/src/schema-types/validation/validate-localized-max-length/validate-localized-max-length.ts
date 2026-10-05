import { localizedStringValues } from '@blog/studio/schema-types/validation/localized-string-values/localized-string-values';

export const validateLocalizedMaxLength =
  (maxLength: number, message: string) =>
  (value: unknown): true | string =>
    localizedStringValues(value).some((text) => text.length > maxLength)
      ? message
      : true;
