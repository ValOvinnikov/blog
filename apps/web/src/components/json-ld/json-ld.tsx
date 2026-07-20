type TJsonLdProps = {
  schema: Record<string, unknown>;
};

// Mirrors Next.js's own `htmlEscapeJsonString`: unicode-escapes the
// characters that could let a string field (e.g. a post title or excerpt)
// break out of the `<script>` element or otherwise be misinterpreted as
// markup. A raw `&`/`<`/`>` in a JSON-LD value could otherwise let embedded
// content like `</script>` prematurely close the tag.
const HTML_ESCAPES: Record<string, string> = {
  '&': '\\u0026',
  '>': '\\u003e',
  '<': '\\u003c',
};

const UNSAFE_CHARS = /[&><]/g;

function escapeJsonForScript(json: string): string {
  return json.replace(UNSAFE_CHARS, (char) => HTML_ESCAPES[char] ?? char);
}

/**
 * JsonLd — renders a schema.org object as a `<script type="application/ld+json">`
 * tag. Generic over the schema shape so any structured-data builder (e.g.
 * `buildBlogPostingSchema`) can feed it directly.
 *
 * The serialized JSON is escaped (see `escapeJsonForScript`) before being
 * injected, so a `</script>` sequence embedded in a string field can't
 * prematurely close the script element; this is the only reason
 * `dangerouslySetInnerHTML` is safe here — the input is always a plain
 * serialized object, never raw HTML.
 *
 * @example
 * <JsonLd schema={buildBlogPostingSchema(post, siteUrl)} />
 */
export function JsonLd({ schema }: TJsonLdProps) {
  const serialized = escapeJsonForScript(JSON.stringify(schema));

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serialized }}
    />
  );
}
