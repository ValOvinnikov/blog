import type { TSlugParams } from '@blog/service/sanity/query';
import type { TLocaleParams } from '@blog/service/shared/localization/locale-params';

type TLocaleQueryParams = Partial<TLocaleParams>;

export type TLocalizedSlugParams = TSlugParams & TLocaleQueryParams;
