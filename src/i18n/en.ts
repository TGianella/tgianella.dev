const en = {
  nav: {
    home: 'Home',
    blog: 'Blog',
    talks: 'Talks',
    gallery: 'Gallery',
  },
  langSwitcher: {
    label: 'Français',
    lang: 'fr',
  },
  home: {
    greeting: "Hi, I'm",
    tagline: 'Web developer & photographer',
    cta: 'Read the blog',
    sections: {
      blog: 'Latest posts',
      talks: 'Recent talks',
      gallery: 'Photography',
    },
    readMore: 'Read more',
    seeAll: 'See all',
  },
  blog: {
    title: 'Blog',
    description: 'Articles about web development and more.',
    readingTime: (minutes: number) => `${minutes} min read`,
    publishedOn: 'Published on',
    updatedOn: 'Updated on',
    tags: 'Tags',
    backToList: '← Back to blog',
  },
  talks: {
    title: 'Talks',
    description: 'Conferences and presentations.',
    watchTalk: 'Watch talk',
    viewSlides: 'View slides',
    backToList: '← Back to talks',
    at: 'at',
  },
  gallery: {
    title: 'Gallery',
    description: 'A selection of my photography.',
    photos: (count: number) => `${count} photo${count !== 1 ? 's' : ''}`,
    backToList: '← Back to gallery',
    close: 'Close',
    prev: 'Previous photo',
    next: 'Next photo',
  },
  seo: {
    siteName: 'Your Name',
    twitterHandle: '@yourhandle',
  },
  footer: {
    rights: 'All rights reserved.',
  },
} as const;

export default en;
export type Translations = typeof en;
