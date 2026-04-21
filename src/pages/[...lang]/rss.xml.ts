import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import {
  useTranslations,
  getLocalizedPath,
  slugOf,
  locales,
  type Locale,
} from "../../i18n/utils";
import { publishedPosts } from "../../content/utils";
import type { APIContext } from "astro";

export function getStaticPaths() {
  return locales.map((lang) => ({
    params: { lang: lang === "en" ? undefined : lang },
  }));
}

export async function GET(context: APIContext) {
  const lang: Locale = (context.params.lang as Locale | undefined) ?? "en";
  const t = useTranslations(lang);

  const posts = publishedPosts(
    await getCollection("blog", ({ id }) => id.startsWith(`${lang}/`)),
  );

  return rss({
    title: `${t.seo.siteName} — ${t.blog.title}`,
    description: t.blog.description,
    site: context.site!,
    items: posts.map((post) => {
      const slug = slugOf(post.id, lang);
      return {
        title: post.data.title,
        description: post.data.description,
        pubDate: post.data.pubDate,
        link: `${getLocalizedPath(`/blog/${slug}`, lang)}/`,
      };
    }),
    customData: `<language>${lang === "en" ? "en-US" : "fr-FR"}</language>`,
  });
}
