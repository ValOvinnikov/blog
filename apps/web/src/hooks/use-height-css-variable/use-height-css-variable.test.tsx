import { customRender } from '@web/testing/custom-render';

import { useHeightCssVariable } from './use-height-css-variable';

const VARIABLE = '--test-height';

const Harness = () => {
  const ref = useHeightCssVariable<HTMLDivElement>(VARIABLE);

  return <div ref={ref} />;
};

const setup = customRender(Harness, {});

const readVariable = () =>
  document.documentElement.style.getPropertyValue(VARIABLE);

describe(useHeightCssVariable, () => {
  let height = 0;

  beforeEach(() => {
    height = 72;
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
      () => DOMRect.fromRect({ height }),
    );
    vi.stubGlobal(
      'ResizeObserver',
      class implements ResizeObserver {
        constructor(private readonly callback: ResizeObserverCallback) {}
        observe() {
          this.callback([], this);
        }
        unobserve() {}
        disconnect() {}
      },
    );
  });

  it('sets the variable to the element height on the root element', () => {
    setup();

    expect(readVariable()).toBe('72px');
  });

  it('removes the variable on unmount', () => {
    const { unmount } = setup();

    unmount();

    expect(readVariable()).toBe('');
  });
});
