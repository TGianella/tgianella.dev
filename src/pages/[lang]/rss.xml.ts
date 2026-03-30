import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { useTranslations, locales, type Locale } from '../../i18n/utils';
import type { APIContext } from 'astro';

export function getStaticPaths() {
  return locales.map(lang => ({ params: { lang } }));
}

export async function GET(context: APIContext) {
  const lang = context.params.lang as Locale;
  const t = useTranslations(lang);

  const posts = (await getCollection('blog', ({ id }) => id.startsWith(`${lang}/`)))
    .filter(p => !p.data.draft)
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  return rss({
    title: `${t.seo.siteName} — ${t.blog.title}`,
    description: t.blog.description,
    site: context.site!,
    items: posts.map(post => {
      const slug = post.id.replace(`${lang}/`, '');
      return {
        title: post.data.title,
        description: post.data.description,
        pubDate: post.data.pubDate,
        link: `/${lang}/blog/${slug}/`,
      };
    }),
    customData: `<language>${lang === 'en' ? 'en-US' : 'fr-FR'}</language>`,
  });
}
