import { DepthProvider } from '@web/context/depth-provider';
import { renderElement, screen, within } from '@web/testing/custom-render';

import { DepthToggle } from './depth-toggle';

const SKIM_OPTION = '30s';
const READ_OPTION = 'Read';
const DEEP_OPTION = 'Deep';

const setup = (hasSkim: boolean, hasDeep: boolean) =>
  renderElement(
    <DepthProvider hasSkim={hasSkim} hasDeep={hasDeep}>
      <DepthToggle hasSkim={hasSkim} hasDeep={hasDeep} />
    </DepthProvider>,
  );

describe(`<${DepthToggle.name}/>`, () => {
  it('renders nothing when the post has neither a skim nor asides', () => {
    setup(false, false);

    const group = screen.queryByRole('radiogroup');

    expect(group).not.toBeInTheDocument();
  });

  it.each([
    {
      title: 'only Read and Deep when the post has no approved skim',
      hasSkim: false,
      hasDeep: true,
      options: [READ_OPTION, DEEP_OPTION],
    },
    {
      title: 'only Skim and Read when the post has no asides',
      hasSkim: true,
      hasDeep: false,
      options: [SKIM_OPTION, READ_OPTION],
    },
    {
      title: 'all three when the post has both a skim and asides',
      hasSkim: true,
      hasDeep: true,
      options: [SKIM_OPTION, READ_OPTION, DEEP_OPTION],
    },
  ])('offers $title', ({ hasSkim, hasDeep, options }) => {
    setup(hasSkim, hasDeep);

    const group = screen.getByRole('radiogroup', { name: 'Reading depth' });
    const radios = within(group).getAllByRole('radio');

    expect(radios.map((radio) => radio.textContent)).toEqual(options);
  });
});
