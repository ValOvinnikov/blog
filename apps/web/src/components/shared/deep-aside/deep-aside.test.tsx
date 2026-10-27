import { ASIDE_KIND } from '@blog/config';
import { DepthProvider } from '@web/context/depth-provider';
import {
  customRender,
  renderElement,
  screen,
} from '@web/testing/custom-render';

import { DeepAside } from './deep-aside';

const DEEP_ASIDE_GATE_TEST_ID = 'deep-aside-gate';

const props = {
  kind: ASIDE_KIND.WHY_NOT,
  label: 'Why not X',
  children: <p>Because Y.</p>,
};

const setup = customRender(DeepAside, props);

describe(`<${DeepAside.name}/>`, () => {
  describe('outside a DepthProvider', () => {
    beforeEach(() => {
      setup();
    });

    it('renders the Aside molecule with its label and content', () => {
      const note = screen.getByRole('note');
      const label = screen.getByText(props.label);
      const content = screen.getByText('Because Y.');

      expect(note).toBeVisible();
      expect(label).toBeVisible();
      expect(content).toBeVisible();
    });

    it('is not gated by depth', () => {
      const gate = screen.queryByTestId(DEEP_ASIDE_GATE_TEST_ID);

      expect(gate).not.toBeInTheDocument();
    });
  });

  it('is gated by depth inside a DepthProvider', () => {
    renderElement(
      <DepthProvider hasSkim={false} hasDeep={true}>
        <DeepAside {...props} />
      </DepthProvider>,
    );

    const gate = screen.getByTestId(DEEP_ASIDE_GATE_TEST_ID);
    const note = screen.getByRole('note');

    expect(gate).toBeVisible();
    expect(note).toBeVisible();
  });
});
