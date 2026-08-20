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
  titleFallback: string;
}

/**
 * `items` is always non-empty here — the wrapper's content-validity guard
 * skips rendering this view entirely when no posts resolve.
 * `sectionHeader.heading` is optional; when absent, `PostsSection` renders a
 * visually hidden `<h2>` from `titleFallback`, keeping the landmark and
 * heading outline intact.
 */
export const PostListModuleView = ({
  id,
  brandVariant,
  sectionHeader,
  items,
  layout,
  titleFallback,
}: IPostListModuleViewProps) => {
  const { heading, supportingText, align } = sectionHeader;
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
        title={heading}
        titleId={titleId}
        titleFallback={titleFallback}
        supportingText={supportingText}
        align={align}
        linkAs={SmartLink}
        isWrapped={true}
      />
    </Section>
  );
};
