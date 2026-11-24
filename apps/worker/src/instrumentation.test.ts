import { registerLogSink } from '@shinefold/insight';
import { MOCK_LOKI_ENV } from '@worker/testing/loki-env/fixtures';
import { env } from '@worker/utils/env/__mocks__/env';

import { register } from './instrumentation';

vi.mock('@vercel/functions', () => ({ waitUntil: vi.fn() }));
vi.mock('@shinefold/insight', () => ({
  createLokiSink: vi.fn(() => vi.fn()),
  registerLogSink: vi.fn(),
}));
vi.mock('@worker/utils/env/env');

describe(register, () => {
  beforeEach(() => {
    Object.assign(env, MOCK_LOKI_ENV);
  });

  it('ships logs in the Node.js runtime', async () => {
    vi.stubEnv('NEXT_RUNTIME', 'nodejs');

    await register();

    expect(registerLogSink).toHaveBeenCalledOnce();
  });

  it('registers nothing in the edge runtime', async () => {
    vi.stubEnv('NEXT_RUNTIME', 'edge');

    await register();

    expect(registerLogSink).not.toHaveBeenCalled();
  });
});
