import { SIZE, type TMaybeUndefined } from '@blog/config';
import { Checkbox } from '@platform/components/shared/checkbox';
import { LegalPageLink } from '@platform/components/shared/legal-page-link';
import type { TLegalPageUrls } from '@platform/utils/legal-page-urls/legal-page-urls';
import { useTranslations } from 'next-intl';

export type TTermsAcceptanceCheckboxProps = {
  legalPageUrls: TMaybeUndefined<TLegalPageUrls>;
  isChecked: boolean;
  onCheckedChange: (checked: boolean) => void;
  hasError: boolean;
};

export const TermsAcceptanceCheckbox = ({
  legalPageUrls,
  isChecked,
  onCheckedChange,
  hasError,
}: TTermsAcceptanceCheckboxProps) => {
  const t = useTranslations('termsAcceptance');

  return (
    <Checkbox
      isChecked={isChecked}
      onCheckedChange={onCheckedChange}
      size={SIZE.LG}
      label={t.rich('acceptTerms', {
        terms: (chunks) => (
          <LegalPageLink href={legalPageUrls?.terms}>{chunks}</LegalPageLink>
        ),
        privacy: (chunks) => (
          <LegalPageLink href={legalPageUrls?.privacy}>{chunks}</LegalPageLink>
        ),
      })}
      error={hasError ? t('termsNotAccepted') : undefined}
    />
  );
};
