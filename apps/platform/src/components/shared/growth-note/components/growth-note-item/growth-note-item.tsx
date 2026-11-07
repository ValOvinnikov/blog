import { growthNoteItemVariants } from './growth-note-item-variants';

export type TGrowthNoteItem = {
  id: string;
  label: string;
  description?: string;
  link?: { href: string; onSelect: () => void };
};

export type TGrowthNoteItemProps = {
  item: TGrowthNoteItem;
};

export const GrowthNoteItem = ({
  item: { label, description, link },
}: TGrowthNoteItemProps) => {
  const {
    plain,
    link: linkSlot,
    name,
    description: descriptionSlot,
  } = growthNoteItemVariants();

  return (
    <li>
      {link ? (
        <a
          href={link.href}
          onClick={(event) => {
            event.preventDefault();
            link.onSelect();
          }}
          className={linkSlot()}
        >
          <span className={name()}>{label}</span>
          {description && (
            <span className={descriptionSlot()}>{description}</span>
          )}
        </a>
      ) : (
        <span className={plain()}>{label}</span>
      )}
    </li>
  );
};
