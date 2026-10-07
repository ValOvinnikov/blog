import { ASIDE_KIND } from '@blog/config';
import { DepthProvider } from '@web/context/depth-provider';
import {
  customRender,
  renderElement,
  screen,
} from '@web/testing/custom-render';

import { DeepAside } from './deep-aside';

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
      expect(screen.getByRole('note')).toBeVisible();
      expect(screen.getByText('Why not X')).toBeVisible();
      expect(screen.getByText('Because Y.')).toBeVisible();
    });

    it('is not gated by depth outside a DepthProvider', () => {
      expect(screen.getByRole('note')).toBeVisible();
      expect(screen.queryByTestId('deep-aside-gate')).not.toBeInTheDocument();
    });
  });

  it('is gated by depth inside a DepthProvider', () => {
    renderElement(
      <DepthProvider hasSkim={false} hasDeep={true}>
        <DeepAside {...props} />
      </DepthProvider>,
    );

    expect(screen.getByTestId('deep-aside-gate')).toBeInTheDocument();
    expect(screen.getByRole('note')).toBeInTheDocument();
  });
});
