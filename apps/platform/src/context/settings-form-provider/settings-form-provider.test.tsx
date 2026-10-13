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
      archivedNoticeId="notice"
    >
      {children}
    </SettingsFormProvider>
  );
  return renderHook(() => useSettingsFormState(), { wrapper: Wrapper }).result
    .current;
};

describe(SettingsFormProvider, () => {
  it('throws when read outside a provider', () => {
    expect(() => renderHook(() => useSettingsFormState())).toThrow(
      'useSettingsFormState must be used within a SettingsFormProvider',
    );
  });

  it('points fields at the archived notice while archived', () => {
    expect(renderInProvider(true, false)).toEqual({
      isArchived: true,
      isPending: false,
      archivedDescribedBy: 'notice',
    });
  });

  it('describes no field by the notice while the tenant is live', () => {
    expect(renderInProvider(false, true)).toEqual({
      isArchived: false,
      isPending: true,
      archivedDescribedBy: undefined,
    });
  });
});
