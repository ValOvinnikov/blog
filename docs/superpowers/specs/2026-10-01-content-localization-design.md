# Content localization — design

Status: approved in conversation 2026-10-01, ahead of the pilot. The decisions
below are settled; the items under "To settle during step 0" are not.

## Why

One tenant site published in several languages: the same pages, posts and
modules, translated. Today `apps/web` runs `next-intl` with `en` only and
`localePrefix: 'never'`, and no Studio content is localized. Every module
added before this lands is one more module to convert later, so the
foundation goes in now, proven on two pilots first.

## Decisions

### Languages per tenant

- A tenant's **default language** is its existing `tenants.locale`. A new
  list on the tenant row holds its **additional languages**. Both are set in
  the admin app (`apps/platform`), which passes them to Studio when it mounts
  it.
- **Per-plan limit**, a number per plan next to `PLAN_REGISTRY`
  (`packages/db/src/constants/tenant.ts`), which only holds on/off
  capabilities today:
  - Free: the default language only.
  - Growth: the default plus 2 (3 in total).
- The admin app never lets a tenant enable more languages than its plan
  allows.
- **On a downgrade, extra languages are switched off, never deleted.**
  - **Nothing in Sanity changes.** No document is unpublished, edited or
    flagged, however many there are. Their content stays in Studio, published
    as before.
  - **The website alone stops serving those languages.** It reads the
    tenant's live languages and skips the rest.
  - **Studio shows a notice** on documents in a switched-off language
    ("Dutch isn't live on your plan — this won't appear on the site"). The
    notice is worked out from the tenant's live languages, the way the
    Newsletter notice is; nothing is stored per document.
  - They drop out of the build, revalidation, sitemap, feeds, `hreflang`,
    browser detection and the switcher.
  - Their old URLs redirect to the same page in the default language.
  - Upgrading again restores them as they were.
  - If a limit shrinks but stays above one, the admin app asks the tenant
    which languages to keep; it never picks for them.

### Supported languages

- **A curated list, not free text.** The admin app offers only languages we
  ship a full UI translation for (`next-intl` messages), since the tenant
  writes the content but the site's own chrome is ours.
- **First list: EN, NL, FR, DE, ES.** All Latin script, left to right.
- **Codes.** `LOCALE_ISO_CODES` keeps the UPPERCASE convention (`EN`, and
  later e.g. `ZH_HANS`). It maps each code to the lowercase BCP 47 tag that
  `next-intl`, `hreflang` and `<html lang>` need (`en`, `zh-Hans`).
- **Today's free-text `tenants.locale`** becomes a choice from the same list.
- **Adding a language later is its own small piece of work**, never just a
  list entry:
  - Its UI translation.
  - For other scripts (Greek, Cyrillic): fonts that cover them.
  - For Polish, Czech, Vietnamese and similar: extended Latin glyphs.
- **Separate projects, not list entries:**
  - **Chinese, Japanese, Korean:**
    - Chinese is two languages (`zh-Hans`, `zh-Hant`).
    - Automatic slugs from titles break, so slugs are typed or pinyin.
    - Fonts need CJK coverage.
    - Reading time needs a character count.
    - The `ch`-based text measure is about half as many characters.
    - Search tokenization differs.
  - **Right-to-left (Arabic, Hebrew, Persian):** `dir="rtl"` and auditing
    every component's physical-side Tailwind classes (`pl-`, `ml-`, `left-`).

### URLs

- **Language prefix, `as-needed`.**
  - The default language has no prefix (`/a-propos`).
  - Other languages are prefixed (`/en/about`).
  - Existing URLs don't change.
- **Translated slugs.** Each page translation has its own slug, unique within
  its language. Fixed path segments that come from code (`/blog`, `/tags`)
  stay untranslated for now; `next-intl`'s `pathnames` can translate them
  later.
- **Browser detection only acts on unprefixed URLs.**
  - The visitor is redirected only if the page has a translation in their
    language, to that translation's slug. Otherwise they stay on the
    default-language page.
  - A cookie remembers the visitor's last language and overrides detection.
  - Crawlers send no browser language, so they always get the default
    language.
- **A switcher is optional.** It links only to translations that exist.
- **A domain per language is a later, optional add-on.** It isn't part of this
  design. It would need a language on each `tenant_domains` row, cross-domain
  links, and separate sign-in per domain.

### SEO

- **`hreflang` alternates** on every page, in both directions, plus
  `x-default` pointing at the default language.
- **A self-referencing canonical** per language, never pointing at the default
  language.
- **Per language:** `<html lang>`, `og:locale` / `og:locale:alternate`, and
  JSON-LD `inLanguage`.
- **Sitemap entries** carry their alternates.
- **One RSS feed per language.**
- **No fake translations.** An address that doesn't exist in a language
  returns 404. Nothing we generate ever links to one (see Links).

### Studio content model

- **Document-level for every page type, posts included.**
  - Each language is its own document, linked to the others as translations.
  - Each has its own slug, SEO fields and publish state.
  - Mechanism: Sanity's `document-internationalization` plugin.
