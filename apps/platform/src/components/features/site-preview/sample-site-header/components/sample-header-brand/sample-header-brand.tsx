import { SIZE, type TMaybeUndefined } from '@blog/config';
import { BrandMark } from '@blog/ui/components/atoms/brand-mark';
import { SAMPLE_PART } from '@platform/constants/sample-part';

import { sampleHeaderBrandVariants } from './sample-header-brand-variants';

export type TSampleHeaderBrandProps = {
  name: string;
  logoSrc: TMaybeUndefined<string>;
  isCompact?: boolean;
  isLarge?: boolean;
};

export const SampleHeaderBrand = ({
  name,
  logoSrc,
  isCompact = false,
  isLarge = false,
}: TSampleHeaderBrandProps) => {
  const { root, mark, label } = sampleHeaderBrandVariants({
    isCompact,
    isLarge,
  });

  return (
    <div className={root()} data-part={SAMPLE_PART.BRAND}>
      <BrandMark size={SIZE.SM} title={name} src={logoSrc} className={mark()} />
      <span className={label()}>{name}</span>
    </div>
  );
};
