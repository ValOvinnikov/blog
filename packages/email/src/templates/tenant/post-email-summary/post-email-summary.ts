import type { TPostSummary, TTenantEmailBrand } from '@shinefold/config';
import { escapeHtml } from '@shinefold/email/html/escape-html/escape-html';
import { serializePortableText } from '@shinefold/email/portable-text';
import {
  POST_ACCENT_CLASS,
  POST_BOX_CLASS,
  POST_TEXT_CLASS,
} from '@shinefold/email/templates/tenant/post-email-frame/post-email-frame';
import { hasBlockText, toBlockText } from '@shinefold/utils/portable-text';

type TSummaryBlock = TPostSummary[number];
type TSummaryGroup = {
  listItem: TSummaryBlock['listItem'];
  blocks: TSummaryBlock[];
};

function toGroups(summary: TPostSummary): TSummaryGroup[] {
  return summary.reduce<TSummaryGroup[]>((groups, block) => {
    const last = groups.at(-1);
    if (last && block.listItem && last.listItem === block.listItem) {
      last.blocks.push(block);
      return groups;
    }
    return [...groups, { listItem: block.listItem, blocks: [block] }];
  }, []);
}

export function renderPostEmailSummary(
  summary: TPostSummary,
  heading: string,
  brand: TTenantEmailBrand,
): string {
  if (!hasBlockText(summary)) return '';

  return [
    `<table role="presentation" class="${POST_BOX_CLASS}" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;border:1px solid ${brand.border};border-radius:10px;">`,
    '<tr><td style="padding:16px 18px;">',
    `<h2 class="${POST_ACCENT_CLASS}" style="margin:0 0 10px;font-size:12px;font-weight:600;line-height:1.4;letter-spacing:0.08em;text-transform:uppercase;color:${brand.brandPrimary};">${escapeHtml(heading)}</h2>`,
    `<div class="${POST_TEXT_CLASS}" style="font-size:15px;line-height:1.5;color:${brand.text};">${serializePortableText(summary)}</div>`,
    '</td></tr>',
    '</table>',
  ].join('');
}

function toPlainTextGroup({ listItem, blocks }: TSummaryGroup): string {
  return blocks
    .map((block, index) => {
      const text = toBlockText(block);
      if (listItem === 'bullet') return `- ${text}`;
      if (listItem === 'number') return `${String(index + 1)}. ${text}`;
      return text;
    })
    .join('\n');
}

export function postEmailSummaryAsPlainText(
  summary: TPostSummary,
  heading: string,
): string[] {
  if (!hasBlockText(summary)) return [];

  return [heading, ...toGroups(summary).map(toPlainTextGroup)];
}
