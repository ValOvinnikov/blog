export const TRANSLATIONS_EXPRESSION = `(*[_type == "translation.metadata" && references(^._id)].translations[].value->{"language": language, "slug": slug.current})[defined(slug)]`;
