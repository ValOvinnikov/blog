import type { TMaybeUndefined } from '@blog/config';
import {
  OWNER_STUDIO_ACCESS,
  type TOwnerStudioAccess,
} from '@platform/constants/owner-studio-access';
import { ShellStudioAccessProvider } from '@platform/context/shell-studio-access-provider';
import { renderWithIntl } from '@platform/testing/custom-render';
import { mockRouterRefresh } from '@platform/testing/mock-router';

import { ShellStudioAccessSync } from './shell-studio-access-sync';

const renderSync = (
  shellAccess: TMaybeUndefined<TOwnerStudioAccess>,
  pageAccess: TMaybeUndefined<TOwnerStudioAccess>,
) =>
  renderWithIntl(
    <ShellStudioAccessProvider studioAccess={shellAccess}>
      <ShellStudioAccessSync studioAccess={pageAccess} />
    </ShellStudioAccessProvider>,
  );

describe(`<${ShellStudioAccessSync.name}/>`, () => {
  let refresh: ReturnType<typeof mockRouterRefresh>;

  beforeEach(() => {
    refresh = mockRouterRefresh();
  });

  it.each([
    {
      name: 'the shell rendered before the invite was recorded',
      shell: undefined,
      page: OWNER_STUDIO_ACCESS.INVITE_SENT,
    },
    {
      name: 'the access state moved on since the shell rendered',
      shell: OWNER_STUDIO_ACCESS.INVITE_SENT,
      page: OWNER_STUDIO_ACCESS.READY,
    },
  ])('refreshes the route when $name', ({ shell, page }) => {
    renderSync(shell, page);

    expect(refresh).toHaveBeenCalledOnce();
  });

  it.each([
    { name: 'an owner', access: OWNER_STUDIO_ACCESS.ACTIVATING },
    { name: 'a viewer with no owner badge', access: undefined },
  ])(
    'leaves the route alone when the shell already agrees for $name',
    ({ access }) => {
      renderSync(access, access);

      expect(refresh).not.toHaveBeenCalled();
    },
  );
});