- **Field-level for everything without its own URL.**
  - One document, with a value per language for each text field.
  - This covers modules, blocks, `link` documents, site settings, navigation,
    footer, tags and topics.
  - Mechanism: Sanity's `internationalized-array`.
- **Tag and Topic Pages are pages**, so each language has its own Tag Page and
  slug. The rule "a tag backs only one Tag Page" becomes "one Tag Page per tag
  per language".
- **Tags and topics carry no slug of their own.** The URL already comes from
  the Tag or Topic Page; the service's tag and topic fragments read the slug
  through the page. Removing the unused `blog_tag.slug` / `blog_topic.slug`
  is a separate cleanup, not part of this work.

### Untranslated content

- **A field-level value missing in a language falls back to the
  default-language value**, field by field.
- **A missing translation never blocks publishing.**
  - Required fields in the default language stay errors, as today.
  - Missing translations are warnings.
- **Studio notices** use the pattern of the Newsletter module's "won't appear
  until …" notice:
  - **One per document**, listing every missing language: "Not translated
    into Dutch and German yet — those readers see the English text." With
    four or more languages it collapses to "Missing 4 of 5 languages: NL, DE,
    FR, ES …".
  - **One per field**, naming that field's missing languages.
  - A list badge for untranslated documents is optional, after the pilot.
- **Strict mode is a later option:** a per-tenant setting that turns
  translation warnings into errors.

### Links

- **The `link` document is field-level:** a label, and an external URL if one
  is needed, per language.
- **An internal reference still points at one page document.** The service
  follows it to that page's translation in the reader's language. Editors pick
  the target page once, not per language.
- **If the target has no translation in that language, the link points to the
  default-language page.** It never points to a 404.
- **Studio warns on the link:** "Not translated into Dutch — Dutch readers go
  to the English page".
- **Inline Portable Text links** follow the same rule.

## Rollout

| Step            | Scope                                                                                                                                                                                                                                                                                                          | Proves                                                 |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| 0. Foundation   | The language list with its BCP 47 mapping; UI translations for NL, FR, DE, ES; languages and plan limit on the tenant (db + admin app); Studio language config passed in by the mount; both Sanity plugins installed; `as-needed` routing; content-aware detection; a locale parameter through service queries | Nothing visible yet. Every later step needs it.        |
| 1. Pilot module | CTA module field-level, plus the `link` document with resolution to translated pages                                                                                                                                                                                                                           | Field-level editing, fallback, notices, links          |
| 2. Pilot page   | Landing pages document-level: slug per language, `hreflang`, canonical, 404, optional switcher                                                                                                                                                                                                                 | Document-level pages, SEO, links into translated pages |
| 3. Review       | Both pilots checked on dev                                                                                                                                                                                                                                                                                     | The design holds, or changes cheaply                   |
| 4. Rollout      | Remaining modules (one PR each), other page types, Tag/Topic Pages with tags and topics, posts and inline links, site settings, navigation, footer, sitemap and RSS                                                                                                                                            | Everything else                                        |

### PR shape

- **Converting one module's text fields to field-level changes its stored
  shape and its generated types.** Studio, service and web for that module
  therefore ship as **one PR**: the studio half alone reds `type-check`.
- **Each module is still its own PR** ("split by surface").
- **Step 0 splits by workspace in dependency order:** config → db → platform,
  and config → studio → service → web.

### Migrations

- **Field-level conversion is a shape change** (`string` → per-language
  array). Every converted type needs a content migration that moves the
  existing value into the default language.
- **Document-level pages need their `language` set** to the tenant's default
  language on every existing page document.
- **Targets:** development only. Production holds no tenant content that
  needs it and is being decommissioned. Each migration follows
  `packages/studio/migrations/`: dry run, then backup, then a human-gated run.
- **The tenant languages list is a Drizzle migration** on `tenants`:
  `db:generate`, then a human-gated apply.

## To settle during step 0

- **Plugins on Sanity Studio v6.** Confirm `document-internationalization`
  and `internationalized-array` support v6 and its embedded mount. Pin the
  exact shape each one stores.
- **Content-aware browser detection — settled (#4043).** The proxy reads
  the cached per-tenant translation map. Its fetch carries the map's ISR tags,
  so it is served from the Data Cache and purged by the same webhook as the
  pages; only a miss reaches Sanity. Detection in the page render was
  rejected: an ISR page is cached per URL and cannot vary by browser
  language. The language switcher uses the same map through a switch route.
- **How Studio is told a tenant's languages.** Through `StudioMount`'s plain
  string props, which must stay plain values so no built config leaves the
  package.
- **Field-level read shape in service.** One GROQ helper that resolves a
  field for `$locale` with the default-language fallback, used by every
  converted type.

## Out of scope

- A domain per language.
- Translated fixed path segments.
- Machine translation.
- Changing a tenant's default language after content exists.
- Languages beyond EN, NL, FR, DE, ES, including CJK and right-to-left.
- Strict mode.
- The tag/topic slug cleanup.

## Done when

Every content type is localized per this design, and `SPEC.md` describes it:
the content model (§6), rendering and i18n (§9), and tenant settings. This
doc is then deleted in that same PR.
