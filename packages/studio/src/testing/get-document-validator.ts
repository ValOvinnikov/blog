import type { ValidationContext } from 'sanity';

type TDocumentCustomFn = (
  document: { _id: string } | undefined,
  context: ValidationContext,
) => Promise<string | true>;

type TSchemaWithValidation = {
  name: string;
  validation?: unknown;
};

export type TDocumentValidator = {
  fn: TDocumentCustomFn;
  isWarning: boolean;
};

/**
 * Extracts the single `rule.custom(fn)[.warning()]` validator a document
 * schema's `validation` builder registers, for schemas that keep the
 * validator function private and never export it directly.
 */
export const getDocumentValidator = (
  schemaType: TSchemaWithValidation,
): TDocumentValidator => {
  if (typeof schemaType.validation !== 'function') {
    throw new Error(
      `Expected ${schemaType.name} to define document validation.`,
    );
  }

  let customFn: TDocumentCustomFn | undefined;
  let warningCalled = false;

  const rule = {
    custom: (fn: TDocumentCustomFn) => {
      customFn = fn;
      return rule;
    },
    warning: () => {
      warningCalled = true;
      return rule;
    },
  };

  (schemaType.validation as (rule: unknown) => unknown)(rule);

  if (!customFn) {
    throw new Error(
      `Expected ${schemaType.name} validation to register a custom() rule.`,
    );
  }

  return { fn: customFn, isWarning: warningCalled };
};
