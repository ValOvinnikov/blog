import type { TPostListModule } from '@blog/service';
import { PostsSection, type IPostCardData } from '@blog/ui/organisms';
import { Section } from '@web/components/shared/section';
import { SmartLink } from '@web/components/shared/smart-link';

export interface IPostListModuleViewProps extends Omit<
  TPostListModule,
  'posts'
> {
  id: string;
  items: IPostCardData[];
}

/**
 * Pure view for `PostListModule` — the `Section` full-bleed landmark around
 * the `PostsSection` organism, with card title links composed via
 * `SmartLink`. `items` is always non-empty here — the wrapper's
 * content-validity guard skips rendering this view entirely when no posts
 * resolve.
 */
export const PostListModuleView = ({
  id,
  brandVariant,
  sectionHeader,
  items,
  layout,
}: IPostListModuleViewProps) => {
  const titleId = `latest-posts-${id}`;

  return (
    <Section
      brandVariant={brandVariant}
      layout={layout}
      titleId={titleId}
      dataTestId={`post-list-module-${id}`}
    >
      <PostsSection
        posts={items}
        title={sectionHeader.heading ?? 'Latest posts'}
        titleId={titleId}
        supportingText={sectionHeader.supportingText}
        align={sectionHeader.align}
        linkAs={SmartLink}
        isWrapped={true}
      />
    </Section>
  );
};
