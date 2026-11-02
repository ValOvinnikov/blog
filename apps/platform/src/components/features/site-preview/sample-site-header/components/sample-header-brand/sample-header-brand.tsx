import { SIZE, type TMaybeUndefined } from '@blog/config';
import { BrandMark } from '@blog/ui/components/atoms/brand-mark';

import { sampleHeaderBrandVariants } from './sample-header-brand-variants';

export type TSampleHeaderBrandProps = {
  name: string;
  logoSrc: TMaybeUndefined<string>;
  isCompact?: boolean;
  className?: string;
};

export const SampleHeaderBrand = ({
  name,
  logoSrc,
  isCompact = false,
  className,
}: TSampleHeaderBrandProps) => {
  const { root, label } = sampleHeaderBrandVariants({ isCompact });

  return (
    <div className={root({ class: className })}>
      <BrandMark size={SIZE.SM} title={name} src={logoSrc} />
      <span className={label()}>{name}</span>
    </div>
  );
};
