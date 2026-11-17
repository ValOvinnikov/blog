import { ShellStudioAccessProvider } from '@platform/context/shell-studio-access-provider';
import { renderWithIntl } from '@platform/testing/custom-render';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import type { TMaybeUndefined } from '@shinefold/config';
import { STUDIO_ACCESS, type TStudioAccess } from '@shinefold/config/constants';

import { ShellStudioAccessSync } from './shell-studio-access-sync';

const renderSync = (
  shellAccess: TMaybeUndefined<TStudioAccess>,
  pageAccess: TMaybeUndefined<TStudioAccess>,
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
      page: STUDIO_ACCESS.INVITE_SENT,
    },
    {
      name: 'the access state moved on since the shell rendered',
      shell: STUDIO_ACCESS.INVITE_SENT,
      page: STUDIO_ACCESS.READY,
    },
  ])('refreshes the route when $name', ({ shell, page }) => {
    renderSync(shell, page);

    expect(refresh).toHaveBeenCalledOnce();
  });

  it.each([
    { name: 'an owner', access: STUDIO_ACCESS.ACTIVATING },
    { name: 'a viewer with no owner badge', access: undefined },
  ])(
    'leaves the route alone when the shell already agrees for $name',
    ({ access }) => {
      renderSync(access, access);

      expect(refresh).not.toHaveBeenCalled();
    },
  );
});
