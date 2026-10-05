import {
  DENSITY,
  PRESET_ID,
  PRESET_REGISTRY,
  RADIUS_SCALE,
  type TDensity,
  type TRadiusScale,
} from '@blog/config';
import { NavLink } from '@blog/ui/components/atoms/nav-link';
import { ThemeToggle } from '@blog/ui/components/atoms/theme-toggle';
import { MediaCard } from '@blog/ui/components/molecules/media-card';
import { Header } from '@blog/ui/components/organisms/header';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { buildThemeStyleBlock } from '@web/utils/build-theme-style-block';

type TRadiusAndDensityArgs = {
  radiusScale: TRadiusScale;
  density: TDensity;
};

const CONSOLE_TOKENS = PRESET_REGISTRY[PRESET_ID.CONSOLE].themeTokens;

// A plain <style> rather than ThemeScope: React keeps the first hoisted style per href, so switching stories would keep the first story's theme.
const meta = {
  title: 'Components/ThemeScope/RadiusAndDensity',
  argTypes: {
    radiusScale: { control: 'select', options: Object.values(RADIUS_SCALE) },
    density: { control: 'select', options: Object.values(DENSITY) },
  },
  args: {
    radiusScale: CONSOLE_TOKENS.radiusScale,
    density: CONSOLE_TOKENS.density,
  },
  render: ({ radiusScale, density }) => (
    <>
      <style>
        {buildThemeStyleBlock({ ...CONSOLE_TOKENS, radiusScale, density })}
      </style>
      <Header>
        <Header.Brand>My Blog</Header.Brand>
        <Header.Nav>
          <NavLink href="/" isActive={true}>
            Home
          </NavLink>
          <NavLink href="/blog">Blog</NavLink>
        </Header.Nav>
        <Header.Actions>
          <ThemeToggle isDark={false} onToggle={() => {}} />
        </Header.Actions>
      </Header>
      <div className="p-gutter max-w-sm">
        <MediaCard excerpt="Tokens, variants and the rules that keep them honest.">
          <MediaCard.Media>
            <div className="bg-brand-primary-muted size-full" />
          </MediaCard.Media>
          <MediaCard.Meta
            dateValue="2024-03-10"
            dateLabel="March 10, 2024"
            readingTime="9 min"
          />
          <MediaCard.Title level={3}>
            Building a Design System from Scratch
          </MediaCard.Title>
        </MediaCard>
      </div>
    </>
  ),
} satisfies Meta<TRadiusAndDensityArgs>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const SmallRadius: TStory = { args: { radiusScale: RADIUS_SCALE.SM } };

export const MediumRadius: TStory = { args: { radiusScale: RADIUS_SCALE.MD } };

export const LargeRadius: TStory = { args: { radiusScale: RADIUS_SCALE.LG } };

export const ExtraLargeRadius: TStory = {
  args: { radiusScale: RADIUS_SCALE.XL },
};

export const DefaultDensity: TStory = { args: { density: DENSITY.DEFAULT } };

export const CompactDensity: TStory = { args: { density: DENSITY.COMPACT } };
