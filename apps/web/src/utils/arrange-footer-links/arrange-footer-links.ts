import { FOOTER_FINE_PRINT_KIND, type ILink } from '@blog/config';
import type { TFooter } from '@blog/service';
import { hasArrayGotItems } from '@blog/utils/primitives';

type TFooterFinePrintItem = TFooter['finePrint'][number];

type TArrangedFooterLinks = {
  groups: { heading: string; links: ILink[] }[];
  finePrint: TFooterFinePrintItem[];
};

const COOKIE_SETTINGS_ITEM: TFooterFinePrintItem = {
  kind: FOOTER_FINE_PRINT_KIND.COOKIE_SETTINGS,
};

/** Drops every link whose href an earlier group or fine-print link already carries, and keeps Cookie settings in the fine print exactly once. */
export const arrangeFooterLinks = ({
  groups,
  finePrint,
}: Pick<TFooter, 'groups' | 'finePrint'>): TArrangedFooterLinks => {
  const seenHrefs = new Set<string>();
  let hasCookieSettings = false;

  const isFirstSighting = ({ href }: ILink) => {
    const isFirst = !seenHrefs.has(href);
    seenHrefs.add(href);
    return isFirst;
  };

  const isFirstItem = (item: TFooterFinePrintItem) => {
    if (item.kind === FOOTER_FINE_PRINT_KIND.LINK) {
      return isFirstSighting(item.link);
    }
    const isFirst = !hasCookieSettings;
    hasCookieSettings = true;
    return isFirst;
  };

  const arrangedGroups = groups.flatMap(({ heading, links }) => {
    if (!heading) {
      return [];
    }
    const uniqueLinks = links.filter(isFirstSighting);
    return hasArrayGotItems(uniqueLinks)
      ? [{ heading, links: uniqueLinks }]
      : [];
  });
  const arrangedFinePrint = finePrint.filter(isFirstItem);

  return {
    groups: arrangedGroups,
    finePrint: hasCookieSettings
      ? arrangedFinePrint
      : [...arrangedFinePrint, COOKIE_SETTINGS_ITEM],
  };
};
