import {
  ASIDE_KIND,
  IMAGE_LAYOUT,
  type PORTABLE_TEXT_BLOCK_TYPE,
  type Code,
  type IBodyImageBlock,
  type TAsideKind,
} from '@blog/config';
import type { TPortableTextBody } from '@blog/service';
import { ImageWithCaption } from '@blog/ui/components/molecules/image-with-caption';
import { Accordion } from '@blog/ui/components/organisms/accordion';
import {
  PortableText as PortableTextRoot,
  type PortableTextReactComponents,
} from '@portabletext/react';
import { DeepAside } from '@web/components/shared/deep-aside';
import { SanityImage } from '@web/components/shared/sanity-image';

import { CodeBlock } from '../components/code-block';
import { portableTextVariants } from '../portable-text-variants';

import { FULL_BLEED_DATA_ATTR } from './full-bleed';

const s = portableTextVariants();

export type TAsideKindLabels = Partial<Record<TAsideKind, string>>;

type TResolvedAsideBlock = Extract<
  TPortableTextBody[number],
  { _type: typeof PORTABLE_TEXT_BLOCK_TYPE.ASIDE }
>;

type TResolvedExpandableSectionBlock = Extract<
  TPortableTextBody[number],
  { _type: typeof PORTABLE_TEXT_BLOCK_TYPE.EXPANDABLE_SECTION }
>;

const renderBodyImage = (block: IBodyImageBlock) => {
  if (!block.image) return null;

  const image = (
    <ImageWithCaption layout={block.layout}>
      <SanityImage
        image={block.image}
        width={1200}
        sizes="(min-width: 1024px) 800px, 100vw"
        loading="lazy"
        className={s.image()}
      />
    </ImageWithCaption>
  );

  return block.layout === IMAGE_LAYOUT.FULL_BLEED ? (
    <div {...{ [FULL_BLEED_DATA_ATTR]: '' }}>{image}</div>
  ) : (
    image
  );
};

export const bodyImageTypeComponent = ({ value }: { value: IBodyImageBlock }) =>
  renderBodyImage(value);

export const codeTypeComponent = ({ value }: { value: Code }) => (
  <CodeBlock
    code={value.code ?? ''}
    language={value.language}
    filename={value.filename}
    highlightedLines={value.highlightedLines}
  />
);

export const makeAsideTypeComponent = (
  baseComponents: PortableTextReactComponents,
  asideKindLabels?: TAsideKindLabels,
) => {
  const AsideType = ({ value }: { value: TResolvedAsideBlock }) => {
    const kind = value.kind ?? ASIDE_KIND.CONTEXT;
    const label = asideKindLabels?.[kind] ?? kind;

    return (
      <DeepAside kind={kind} label={label}>
        <PortableTextRoot
          value={value.body ?? []}
          components={baseComponents}
        />
      </DeepAside>
    );
  };

  return AsideType;
};

export const makeExpandableSectionTypeComponent = (
  baseComponents: PortableTextReactComponents,
) => {
  const ExpandableSectionType = ({
    value,
  }: {
    value: TResolvedExpandableSectionBlock;
  }) => (
    <Accordion>
      <Accordion.Item>
        <Accordion.Trigger>{value.title}</Accordion.Trigger>
        <Accordion.Panel>
          <PortableTextRoot
            value={value.body ?? []}
            components={baseComponents}
          />
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  );

  return ExpandableSectionType;
};
