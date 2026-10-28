import { DeadEndView } from '@platform/components/features/layout/dead-end-view';
import { LinkButton } from '@platform/components/shared/link-button';
import { adminRoutes } from '@platform/utils/routes/routes';
import { useTranslations } from 'next-intl';

export type TLegalPlaceholderViewProps = {
  title: string;
  description: string;
};

export const LegalPlaceholderView = ({
  title,
  description,
}: TLegalPlaceholderViewProps) => {
  const t = useTranslations('legalPlaceholderPage');

  return (
    <DeadEndView
      title={title}
      description={description}
      action={
        <LinkButton href={adminRoutes.signUp()} variant="secondary">
          {t('backToSignUp')}
        </LinkButton>
      }
    />
  );
};
