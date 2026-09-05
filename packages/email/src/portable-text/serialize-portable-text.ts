import { escapeHtml } from '@blog/email/html/escape-html';

import type {
  TPortableTextBlock,
  TPortableTextContent,
  TPortableTextMarkDef,
  TPortableTextNode,
  TPortableTextSpan,
} from './types';

const HEADING_FONT_SIZE: Record<string, string> = {
  h1: '24px',
  h2: '20px',
  h3: '18px',
  h4: '16px',
  h5: '15px',
  h6: '14px',
};

type TRenderUnit =
  | { kind: 'list-item'; listType: 'bullet' | 'number'; html: string }
  | { kind: 'html'; html: string };

/**
 * Converts an editable Portable Text body into inline-styled, escaped email
 * HTML. Supports only paragraph, heading, emphasis, link and list blocks —
 * every other block type or block style is dropped rather than passed
 * through, so an editor capability added later renders as nothing instead of
 * unstyled or unsafe markup.
 */
export function serializePortableText(content: TPortableTextContent): string {
  if (!content || content.length === 0) {
    return '';
  }

  const units: TRenderUnit[] = [];
  for (const node of content) {
    const unit = renderNode(node);
    if (unit) {
      units.push(unit);
    }
  }

  return joinUnits(units);
}

function renderNode(node: TPortableTextNode): TRenderUnit | null {
  if (!isBlock(node)) {
    return null;
  }

  const innerHtml = renderChildren(node);

  if (node.listItem === 'bullet' || node.listItem === 'number') {
    return {
      kind: 'list-item',
      listType: node.listItem,
      html: `<li style="margin:0 0 8px;">${innerHtml}</li>`,
    };
  }

  const style = node.style ?? 'normal';

  if (style === 'normal') {
    return {
      kind: 'html',
      html: `<p style="margin:0 0 16px;">${innerHtml}</p>`,
    };
  }

  const headingFontSize = HEADING_FONT_SIZE[style];
  if (headingFontSize) {
    return {
      kind: 'html',
      html: `<${style} style="margin:0 0 12px;font-size:${headingFontSize};font-weight:700;">${innerHtml}</${style}>`,
    };
  }

  return null;
}

function isBlock(node: TPortableTextNode): node is TPortableTextBlock {
  return node._type === 'block';
}

function renderChildren(block: TPortableTextBlock): string {
  const children = block.children ?? [];
  const markDefs = block.markDefs ?? [];

  return children.map((span) => renderSpan(span, markDefs)).join('');
}

function renderSpan(
  span: TPortableTextSpan,
  markDefs: TPortableTextMarkDef[],
): string {
  if (span._type !== undefined && span._type !== 'span') {
    return '';
  }

  let html = escapeHtml(span.text ?? '');
  const marks = span.marks ?? [];

  if (marks.includes('strong')) {
    html = `<strong>${html}</strong>`;
  }
  if (marks.includes('em')) {
    html = `<em>${html}</em>`;
  }

  const linkMarkDef = markDefs.find(
    (def) => def._type === 'link' && marks.includes(def._key),
  );
  if (linkMarkDef) {
    const href = escapeHtml(linkMarkDef.href ?? '');
    html = `<a href="${href}" style="color:inherit;text-decoration:underline;">${html}</a>`;
  }

  return html;
}

function joinUnits(units: TRenderUnit[]): string {
  const parts: string[] = [];
  let currentListType: 'bullet' | 'number' | null = null;
  let currentListItems: string[] = [];

  function flushList(): void {
    if (currentListType && currentListItems.length > 0) {
      const tag = currentListType === 'bullet' ? 'ul' : 'ol';
      parts.push(
        `<${tag} style="margin:0 0 16px;padding-left:20px;">${currentListItems.join('')}</${tag}>`,
      );
    }
    currentListType = null;
    currentListItems = [];
  }

  for (const unit of units) {
    if (unit.kind === 'list-item') {
      if (currentListType !== unit.listType) {
        flushList();
        currentListType = unit.listType;
      }
      currentListItems.push(unit.html);
    } else {
      flushList();
      parts.push(unit.html);
    }
  }
  flushList();

  return parts.join('');
}
