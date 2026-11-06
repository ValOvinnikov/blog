import { PageHeader } from '@platform/components/shared/page-header';
import {
  SETTINGS_FORM_STACK,
  type TSettingsFormStack,
} from '@platform/constants/settings-form';
import { useTranslations } from 'next-intl';
import type { ReactNode, Ref } from 'react';

import { shellHeaderVariants } from './shell-header-variants';

export type TShellHeaderProps = {
  title: string;
  titleRef?: Ref<HTMLHeadingElement>;
  description: string;
  isSavedStatusShown: boolean;
  isTitleHiddenBelowLg?: boolean;
  stack?: TSettingsFormStack;
  headerActions?: ReactNode;
};

export const ShellHeader = ({
  title,
  titleRef,
  description,
  isSavedStatusShown,
  isTitleHiddenBelowLg,
  stack,
  headerActions,
}: TShellHeaderProps) => {
  const t = useTranslations('saveBar');
  const { root, savedStatus } = shellHeaderVariants({ stack });

  return (
    <PageHeader
      title={title}
      titleRef={titleRef}
      description={description}
      isTitleHiddenBelowLg={isTitleHiddenBelowLg}
      isActionsFullWidthBelowMd={stack === SETTINGS_FORM_STACK.VOICE}
      className={root()}
      actions={
        (isSavedStatusShown || headerActions) && (
          <>
            {isSavedStatusShown && (
              <span className={savedStatus()}>{t('allSaved')}</span>
            )}
            {headerActions}
          </>
        )
      }
    />
  );
};
