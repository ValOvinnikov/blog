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

export type TPageHomeModuleTypes = {
  hero: THeroKind<Page_home>;
  modules: TModuleKind<Page_home>;
};

export type TPageLandingModuleTypes = {
  hero: THeroKind<Page_landing>;
  modules: TModuleKind<Page_landing>;
};

export type TPagePostIndexModuleTypes = {
  hero: THeroKind<Page_postIndex>;
  modules: TModuleKind<Page_postIndex>;
};

/**
 * `page_post` has no `hero` field, so it has no `hero` key — reading one is
 * a compile error rather than a silently empty union.
 */
export type TPagePostModuleTypes = {
  modules: TModuleKind<Page_post>;
};

export type TPageTagModuleTypes = {
  hero: THeroKind<Page_tag>;
  modules: TModuleKind<Page_tag>;
};

export type TPageTagIndexModuleTypes = {
  hero: THeroKind<Page_tagIndex>;
  modules: TModuleKind<Page_tagIndex>;
};

export type TPageTopicModuleTypes = {
  hero: THeroKind<Page_topic>;
  modules: TModuleKind<Page_topic>;
};

export type TPageTopicIndexModuleTypes = {
  hero: THeroKind<Page_topicIndex>;
  modules: TModuleKind<Page_topicIndex>;
};
