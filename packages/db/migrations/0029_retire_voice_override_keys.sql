-- Custom SQL migration file, put your code below! --
-- voiceOverrides is a single jsonb column keyed by override name, not a
-- column per key — retiring keys and renaming the two 404 keys
-- application-side needs a data rewrite here too. Only rows carrying an
-- affected key are touched; every other key in the object is left
-- untouched, and `jsonb - text` is already a no-op on an absent key.
UPDATE "site_config"
SET "voice_overrides" = (
  "voice_overrides"
    - 'terminalPromptHost'
    - 'authPromptCommandSignIn'
    - 'authPromptCommandAccount'
    - 'bookmarksPromptCommand'
    - 'accountPrivacyPromptCommand'
    - 'accountNewsletterPromptCommand'
    - 'accountIdentityPromptCommand'
    - 'bookmarkToastSavedMessage'
    - 'bookmarkToastRemovedMessage'
    - 'notFoundMetaTitle'
    - 'notFoundMetaDescription'
    - 'notFoundCommandNotFound'
    - 'notFoundDescription'
  )
  || CASE WHEN "voice_overrides" ? 'notFoundCommandNotFound'
       THEN jsonb_build_object('notFoundHeading', "voice_overrides" -> 'notFoundCommandNotFound')
       ELSE '{}'::jsonb
     END
  || CASE WHEN "voice_overrides" ? 'notFoundDescription'
       THEN jsonb_build_object('notFoundSupportingText', "voice_overrides" -> 'notFoundDescription')
       ELSE '{}'::jsonb
     END
WHERE "voice_overrides" ?| ARRAY[
  'terminalPromptHost',
  'authPromptCommandSignIn',
  'authPromptCommandAccount',
  'bookmarksPromptCommand',
  'accountPrivacyPromptCommand',
  'accountNewsletterPromptCommand',
  'accountIdentityPromptCommand',
  'bookmarkToastSavedMessage',
  'bookmarkToastRemovedMessage',
  'notFoundMetaTitle',
  'notFoundMetaDescription',
  'notFoundCommandNotFound',
  'notFoundDescription'
];
