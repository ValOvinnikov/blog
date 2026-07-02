import { q } from '#/sanity/query';
import { imageWithAltFragment } from './image';
import { authorCardFragment } from './author';
import { categoryFragment } from './category';
import { seoFragment } from './seo';

export const postCardFragment = q.fragmentForType<'post'>().project((sub) => ({
  _id: true,
  title: true,
  slug: true,
  excerpt: true,
  publishedAt: true,
  mainImage: sub.field('mainImage').project(imageWithAltFragment),
  featured: true,
  author: sub.field('author').deref().project(authorCardFragment),
  categories: sub.field('categories[]').deref().project(categoryFragment),
}));

const authorDetailFragment = q.fragmentForType<'author'>().project((authorSub) => ({
  _id: true,
  name: true,
  slug: true,
  image: authorSub.field('image').project(imageWithAltFragment),
  role: true,
  bio: true,
  socialLinks: true,
}));

export const postDetailFragment = q.fragmentForType<'post'>().project((sub) => ({
  _id: true,
  title: true,
  slug: true,
  excerpt: true,
  publishedAt: true,
  mainImage: sub.field('mainImage').project(imageWithAltFragment),
  featured: true,
  body: true,
  seo: sub.field('seo').project(seoFragment),
  author: sub.field('author').deref().project(authorDetailFragment),
  categories: sub.field('categories[]').deref().project(categoryFragment),
}));
