import Script from 'next/script';

/** Stable id from the serialized payload, so duplicate blocks dedupe. */
function getJsonLdId(serialized: string) {
  let hash = 0;
  for (const char of serialized) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return `json-ld-${hash.toString(36)}`;
}

// The JS-illegal line/paragraph separators, referenced by escape so no literal
// terminator ever appears in this source file.
const LINE_SEP = new RegExp(' ', 'g');
const PARA_SEP = new RegExp(' ', 'g');

function serializeJsonLd(data: unknown) {
  // Escape `<` and U+2028/U+2029 so the payload is safe to inline in a <script>.
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(LINE_SEP, '\\u2028')
    .replace(PARA_SEP, '\\u2029');
}

/** Renders a JSON-LD structured-data block for search engines / AI crawlers. */
export function JsonLd({ data, id }: { data: unknown; id?: string }) {
  if (!data) return null;
  const serialized = serializeJsonLd(data);
  return (
    <Script id={id ?? getJsonLdId(serialized)} type="application/ld+json">
      {serialized}
    </Script>
  );
}
