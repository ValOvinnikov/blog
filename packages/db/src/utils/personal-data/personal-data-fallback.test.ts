import {
  PERSONAL_DATA_FALLBACK_REASON,
  PERSONAL_DATA_OWNER,
} from '@blog/db/constants';

import {
  notifyPersonalDataFallback,
  onPersonalDataFallback,
} from './personal-data-fallback';

const MOCK_FALLBACK = {
  owner: PERSONAL_DATA_OWNER.USER,
  reason: PERSONAL_DATA_FALLBACK_REASON.NOT_BACKFILLED,
};

describe(onPersonalDataFallback, () => {
  const stops: Array<() => void> = [];

  afterEach(() => {
    stops.splice(0).forEach((stop) => stop());
  });

  it('hears each fallback once', () => {
    const listener = vi.fn();
    stops.push(onPersonalDataFallback(listener));

    notifyPersonalDataFallback(MOCK_FALLBACK);

    expect(listener).toHaveBeenCalledOnce();
    expect(listener).toHaveBeenCalledWith(MOCK_FALLBACK);
  });

  it('stops hearing fallbacks once unsubscribed', () => {
    const listener = vi.fn();
    onPersonalDataFallback(listener)();

    notifyPersonalDataFallback(MOCK_FALLBACK);

    expect(listener).not.toHaveBeenCalled();
  });

  it('still reaches every listener when one throws', () => {
    const listener = vi.fn();
    stops.push(
      onPersonalDataFallback(() => {
        throw new Error('listener failed');
      }),
      onPersonalDataFallback(listener),
    );

    expect(() => notifyPersonalDataFallback(MOCK_FALLBACK)).not.toThrow();
    expect(listener).toHaveBeenCalledWith(MOCK_FALLBACK);
  });
});
