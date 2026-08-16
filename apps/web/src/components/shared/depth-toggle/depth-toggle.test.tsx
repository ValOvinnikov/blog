import { DepthProvider } from '@web/context/depth-provider';
import { renderElement, screen, within } from '@web/testing/custom-render';

import { DepthToggle, type IDepthToggleLabels } from './depth-toggle';

const labels: IDepthToggleLabels = {
  skim: '30s',
  read: 'Read',
  deep: 'Deep',
  ariaLabel: 'Reading depth',
};

const setup = (hasSkim: boolean, hasDeep: boolean) =>
  renderElement(
    <DepthProvider hasSkim={hasSkim} hasDeep={hasDeep}>
      <DepthToggle hasSkim={hasSkim} hasDeep={hasDeep} labels={labels} />
    </DepthProvider>,
  );

describe(`<${DepthToggle.name}/>`, () => {
  it('renders nothing when the post has neither a skim nor asides', () => {
    setup(false, false);

    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
  });

  it('renders only Read and Deep when the post has no approved skim', () => {
    setup(false, true);

    const group = screen.getByRole('radiogroup', { name: 'Reading depth' });
    expect(
      screen.queryByRole('radio', { name: '30s' }),
    ).not.toBeInTheDocument();
    expect(
      within(group).getByRole('radio', { name: 'Read' }),
    ).toBeInTheDocument();
    expect(
      within(group).getByRole('radio', { name: 'Deep' }),
    ).toBeInTheDocument();
  });

  it('renders only Skim and Read when the post has no asides', () => {
    setup(true, false);

    expect(screen.getByRole('radio', { name: '30s' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Read' })).toBeInTheDocument();
    expect(
      screen.queryByRole('radio', { name: 'Deep' }),
    ).not.toBeInTheDocument();
  });

  it('renders all three options when the post has both a skim and asides', () => {
    setup(true, true);

    expect(screen.getByRole('radio', { name: '30s' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Read' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Deep' })).toBeInTheDocument();
  });
});
