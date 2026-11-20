import type {
  internalGroqTypeReferenceTo,
  Page_post,
  Template_home,
  Template_landing,
  Template_postIndex,
  Template_tag,
  Template_tagIndex,
  Template_topic,
  Template_topicIndex,
} from '@shinefold/config/sanity/generated/types';

type TReferencedType<TReference> = TReference extends {
  [internalGroqTypeReferenceTo]?: infer TName;
}
  ? NonNullable<TName>
  : never;

type THeroKind<TPage extends { hero?: unknown }> = TReferencedType<
  NonNullable<TPage['hero']>
>;

export type TModuleKind<TPage extends { modules?: readonly unknown[] }> =
  TReferencedType<NonNullable<TPage['modules']>[number]>;

export type TPageHomeType =
  THeroKind<Template_home> | TModuleKind<Template_home>;

export type TPageLandingType =
  THeroKind<Template_landing> | TModuleKind<Template_landing>;

export type TPagePostIndexType =
  THeroKind<Template_postIndex> | TModuleKind<Template_postIndex>;

export type TPagePostType = TModuleKind<Page_post>;

export type TPageTagType = THeroKind<Template_tag> | TModuleKind<Template_tag>;

export type TPageTagIndexType =
  THeroKind<Template_tagIndex> | TModuleKind<Template_tagIndex>;

export type TPageTopicType =
  THeroKind<Template_topic> | TModuleKind<Template_topic>;

export type TPageTopicIndexType =
  THeroKind<Template_topicIndex> | TModuleKind<Template_topicIndex>;
