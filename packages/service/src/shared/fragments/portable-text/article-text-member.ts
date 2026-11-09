import type { PORTABLE_TEXT_BLOCK_TYPE } from '@blog/config';
import { q } from '@blog/service/sanity/query/query';
import { bodyImageFragment } from '@blog/service/shared/fragments/image/image';
import { textBlockFragment } from '@blog/service/shared/fragments/portable-text/text-block';

const bodyImageBlockFragment = q
  .fragmentForType<typeof PORTABLE_TEXT_BLOCK_TYPE.BODY_IMAGE>()
  .project((img) => ({
    layout: img.field('layout').nullable(true),
    ...bodyImageFragment,
  }));

const asideBlockFragment = q
  .fragmentForType<typeof PORTABLE_TEXT_BLOCK_TYPE.ASIDE>()
  .project((asideSub) => ({
    '...': true,
    body: asideSub.field('body[]').project(textBlockFragment).nullable(true),
  }));

const cookieListBlockFragment = q
  .fragmentForType<typeof PORTABLE_TEXT_BLOCK_TYPE.COOKIE_LIST>()
  .project({ _type: true });

export const articleTextMemberProjections = {
  block: textBlockFragment,
  bodyImage: bodyImageBlockFragment,
  aside: asideBlockFragment,
  cookieList: cookieListBlockFragment,
};
