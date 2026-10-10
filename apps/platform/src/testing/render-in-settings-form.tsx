import { SettingsFormProvider } from '@platform/context/settings-form-provider';
import {
  renderWithIntl,
  type RenderResult,
} from '@platform/testing/custom-render';
import { createElement, type ComponentType } from 'react';

type TSettingsFormTestState = {
  isArchived?: boolean;
  isPending?: boolean;
};

const ARCHIVED_NOTICE_ID = 'archived-notice';

export const ARCHIVED_NOTICE_TEXT = 'This tenant is archived';

export const customRenderInSettingsForm = <P extends object>(
  Component: ComponentType<P>,
  defaultProps: NoInfer<P>,
) => {
  return (
    overrides?: Partial<P>,
    { isArchived = false, isPending = false }: TSettingsFormTestState = {},
  ): RenderResult =>
    renderWithIntl(
      <SettingsFormProvider
        isArchived={isArchived}
        isPending={isPending}
        archivedNoticeId={ARCHIVED_NOTICE_ID}
      >
        {isArchived && <p id={ARCHIVED_NOTICE_ID}>{ARCHIVED_NOTICE_TEXT}</p>}
        {createElement(Component, { ...defaultProps, ...overrides })}
      </SettingsFormProvider>,
    );
};
