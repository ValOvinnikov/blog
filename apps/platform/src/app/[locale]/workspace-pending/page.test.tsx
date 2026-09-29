import { auth } from '@platform/server/auth/auth';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { redirect } from 'next/navigation';
import type { Session } from 'next-auth';

import WorkspacePendingPage from './page';

vi.mock('@platform/server/auth/auth');

const authMock = vi.mocked<() => Promise<Partial<Session> | null>>(auth);

const setup = customRenderAsync(WorkspacePendingPage, {});

describe(`<${WorkspacePendingPage.name}/>`, () => {
  beforeEach(() => {
    authMock.mockReset();
  });

  it('redirects to sign-in without rendering when there is no session', async () => {
    authMock.mockResolvedValue(null);

    await expect(setup()).rejects.toThrow('NEXT_REDIRECT');

    expect(redirect).toHaveBeenCalledWith('/api/auth/signin');
  });

  it('renders the heading and description for a signed-in user', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });

    await setup();

    expect(
      screen.getByRole('heading', { name: "Your workspace isn't ready yet" }),
    ).toBeVisible();
    expect(redirect).not.toHaveBeenCalled();
  });
});
