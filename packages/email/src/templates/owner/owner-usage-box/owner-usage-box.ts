import {
  EMAIL_USAGE_LEVEL,
  type TEmailUsageLevel,
} from '@shinefold/config/constants';
import { renderEmailStack } from '@shinefold/email/html/email-document/email-document';
import { escapeHtml } from '@shinefold/email/html/escape-html/escape-html';
import { PLATFORM_EMAIL_BRAND } from '@shinefold/email/html/platform-email-brand/platform-email-brand';
import {
  OWNER_BAD_CLASS,
  OWNER_BAD_FILL_CLASS,
  OWNER_BOX_CLASS,
  OWNER_MUTED_CLASS,
  OWNER_MUTED_FILL_CLASS,
  OWNER_TEXT_CLASS,
  OWNER_TRACK_CLASS,
  OWNER_WARN_CLASS,
  OWNER_WARN_FILL_CLASS,
} from '@shinefold/email/templates/owner/owner-limit-email-frame/owner-limit-email-frame';

export type TOwnerUsageRow = {
  label: string;
  value: string;
  used: number;
  limit: number;
  level: TEmailUsageLevel;
  hasBar?: boolean;
};

const PERCENT = 100;
const BAR_HEIGHT_PX = 8;
const ROW_GAP_PX = 10;

const LEVEL_STYLE = {
  [EMAIL_USAGE_LEVEL.NORMAL]: {
    color: PLATFORM_EMAIL_BRAND.textMuted,
    weight: 400,
    textClass: OWNER_MUTED_CLASS,
    fillClass: OWNER_MUTED_FILL_CLASS,
  },
  [EMAIL_USAGE_LEVEL.NEAR]: {
    color: PLATFORM_EMAIL_BRAND.warn,
    weight: 600,
    textClass: OWNER_WARN_CLASS,
    fillClass: OWNER_WARN_FILL_CLASS,
  },
  [EMAIL_USAGE_LEVEL.OVER]: {
    color: PLATFORM_EMAIL_BRAND.bad,
    weight: 600,
    textClass: OWNER_BAD_CLASS,
    fillClass: OWNER_BAD_FILL_CLASS,
  },
} satisfies Record<TEmailUsageLevel, unknown>;

function toFillPercent(used: number, limit: number): number {
  if (limit <= 0) return PERCENT;
  return Math.min(PERCENT, Math.round((used / limit) * PERCENT));
}

function renderBar({ used, limit, level }: TOwnerUsageRow): string {
  const { color, fillClass } = LEVEL_STYLE[level];
  const fillPercent = toFillPercent(used, limit);
  const { border } = PLATFORM_EMAIL_BRAND;

  // Each cell carries a height and a line-height of 0 so clients don't pad the empty bar to a text line.
  return [
    `<table role="presentation" class="${OWNER_TRACK_CLASS}" width="100%" cellpadding="0" cellspacing="0" bgcolor="${border}" style="border-collapse:separate;background-color:${border};border-radius:99px;">`,
    `<tr><td height="${BAR_HEIGHT_PX}" style="height:${BAR_HEIGHT_PX}px;line-height:0;font-size:0;">`,
    `<table role="presentation" class="${fillClass}" width="${fillPercent}%" cellpadding="0" cellspacing="0" bgcolor="${color}" style="background-color:${color};border-radius:99px 0 0 99px;">`,
    `<tr><td height="${BAR_HEIGHT_PX}" style="height:${BAR_HEIGHT_PX}px;line-height:0;font-size:0;">&nbsp;</td></tr>`,
    '</table>',
    '</td></tr>',
    '</table>',
  ].join('');
}

function renderRow(row: TOwnerUsageRow): string {
  const { label, value, level } = row;
  const { color, weight, textClass } = LEVEL_STYLE[level];
  const line = [
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>',
    `<td class="${OWNER_TEXT_CLASS}" style="font-size:14px;font-weight:600;color:${PLATFORM_EMAIL_BRAND.text};">${escapeHtml(label)}</td>`,
    `<td class="${textClass}" align="right" style="font-size:14px;font-weight:${weight};color:${color};">${escapeHtml(value)}</td>`,
    '</tr></table>',
  ].join('');

  return row.hasBar
    ? renderEmailStack([line, renderBar(row)], ROW_GAP_PX)
    : line;
}

export function renderOwnerUsageBox(rows: TOwnerUsageRow[]): string {
  const { surfaceHead } = PLATFORM_EMAIL_BRAND;

  return [
    `<table role="presentation" class="${OWNER_BOX_CLASS}" width="100%" cellpadding="0" cellspacing="0" bgcolor="${surfaceHead}" style="border-collapse:separate;background-color:${surfaceHead};border-radius:10px;">`,
    `<tr><td style="padding:16px;">${renderEmailStack(rows.map(renderRow), ROW_GAP_PX)}</td></tr>`,
    '</table>',
  ].join('');
}

export function usageRowsAsPlainText(rows: TOwnerUsageRow[]): string {
  return rows.map(({ label, value }) => `${label}: ${value}`).join('\n');
}
