import { customRender, screen } from '@web/testing/custom-render';

import { useActiveHeadingId } from './use-active-heading-id';

type TObserverEntryInit = {
  target: Element;
  isIntersecting: boolean;
  top: number;
};

/**
 * jsdom has no real `IntersectionObserver` — this fake captures every
 * instance created (keyed by the elements it observes) so tests can trigger
 * its callback directly with hand-built entries, mirroring the real
 * observer's `(entries) => void` contract closely enough to exercise the
 * hook's "topmost intersecting heading wins" selection logic.
 */
class FakeIntersectionObserver implements IntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];

  root = null;
  rootMargin = '';
  scrollMargin = '';
  thresholds: number[] = [];
  callback: IntersectionObserverCallback;
  observed: Element[] = [];

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    FakeIntersectionObserver.instances.push(this);
  }

  observe(target: Element) {
    this.observed.push(target);
  }

  unobserve() {}

  disconnect() {
    this.observed = [];
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  trigger(entries: TObserverEntryInit[]) {
    const fullEntries = entries.map(
      (entry) =>
        ({
          target: entry.target,
          isIntersecting: entry.isIntersecting,
          boundingClientRect: { top: entry.top } as DOMRectReadOnly,
        }) as IntersectionObserverEntry,
    );
    this.callback(fullEntries, this);
  }
}

const Harness = ({ ids }: { ids: string[] }) => {
  const activeId = useActiveHeadingId(ids);

  return (
    <div>
      <p data-testid="active-id">{activeId ?? 'none'}</p>
      {ids.map((id) => (
        <h2 key={id} id={id}>
          {id}
        </h2>
      ))}
    </div>
  );
};

const setup = customRender(Harness, { ids: [] });

/** The hook creates exactly one observer per non-empty `ids` render — asserted directly by callers that expect one to exist. */
const getObserver = (): FakeIntersectionObserver => {
  const [observer] = FakeIntersectionObserver.instances;
  if (!observer) {
    throw new Error('Expected an IntersectionObserver instance to exist.');
  }
  return observer;
};

describe(useActiveHeadingId, () => {
  beforeEach(() => {
    FakeIntersectionObserver.instances = [];
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns null before any heading has intersected', () => {
    setup({ ids: ['one', 'two', 'three'] });

    expect(screen.getByTestId('active-id')).toHaveTextContent('none');
  });

  it('returns nothing to observe for an empty id list', () => {
    setup({ ids: [] });

    expect(FakeIntersectionObserver.instances).toHaveLength(0);
    expect(screen.getByTestId('active-id')).toHaveTextContent('none');
  });

  it('sets the active id to the intersecting heading', () => {
    setup({ ids: ['one', 'two', 'three'] });
    const observer = getObserver();

    observer.trigger([
      {
        target: document.getElementById('one')!,
        isIntersecting: true,
        top: 10,
      },
    ]);

    expect(screen.getByTestId('active-id')).toHaveTextContent('one');
  });

  it('picks the topmost heading when multiple are intersecting at once', () => {
    setup({ ids: ['one', 'two', 'three'] });
    const observer = getObserver();

    observer.trigger([
      {
        target: document.getElementById('two')!,
        isIntersecting: true,
        top: 50,
      },
      { target: document.getElementById('one')!, isIntersecting: true, top: 5 },
    ]);

    expect(screen.getByTestId('active-id')).toHaveTextContent('one');
  });

  it('ignores non-intersecting entries', () => {
    setup({ ids: ['one', 'two'] });
    const observer = getObserver();

    observer.trigger([
      {
        target: document.getElementById('one')!,
        isIntersecting: false,
        top: 5,
      },
    ]);

    expect(screen.getByTestId('active-id')).toHaveTextContent('none');
  });
});
