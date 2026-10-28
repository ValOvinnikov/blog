import { faker } from '@faker-js/faker';
import { customRender } from '@web/testing/custom-render';
import { useRef } from 'react';
import type { MockInstance } from 'vitest';

import { useHideOpenPopovers } from './use-hide-open-popovers';

faker.seed(6078);

const FIRST_ROUTE = faker.system.directoryPath();
const NEXT_ROUTE = faker.system.directoryPath();

const Harness = ({ routeKey }: { routeKey: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  useHideOpenPopovers(ref, routeKey);

  return (
    <div ref={ref}>
      <div popover="auto" />
      <div popover="auto" />
    </div>
  );
};

const setup = customRender(Harness, { routeKey: FIRST_ROUTE });

describe(useHideOpenPopovers, () => {
  let hidePopover: MockInstance<HTMLElement['hidePopover']>;

  beforeEach(() => {
    hidePopover = vi.spyOn(HTMLElement.prototype, 'hidePopover');
  });

  afterEach(() => {
    hidePopover.mockRestore();
  });

  it('hides every popover in the container when the route key changes', () => {
    const { rerender } = setup();
    hidePopover.mockClear();

    rerender(<Harness routeKey={NEXT_ROUTE} />);

    expect(hidePopover).toHaveBeenCalledTimes(2);
  });

  it('leaves the popovers alone while the route key stays the same', () => {
    const { rerender } = setup();
    hidePopover.mockClear();

    rerender(<Harness routeKey={FIRST_ROUTE} />);

    expect(hidePopover).not.toHaveBeenCalled();
  });
});
