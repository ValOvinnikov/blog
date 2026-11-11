import type { ReactNode } from 'react';

type TOptionBodyIds = { labelId: string; descriptionId: string };

type TOptionBodyClassNames = {
  label: string;
  description: string;
  glyph: string;
};

type TOptionBodyProps = {
  ids: TOptionBodyIds;
  label: string;
  description?: string;
  glyph?: ReactNode;
  classNames: TOptionBodyClassNames;
};

export const optionBodyIds = (
  idPrefix: string,
  value: string,
): TOptionBodyIds => ({
  labelId: `${idPrefix}-${value}-label`,
  descriptionId: `${idPrefix}-${value}-description`,
});

export const OptionBody = ({
  ids: { labelId, descriptionId },
  label,
  description,
  glyph,
  classNames,
}: TOptionBodyProps) => (
  <>
    {glyph && (
      <span aria-hidden={true} className={classNames.glyph}>
        {glyph}
      </span>
    )}
    <span id={labelId} className={classNames.label}>
      {label}
    </span>
    {description && (
      <span id={descriptionId} className={classNames.description}>
        {description}
      </span>
    )}
  </>
);
