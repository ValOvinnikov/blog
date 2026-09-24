'use client';

import { DEPTH, type TDepth } from '@blog/config';
import {
  SegmentedControl,
  type ISegmentedControlOption,
} from '@blog/ui/components/atoms/segmented-control';
import { useDepth } from '@web/context/depth-provider';
import { useTranslations } from 'next-intl';

export interface IDepthToggleProps {
  hasSkim: boolean;
  hasDeep: boolean;
  className?: string;
}

export const DepthToggle = ({
  hasSkim,
  hasDeep,
  className,
}: IDepthToggleProps) => {
  const { depth, setDepth } = useDepth();
  const t = useTranslations('blogPostPage');

  if (!hasSkim && !hasDeep) return null;

  const options: ISegmentedControlOption<TDepth>[] = [
    ...(hasSkim ? [{ value: DEPTH.SKIM, label: t('depthToggle.skim') }] : []),
    { value: DEPTH.READ, label: t('depthToggle.read') },
    ...(hasDeep ? [{ value: DEPTH.DEEP, label: t('depthToggle.deep') }] : []),
  ];

  return (
    <SegmentedControl
      options={options}
      value={depth}
      onChange={setDepth}
      ariaLabel={t('depthToggle.ariaLabel')}
      className={className}
    />
  );
};
