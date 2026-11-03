import { PageHeader } from '@platform/components/shared/page-header';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { shellHeaderVariants } from './shell-header-variants';

export type TShellHeaderProps = {
  title: string;
  description: string;
  isSavedStatusShown: boolean;
  isTitleHiddenBelowLg?: boolean;
  headerActions?: ReactNode;
};

export const ShellHeader = ({
  title,
  description,
  isSavedStatusShown,
  isTitleHiddenBelowLg,
  headerActions,
}: TShellHeaderProps) => {
  const t = useTranslations('saveBar');

  return (
    <PageHeader
      title={title}
      description={description}
      isTitleHiddenBelowLg={isTitleHiddenBelowLg}
      actions={
        (isSavedStatusShown || headerActions) && (
          <>
            {isSavedStatusShown && (
              <span className={shellHeaderVariants()}>{t('allSaved')}</span>
            )}
            {headerActions}
          </>
        )
      }
    />
  );
};
