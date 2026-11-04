type TOptionBodyIds = { labelId: string; descriptionId: string };

type TOptionBodyProps = {
  ids: TOptionBodyIds;
  label: string;
  description: string;
  labelClassName: string;
  descriptionClassName: string;
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
  labelClassName,
  descriptionClassName,
}: TOptionBodyProps) => (
  <>
    <span id={labelId} className={labelClassName}>
      {label}
    </span>
    <span id={descriptionId} className={descriptionClassName}>
      {description}
    </span>
  </>
);
