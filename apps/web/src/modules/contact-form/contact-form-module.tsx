import { CAPABILITY } from '@blog/config';
import { service } from '@blog/service';
import { routing } from '@web/i18n/routing';
import type { TModuleComponentProps } from '@web/modules/module-renderer';
import {
  submitContactMessage,
  type TContactMessageInput,
} from '@web/server/contact-form/contact-form-actions/contact-form-actions';
import { getRequestContext } from '@web/server/request-context/request-context';
import { isCapabilityEnabled } from '@web/server/settings-features/is-capability-enabled/is-capability-enabled';
import { UNRESOLVED_TENANT_PLACEHOLDER } from '@web/server/tenant/constants/constants';
import { resolveRequestTenant } from '@web/server/tenant/request-tenant/request-tenant';
import { isTenantActive } from '@web/server/tenant/write-gate/write-gate';
import { logger } from '@web/utils/logger/logger';

import { ContactFormModuleView } from './contact-form-module-view';

export type TContactFormModuleProps = TModuleComponentProps;

export const ContactFormModule = async ({
  id,
  context,
}: TContactFormModuleProps) => {
  const {
    tenantId,
    sanityContext,
    locale,
    defaultLocale = routing.defaultLocale,
  } = await getRequestContext();
  const [isEnabled, tenant] = await Promise.all([
    isCapabilityEnabled(CAPABILITY.CONTACT_FORM),
    resolveRequestTenant(tenantId ?? UNRESOLVED_TENANT_PLACEHOLDER),
  ]);
  if (!isEnabled || !tenant || !isTenantActive(tenant)) return null;

  const result = await service.modules.contactForm.v1.getContactForm(
    id,
    sanityContext,
  );

  if (!result.ok) {
    logger.error('contact_form_module.fetch_failed', {
      id,
      error: result.error,
    });
    return null;
  }

  const sourceDocumentId = context?.landingPage?.id ?? context?.homePage?.id;
  const submitMessage = async (input: TContactMessageInput) => {
    'use server';
    return submitContactMessage(input, {
      sourceDocumentId,
      sourceLocale: locale,
    });
  };

  return (
    <ContactFormModuleView
      id={id}
      currentLocale={locale}
      defaultLocale={defaultLocale}
      submitMessage={submitMessage}
      {...result.data}
    />
  );
};
