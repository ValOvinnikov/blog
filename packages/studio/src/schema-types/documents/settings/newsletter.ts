import { newsletterContentFields } from '@blog/studio/schema-types/helpers/newsletter-content-fields';
import { titleField } from '@blog/studio/schema-types/helpers/title-field';
import { Mail } from 'lucide-react';
import { defineField, defineType } from 'sanity';

/**
 * Site-wide newsletter copy — the CMS-authored source of the newsletter
 * signup's heading/description wherever it's rendered (the Blog page's
 * `module_newsletter` full variant and the per-post compact variant on post
 * pages), the signup form's own strings, and the confirm/unsubscribe
 * landing-page copy. Fields mirror `module_newsletter` (`../../modules/module-newsletter.ts`).
 */
export const newsletterSettingsSchema = defineType({
  name: 'settings_newsletter',
  title: 'Newsletter',
  type: 'document',
  icon: Mail,
  preview: {
    select: { title: 'title' },
    prepare: ({ title }) => ({
      title: title ?? 'Unknown',
      subtitle: 'Newsletter settings',
    }),
  },
  fieldsets: [
    {
      name: 'formCopy',
      title: 'Form Copy',
      description: 'Strings shown on the newsletter signup form.',
      options: { collapsible: true, collapsed: true },
    },
    {
      name: 'landingPages',
      title: 'Landing Pages',
      description: 'Copy for the confirm and unsubscribe landing pages.',
      options: { collapsible: true, collapsed: true },
    },
  ],
  fields: [
    titleField(),
    ...newsletterContentFields(),
    defineField({
      name: 'submitLabel',
      title: 'Submit Label',
      type: 'string',
      fieldset: 'formCopy',
      initialValue: 'Subscribe',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'emailPlaceholder',
      title: 'Email Placeholder',
      type: 'string',
      fieldset: 'formCopy',
      initialValue: 'you@example.com',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'successMessage',
      title: 'Success Message',
      type: 'string',
      fieldset: 'formCopy',
      initialValue: 'Almost there — check your inbox to confirm.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'errorInvalid',
      title: 'Error — Invalid Email',
      type: 'string',
      fieldset: 'formCopy',
      initialValue: 'Enter a valid email address.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'errorAlreadySubscribed',
      title: 'Error — Already Subscribed',
      type: 'string',
      fieldset: 'formCopy',
      initialValue: 'That email is already subscribed.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'errorServer',
      title: 'Error — Server',
      type: 'string',
      fieldset: 'formCopy',
      initialValue: 'Something went wrong. Please try again.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'trustCues',
      title: 'Trust Cues',
      type: 'array',
      description: 'Short reassurances shown under the form (max 2).',
      of: [{ type: 'string' }],
      fieldset: 'formCopy',
      initialValue: ['No spam', 'Unsubscribe anytime'],
      validation: (rule) => rule.required().max(2),
    }),
    defineField({
      name: 'confirm',
      title: 'Confirm Page',
      type: 'object',
      fieldset: 'landingPages',
      fields: [
        defineField({
          name: 'confirmedTitle',
          title: 'Confirmed Title',
          type: 'string',
          initialValue: 'Subscription confirmed',
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: 'confirmedMessage',
          title: 'Confirmed Message',
          type: 'string',
          initialValue:
            'Your subscription is confirmed. Thanks for signing up!',
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: 'invalidTitle',
          title: 'Invalid Title',
          type: 'string',
          initialValue: 'Invalid confirmation link',
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: 'invalidMessage',
          title: 'Invalid Message',
          type: 'string',
          initialValue: 'This confirmation link is invalid or has expired.',
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: 'errorTitle',
          title: 'Error Title',
          type: 'string',
          initialValue: 'Something went wrong',
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: 'errorMessage',
          title: 'Error Message',
          type: 'string',
          initialValue:
            "We couldn't confirm your subscription. Please try again later.",
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: 'returnHome',
          title: 'Return Home',
          type: 'string',
          initialValue: 'Return home',
          validation: (rule) => rule.required(),
        }),
      ],
    }),
    defineField({
      name: 'unsubscribe',
      title: 'Unsubscribe Page',
      type: 'object',
      fieldset: 'landingPages',
      fields: [
        defineField({
          name: 'confirmTitle',
          title: 'Confirm Title',
          type: 'string',
          initialValue: 'Unsubscribe from our newsletter',
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: 'confirmMessage',
          title: 'Confirm Message',
          type: 'string',
          initialValue:
            'Click the button below to confirm you no longer want to receive newsletter emails from us.',
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: 'confirmButtonLabel',
          title: 'Confirm Button Label',
          type: 'string',
          initialValue: 'Confirm unsubscribe',
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: 'successTitle',
          title: 'Success Title',
          type: 'string',
          initialValue: "You're unsubscribed",
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: 'successMessage',
          title: 'Success Message',
          type: 'string',
          initialValue: 'You will no longer receive newsletter emails from us.',
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: 'invalidTitle',
          title: 'Invalid Title',
          type: 'string',
          initialValue: 'Link no longer valid',
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: 'invalidMessage',
          title: 'Invalid Message',
          type: 'string',
          initialValue:
            'This unsubscribe link is no longer valid — you may already be unsubscribed.',
          validation: (rule) => rule.required(),
        }),
        defineField({
          name: 'returnHome',
          title: 'Return Home',
          type: 'string',
          initialValue: 'Return home',
          validation: (rule) => rule.required(),
        }),
      ],
    }),
  ],
});
