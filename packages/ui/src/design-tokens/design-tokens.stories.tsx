import type { Meta, StoryObj } from '@storybook/react';

import { ColorSwatch } from './color-swatch';
import { FontFamilySpecimen } from './font-family-specimen';
import { RadiusSample } from './radius-sample';
import { SpacingSample } from './spacing-sample';
import { TokenSection } from './token-section';
import { TypeSpecimen } from './type-specimen';

/**
 * Browsable gallery of every design token defined in
 * `configs/tailwind/theme.css`. Each sample is driven by the real token
 * utility class (never a hardcoded hex value), so toggling the Storybook
 * light/dark toolbar updates every swatch and specimen in place.
 */
const meta = {
  title: 'Design Tokens/Overview',
  parameters: { layout: 'padded' },
} satisfies Meta;
export default meta;

type TStory = StoryObj<typeof meta>;

const surfaceColors = [
  { name: 'bg', swatchClassName: 'bg-bg', cssVar: '--color-bg' },
  {
    name: 'bg-subtle',
    swatchClassName: 'bg-bg-subtle',
    cssVar: '--color-bg-subtle',
  },
  { name: 'surface', swatchClassName: 'bg-surface', cssVar: '--color-surface' },
  {
    name: 'surface-2',
    swatchClassName: 'bg-surface-2',
    cssVar: '--color-surface-2',
  },
  { name: 'border', swatchClassName: 'bg-border', cssVar: '--color-border' },
  {
    name: 'border-strong',
    swatchClassName: 'bg-border-strong',
    cssVar: '--color-border-strong',
  },
];

const textColors = [
  { name: 'text', swatchClassName: 'bg-text', cssVar: '--color-text' },
  {
    name: 'text-muted',
    swatchClassName: 'bg-text-muted',
    cssVar: '--color-text-muted',
  },
  {
    name: 'text-subtle',
    swatchClassName: 'bg-text-subtle',
    cssVar: '--color-text-subtle',
  },
  { name: 'muted', swatchClassName: 'bg-muted', cssVar: '--color-muted' },
  { name: 'subtle', swatchClassName: 'bg-subtle', cssVar: '--color-subtle' },
];

const accentColors = [
  { name: 'accent', swatchClassName: 'bg-accent', cssVar: '--color-accent' },
  {
    name: 'accent-hover',
    swatchClassName: 'bg-accent-hover',
    cssVar: '--color-accent-hover',
  },
  {
    name: 'accent-muted',
    swatchClassName: 'bg-accent-muted',
    cssVar: '--color-accent-muted',
  },
  {
    name: 'accent-contrast',
    swatchClassName: 'bg-accent-contrast',
    cssVar: '--color-accent-contrast',
  },
  {
    name: 'accent-solid',
    swatchClassName: 'bg-accent-solid',
    cssVar: '--color-accent-solid',
  },
  {
    name: 'accent-solid-hover',
    swatchClassName: 'bg-accent-solid-hover',
    cssVar: '--color-accent-solid-hover',
  },
];

const semanticTypeSizes = [
  { name: 'display', sizeClassName: 'text-display', cssVar: '--text-display' },
  { name: 'hero', sizeClassName: 'text-hero', cssVar: '--text-hero' },
  {
    name: 'title-xl',
    sizeClassName: 'text-title-xl',
    cssVar: '--text-title-xl',
  },
  {
    name: 'title-2xl',
    sizeClassName: 'text-title-2xl',
    cssVar: '--text-title-2xl',
  },
  {
    name: 'title-3xl',
    sizeClassName: 'text-title-3xl',
    cssVar: '--text-title-3xl',
  },
  {
    name: 'post-title',
    sizeClassName: 'text-post-title',
    cssVar: '--text-post-title',
  },
  { name: 'lead', sizeClassName: 'text-lead', cssVar: '--text-lead' },
  { name: 'prose', sizeClassName: 'text-prose', cssVar: '--text-prose' },
  { name: 'copy', sizeClassName: 'text-copy', cssVar: '--text-copy' },
  {
    name: 'card-title',
    sizeClassName: 'text-card-title',
    cssVar: '--text-card-title',
  },
  {
    name: 'card-copy',
    sizeClassName: 'text-card-copy',
    cssVar: '--text-card-copy',
  },
  { name: 'caption', sizeClassName: 'text-caption', cssVar: '--text-caption' },
  { name: 'meta', sizeClassName: 'text-meta', cssVar: '--text-meta' },
  { name: 'label', sizeClassName: 'text-label', cssVar: '--text-label' },
  { name: 'code', sizeClassName: 'text-code', cssVar: '--text-code' },
];

