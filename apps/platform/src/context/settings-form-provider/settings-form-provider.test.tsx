import { ARCHIVED_NOTICE_ID } from '@platform/testing/render-in-settings-form';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';

import {
  SettingsFormProvider,
  useSettingsFormState,
} from './settings-form-provider';

const renderInProvider = (isArchived: boolean, isPending: boolean) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <SettingsFormProvider
      isArchived={isArchived}
      isPending={isPending}
      archivedNoticeId={ARCHIVED_NOTICE_ID}
    >
      {children}
    </SettingsFormProvider>
  );

  return renderHook(() => useSettingsFormState(), { wrapper: Wrapper }).result
    .current;
};

describe(`<${SettingsFormProvider.name}/>`, () => {
  it('throws when read outside a provider', () => {
    expect(() => renderHook(() => useSettingsFormState())).toThrow(
      'useSettingsFormState must be used within a SettingsFormProvider',
    );
  });

  it.each([
    {
      title: 'points fields at the archived notice while archived',
      isArchived: true,
      isPending: false,
      archivedDescribedBy: ARCHIVED_NOTICE_ID,
    },
    {
      title: 'describes no field by the notice while the tenant is live',
      isArchived: false,
      isPending: true,
      archivedDescribedBy: undefined,
    },
  ])('$title', ({ isArchived, isPending, archivedDescribedBy }) => {
    const state = renderInProvider(isArchived, isPending);

    expect(state).toEqual({ isArchived, isPending, archivedDescribedBy });
  });
});
