import type {
  TCapability,
  TLocaleIsoCode,
  TModulePack,
  TSanityLoginProvider,
} from '@shinefold/config/constants';

type TStudioEntitlements = {
  modulePacks?: readonly TModulePack[];
};

export type TBuildStudioConfigParams = {
  projectId: string;
  dataset: string;
  basePath?: string;
  title: string;
  enabledCapabilities?: readonly TCapability[];
  entitlements?: TStudioEntitlements;
  canLinkPlatformPlans?: boolean;
  defaultLocale?: TLocaleIsoCode;
  liveLocales?: readonly TLocaleIsoCode[];
  loginProvider?: TSanityLoginProvider;
  previewBasePath?: string;
};
