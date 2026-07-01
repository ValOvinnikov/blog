import type {
  SanityImageAsset,
  SanityImageCrop,
  SanityImageHotspot,
} from '@blog/types';
import { client } from './client';

// ---------------------------------------------------------------------------
// Shared local shapes
// ---------------------------------------------------------------------------

type ImageField = {
  asset: SanityImageAsset;
  hotspot?: SanityImageHotspot;
  crop?: SanityImageCrop;
  alt?: string;
};

type SlugField = {
  current?: string;
};

type CategoryRef = {
  name?: string;
  slug?: SlugField;
};

/** Minimal portable-text block contract. */
type PortableTextValue = {
  _type: string;
  _key: string;
  [key: string]: unknown;
};

// ---------------------------------------------------------------------------
// Public return types
// ---------------------------------------------------------------------------

export type PostSummary = {
  _id: string;
  title?: string;
  slug?: SlugField;
  publishedAt?: string;
  excerpt?: string;
  mainImage?: ImageField | null;
  author?: {
    name?: string;
    slug?: SlugField;
    image?: ImageField | null;
  } | null;
  categories?: CategoryRef[];
};

export type PostDetail = {
  _id: string;
  title?: string;
  slug?: SlugField;
  publishedAt?: string;
  excerpt?: string;
  mainImage?: ImageField | null;
  author?: {
    name?: string;
    slug?: SlugField;
    image?: ImageField | null;
    bio?: PortableTextValue[];
  } | null;
  categories?: CategoryRef[];
  body?: PortableTextValue[];
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    ogImage?: { asset?: SanityImageAsset | null } | null;
  } | null;
};

export type CategoryItem = {
  _id: string;
  name?: string;
  slug?: SlugField;
  description?: string;
};

export type AuthorDetail = {
  name?: string;
  slug?: SlugField;
  image?: ImageField | null;
  bio?: PortableTextValue[];
};

export type PageDetail = {
  title?: string;
  slug?: SlugField;
  body?: PortableTextValue[];
};

export type SiteSettingsData = {
  title?: string;
  description?: string;
  mainImage?: ImageField | null;
  ogImage?: ImageField | null;
};

// ---------------------------------------------------------------------------
// ISR options helper
// ---------------------------------------------------------------------------

function isrOptions(tag: string): { next: NextFetchRequestConfig } {
  return { next: { revalidate: 3600, tags: [tag] } };
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

const IMAGE_FIELDS = `asset->, hotspot, crop, alt`;

const POST_SUMMARY_FIELDS = `
  _id,
  title,
  slug,
  publishedAt,
  excerpt,
  mainImage { ${IMAGE_FIELDS} },
  "author": author-> {
    name,
    slug,
    image { ${IMAGE_FIELDS} }
  },
  "categories": categories[]-> {
    "name": title,
    slug
  }
`;

export async function getPosts(): Promise<PostSummary[]> {
  return client.fetch<PostSummary[]>(
    `*[_type == "post"] | order(publishedAt desc) { ${POST_SUMMARY_FIELDS} }`,
    {},
    isrOptions('posts')
  );
}

export async function getPost(slug: string): Promise<PostDetail | null> {
  return client.fetch<PostDetail | null>(
    `*[_type == "post" && slug.current == $slug][0] {
      _id,
      title,
      slug,
      publishedAt,
      excerpt,
      mainImage { ${IMAGE_FIELDS} },
      "author": author-> {
        name,
        slug,
        image { ${IMAGE_FIELDS} },
        bio
      },
      "categories": categories[]-> {
        "name": title,
        slug
      },
      body,
      seo {
        metaTitle,
        metaDescription,
        ogImage { asset-> }
      }
    }`,
    { slug },
    isrOptions('post')
  );
}

export async function getPostsByCategory(slug: string): Promise<PostSummary[]> {
  return client.fetch<PostSummary[]>(
    `*[_type == "post" && $slug in categories[]->slug.current]
      | order(publishedAt desc) { ${POST_SUMMARY_FIELDS} }`,
    { slug },
    isrOptions('posts')
  );
}

export async function getCategories(): Promise<CategoryItem[]> {
  return client.fetch<CategoryItem[]>(
    `*[_type == "category"] | order(title asc) {
      _id,
      "name": title,
      slug,
      description
    }`,
    {},
    isrOptions('categories')
  );
}

export async function getAuthor(slug: string): Promise<AuthorDetail | null> {
  return client.fetch<AuthorDetail | null>(
    `*[_type == "author" && slug.current == $slug][0] {
      name,
      slug,
      image { ${IMAGE_FIELDS} },
      bio
    }`,
    { slug },
    isrOptions('author')
  );
}

export async function getPage(slug: string): Promise<PageDetail | null> {
  return client.fetch<PageDetail | null>(
    `*[_type == "page" && slug.current == $slug][0] {
      title,
      slug,
      body
    }`,
    { slug },
    isrOptions('page')
  );
}

export async function getSiteSettings(): Promise<SiteSettingsData | null> {
  return client.fetch<SiteSettingsData | null>(
    `*[_type == "siteSettings"][0] {
      title,
      description,
      "mainImage": logo { ${IMAGE_FIELDS} },
      ogImage { ${IMAGE_FIELDS} }
    }`,
    {},
    isrOptions('siteSettings')
  );
}
