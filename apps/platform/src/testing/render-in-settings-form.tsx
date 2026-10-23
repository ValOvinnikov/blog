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

export const ARCHIVED_NOTICE_ID = 'archived-notice';

export const SAVE_CHANGES = 'Save changes';
export const ALL_CHANGES_SAVED = 'All changes saved';
export const UNSAVED_CHANGES = 'Unsaved changes';
export const ONE_FIELD_NEEDS_ATTENTION = '1 field needs attention';
export const GO_TO_THE_FIRST_ONE = 'Go to the first one';

export const ARCHIVED_NOTICE_TEXT = 'This tenant is archived';

export const ARCHIVED_NOTICE_DESCRIPTION = `${ARCHIVED_NOTICE_TEXT} Deprovisioned Aug 26, 2026. Everything on these pages is read-only.`;

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
