import type {
  internalGroqTypeReferenceTo,
  Page_home,
  Page_landing,
  Page_post,
  Page_postIndex,
  Page_tag,
  Page_tagIndex,
  Page_topic,
  Page_topicIndex,
} from '@blog/config/sanity/generated/types';

/**
 * The `_type` a reference union member points at, read off typegen's
 * `internalGroqTypeReferenceTo` marker — distributes over a union so each
 * member resolves to its own referenced type.
 */
type TReferencedType<TReference> = TReference extends {
  [internalGroqTypeReferenceTo]?: infer TName;
}
  ? NonNullable<TName>
  : never;

type THeroKind<TPage extends { hero?: unknown }> = TReferencedType<
  NonNullable<TPage['hero']>
>;

type TModuleKind<TPage extends { modules?: readonly unknown[] }> =
  TReferencedType<NonNullable<TPage['modules']>[number]>;

export type TPageHomeModuleType = THeroKind<Page_home> | TModuleKind<Page_home>;

export type TPageLandingModuleType =
  THeroKind<Page_landing> | TModuleKind<Page_landing>;

export type TPagePostIndexModuleType =
  THeroKind<Page_postIndex> | TModuleKind<Page_postIndex>;

/**
 * `page_post` has no `hero` field, so this comes from `modules[]` alone.
 */
export type TPagePostModuleType = TModuleKind<Page_post>;

export type TPageTagModuleType = THeroKind<Page_tag> | TModuleKind<Page_tag>;

export type TPageTagIndexModuleType =
  THeroKind<Page_tagIndex> | TModuleKind<Page_tagIndex>;

export type TPageTopicModuleType =
  THeroKind<Page_topic> | TModuleKind<Page_topic>;

export type TPageTopicIndexModuleType =
  THeroKind<Page_topicIndex> | TModuleKind<Page_topicIndex>;
