import {
  BRAND_VARIANT,
  CARD_IMAGE_SHAPE,
  CONTENT_ALIGNMENT,
  DISPLAY_MODE,
} from '@blog/config';
import { customRender, screen } from '@web/testing/custom-render';
import { ctaActionsDemo } from '@web/testing/modules/cta/fixtures';
import { makeSanityImage } from '@web/testing/modules/hero/fixtures';
import { makeTeamMember } from '@web/testing/modules/team/fixtures';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { SmartLinkMock } from '@web/testing/shared/smart-link/smart-link-mock';

import { TeamModuleView } from './team-module-view';

vi.mock('@web/components/shared/smart-link', () => ({
  SmartLink: SmartLinkMock,
}));

const { TeamCarousel } = vi.hoisted(() => ({
  TeamCarousel: vi.fn(() => <div data-testid="team-carousel-stub" />),
}));

vi.mock('./team-carousel', () => ({ TeamCarousel }));

const members = [
  makeTeamMember({ id: 'team-member-1', name: 'Jordan Reyes' }),
  makeTeamMember({ id: 'team-member-2', name: 'Casey Morgan' }),
];

const dataTestId = 'team-module-team-1';

const setup = customRender(TeamModuleView, {
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: makeHeadingBlock({ heading: 'Meet the team' }),
  members,
  showBios: false,
  showSocialLinks: false,
  ctaButtons: [],
  imageShape: CARD_IMAGE_SHAPE.SQUARE,
  displayMode: DISPLAY_MODE.GRID,
  contentAlignment: undefined,
  cardAlignment: CONTENT_ALIGNMENT.LEFT,
  layout: undefined,
  titleId: 'team-title',
  dataTestId,
});

describe(`<${TeamModuleView.name}/>`, () => {
  it('labels the section with the given titleId', () => {
    setup();

    const label = screen.getByText('Meet the team');
    expect(label).toHaveAttribute('id', 'team-title');
    expect(label.tagName).toBe('H2');

    const section = label.closest('section');
    expect(section).toHaveAttribute('aria-labelledby', 'team-title');
    expect(section).toHaveAttribute('data-testid', dataTestId);
  });

  it('renders one article with an h3 name per member', () => {
    setup();

    expect(screen.getAllByRole('article')).toHaveLength(2);
    members.forEach((member) => {
      expect(
        screen.getByRole('heading', { level: 3, name: member.name }),
      ).toBeVisible();
    });
  });

  it.each([
    [DISPLAY_MODE.CAROUSEL, true],
    [DISPLAY_MODE.GRID, false],
  ])(
    'renders TeamCarousel instead of the grid only when displayMode is %s: %s',
    (displayMode, expectedCarousel) => {
      setup({ displayMode });

      expect(TeamCarousel).toHaveBeenCalledTimes(expectedCarousel ? 1 : 0);
      if (expectedCarousel) {
        expect(screen.getByTestId('team-carousel-stub')).toBeVisible();
        expect(TeamCarousel).toHaveBeenCalledWith(
          expect.objectContaining({ members }),
          undefined,
        );
        expect(screen.queryByRole('article')).not.toBeInTheDocument();
      }
    },
  );

  it('renders no action group when there are no cta buttons', () => {
    setup();

    expect(screen.queryAllByRole('link')).toHaveLength(0);
  });

  it('renders the resolved cta buttons when present', () => {
    setup({ ctaButtons: ctaActionsDemo });

    expect(screen.getByRole('link', { name: 'Subscribe now' })).toHaveAttribute(
      'href',
      '/blog',
    );
    expect(
      screen.getByRole('link', {
        name: 'Learn more about our subscription plans',
      }),
    ).toHaveAttribute('href', '/about-us');
  });

  const fourMembers = [
    makeTeamMember({
      id: 'team-member-1',
      name: 'Member One',
      image: makeSanityImage({ alt: 'Member One photo' }),
    }),
    makeTeamMember({
      id: 'team-member-2',
      name: 'Member Two',
      image: makeSanityImage({ alt: 'Member Two photo' }),
    }),
    makeTeamMember({
      id: 'team-member-3',
      name: 'Member Three',
      image: makeSanityImage({ alt: 'Member Three photo' }),
    }),
    makeTeamMember({
      id: 'team-member-4',
      name: 'Member Four',
      image: makeSanityImage({ alt: 'Member Four photo' }),
    }),
  ];

  it('keeps the base 4-column image sizes request when bios are hidden', () => {
    setup({ members: fourMembers, showBios: false });

    expect(
      screen.getByRole('img', { name: 'Member One photo' }),
    ).toHaveAttribute(
      'sizes',
      '(min-width: 1024px) 25vw, (min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw',
    );
  });

  it('caps the grid at 3 columns when bios are shown and the base column count is 4', () => {
    setup({ members: fourMembers, showBios: true });

    expect(
      screen.getByRole('img', { name: 'Member One photo' }),
    ).toHaveAttribute(
      'sizes',
      '(min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw',
    );
  });
});
