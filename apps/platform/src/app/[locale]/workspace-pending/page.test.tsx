import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { redirect } from 'next/navigation';

import WorkspacePendingPage from './page';

const { authMock } = vi.hoisted(() => ({ authMock: vi.fn() }));

vi.mock('@platform/server/auth/auth', () => ({ auth: authMock }));

const setup = customRenderAsync(WorkspacePendingPage, {});

describe(`<${WorkspacePendingPage.name}/>`, () => {
  beforeEach(() => {
    authMock.mockReset();
    vi.mocked(redirect).mockClear();
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