const numericTypeScale = [
  { name: 'xs', sizeClassName: 'text-xs', cssVar: '--text-xs' },
  { name: 'sm', sizeClassName: 'text-sm', cssVar: '--text-sm' },
  { name: 'base', sizeClassName: 'text-base', cssVar: '--text-base' },
  { name: 'lg', sizeClassName: 'text-lg', cssVar: '--text-lg' },
  { name: 'xl', sizeClassName: 'text-xl', cssVar: '--text-xl' },
  { name: '2xl', sizeClassName: 'text-2xl', cssVar: '--text-2xl' },
  { name: '3xl', sizeClassName: 'text-3xl', cssVar: '--text-3xl' },
  { name: '4xl', sizeClassName: 'text-4xl', cssVar: '--text-4xl' },
];

const fontFamilies = [
  {
    name: 'body',
    fontClassName: 'font-body',
    cssVar: '--font-body',
    sample: 'The quiet fox reads by lamplight.',
  },
  {
    name: 'display',
    fontClassName: 'font-display',
    cssVar: '--font-display',
    sample: 'The quiet fox reads by lamplight.',
  },
  {
    name: 'mono',
    fontClassName: 'font-mono',
    cssVar: '--font-mono',
    sample: 'const fox = "reads";',
  },
  {
    name: 'read',
    fontClassName: 'font-read',
    cssVar: '--font-read',
    sample: 'The quiet fox reads by lamplight.',
  },
];

const radii = [
  { name: 'sm', radiusClassName: 'rounded-sm', cssVar: '--radius-sm' },
  { name: 'md', radiusClassName: 'rounded-md', cssVar: '--radius-md' },
  { name: 'lg', radiusClassName: 'rounded-lg', cssVar: '--radius-lg' },
  { name: 'xl', radiusClassName: 'rounded-xl', cssVar: '--radius-xl' },
];

const spacing = [
  {
    name: 'spacing-gutter',
    spacingClassName: 'w-gutter',
    cssVar: '--spacing-gutter',
  },
  {
    name: 'spacing-section',
    spacingClassName: 'w-section',
    cssVar: '--spacing-section',
  },
  {
    name: 'spacing-page-y',
    spacingClassName: 'w-page-y',
    cssVar: '--spacing-page-y',
  },
  {
    name: 'spacing-site-x',
    spacingClassName: 'w-site-x',
    cssVar: '--spacing-site-x',
  },
  {
    name: 'spacing-site-y',
    spacingClassName: 'w-site-y',
    cssVar: '--spacing-site-y',
  },
  {
    name: 'spacing-card-x',
    spacingClassName: 'w-card-x',
    cssVar: '--spacing-card-x',
  },
  {
    name: 'spacing-card-y',
    spacingClassName: 'w-card-y',
    cssVar: '--spacing-card-y',
  },
];

export const Overview: TStory = {
  render: () => (
    <div className="mx-auto flex max-w-page flex-col gap-10 bg-bg p-6 text-text">
      <TokenSection
        title="Color — surfaces"
        description="Background, surface, and border tokens."
      >
        {surfaceColors.map((token) => (
          <ColorSwatch key={token.name} {...token} />
        ))}
      </TokenSection>

      <TokenSection
        title="Color — text"
        description="Foreground text tokens, from primary to subtle."
      >
        {textColors.map((token) => (
          <ColorSwatch key={token.name} {...token} />
        ))}
      </TokenSection>

      <TokenSection
        title="Color — accent"
        description="Brand accent tokens for interactive and highlighted content."
      >
        {accentColors.map((token) => (
          <ColorSwatch key={token.name} {...token} />
        ))}
      </TokenSection>

      <TokenSection
        title="Typography — semantic sizes"
        description="Purpose-named type sizes used across components."
      >
        {semanticTypeSizes.map((token) => (
          <TypeSpecimen
            key={token.name}
            name={token.name}
            sizeClassName={token.sizeClassName}
            cssVar={token.cssVar}
            sample="The quiet fox reads by lamplight."
          />
        ))}
      </TokenSection>

      <TokenSection
        title="Typography — numeric scale"
        description="The underlying xs–4xl scale semantic sizes are built from."
      >
        {numericTypeScale.map((token) => (
          <TypeSpecimen
            key={token.name}
            name={token.name}
            sizeClassName={token.sizeClassName}
            cssVar={token.cssVar}
            sample="The quiet fox reads by lamplight."
          />
        ))}
      </TokenSection>

      <TokenSection
        title="Font families"
        description="Typeface stacks for body copy, display headings, and code."
      >
        {fontFamilies.map((token) => (
          <FontFamilySpecimen key={token.name} {...token} />
        ))}
      </TokenSection>

      <TokenSection title="Radius" description="Corner-radius tokens.">
        {radii.map((token) => (
          <RadiusSample key={token.name} {...token} />
        ))}
      </TokenSection>

      <TokenSection
        title="Spacing"
        description="Custom spacing tokens exposed alongside Tailwind's default scale."
      >
        {spacing.map((token) => (
          <SpacingSample key={token.name} {...token} />
        ))}
      </TokenSection>
    </div>
  ),
};
