import { BRAND_VARIANT, CARD_IMAGE_SHAPE } from '@blog/config';
import { Carousel } from '@blog/ui/components/organisms/carousel';
import {
  customRender,
  renderElement,
  screen,
} from '@web/testing/custom-render';
import { makeTeamMember } from '@web/testing/modules/team/fixtures';
import { SmartLinkMock } from '@web/testing/shared/smart-link/smart-link-mock';

import { TeamCarousel } from './team-carousel';

vi.mock('@web/components/shared/smart-link', () => ({
  SmartLink: SmartLinkMock,
}));

vi.mock('@blog/ui/components/organisms/carousel', () => ({
  Carousel: vi.fn(() => null),
}));

const members = [
  makeTeamMember({ id: 'team-member-1', name: 'Jordan Reyes' }),
  makeTeamMember({ id: 'team-member-2', name: 'Casey Morgan' }),
];

const setup = customRender(TeamCarousel, {
  members,
  imageShape: CARD_IMAGE_SHAPE.CIRCLE,
  align: 'left',
  imageSizes: '100vw',
  title: 'Meet the team',
  tone: BRAND_VARIANT.PRIMARY,
});

const getCarouselProps = () => {
  const props = vi.mocked(Carousel).mock.calls.at(-1)?.[0];
  if (!props) {
    throw new Error('Carousel was not called');
  }
  return props;
};

describe(`<${TeamCarousel.name}/>`, () => {
  beforeEach(() => {
    setup();
  });

  it('composes the region label from the carousel.regionLabel Voice key rather than passing the title straight through, with the Voice-fixed previous/next labels', () => {
    expect(getCarouselProps()).toMatchObject({
      ariaLabel: 'Meet the team carousel',
      previousLabel: 'Previous slide',
      nextLabel: 'Next slide',
    });
  });

  it('renderItem renders exactly one TeamMemberCard per member', () => {
    const { renderItem } = getCarouselProps();

    members.forEach((member, index) => {
      const { unmount } = renderElement(
        <>{renderItem({ item: member, index })}</>,
      );

      expect(
        screen.getByRole('heading', { level: 3, name: member.name }),
      ).toBeVisible();

      unmount();
    });
  });

  it('getItemKey returns the member id', () => {
    const { getItemKey } = getCarouselProps();

    members.forEach((member, index) => {
      expect(getItemKey?.({ item: member, index })).toBe(member.id);
    });
  });
});
