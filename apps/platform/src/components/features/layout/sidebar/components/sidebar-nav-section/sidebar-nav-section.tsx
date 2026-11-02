import { hasArrayGotItems } from '@blog/utils/primitives';
import {
  SidebarNavItem,
  type TSidebarNavItem,
} from '@platform/components/features/layout/sidebar/components/sidebar-nav-item';
import { sidebarVariants } from '@platform/components/features/layout/sidebar/sidebar-variants';

export type TSidebarNavSection = {
  label: string;
  items: TSidebarNavItem[];
  note?: string;
};

export type TSidebarNavSectionProps = {
  section: TSidebarNavSection;
};

export const SidebarNavSection = ({ section }: TSidebarNavSectionProps) => {
  const { label, items, note } = section;
  const {
    section: root,
    sectionLabel,
    list,
    note: noteText,
  } = sidebarVariants();

  return (
    <div className={root()}>
      <p className={sectionLabel()} title={label}>
        {label}
      </p>
      {hasArrayGotItems(items) ? (
        <nav aria-label={label}>
          <ul className={list()}>
            {items.map((item) => (
              <SidebarNavItem key={item.label} item={item} />
            ))}
          </ul>
        </nav>
      ) : (
        note && <p className={noteText()}>{note}</p>
      )}
    </div>
  );
};
