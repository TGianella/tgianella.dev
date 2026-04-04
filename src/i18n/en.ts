const en = {
  nav: {
    home: 'Home',
    blog: 'Blog',
    talks: 'Talks',
    gallery: 'Gallery',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    mainNavLabel: 'Main navigation',
  },
  langSwitcher: {
    label: 'Français',
    lang: 'fr',
  },
  home: {
    tagline: 'Frontend Engineer',
    github: 'GitHub profile',
    linkedin: 'LinkedIn profile',
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
    intro: [
      "From my first career in higher education I kept a taste for sharing and I've had the chance to pass on my knowledge about the topics I hold dear on numerous occasions, be it at internal, local, or national conferences.",
      "Find here the abstracts, slides and video replays for all my talks."
    ],
    description: 'Conferences and presentations.',
    upcoming: 'Coming soon',
    watchTalk: 'Watch talk',
    viewSlides: 'View slides',
    backToList: '← Back to talks',
    events: 'Events',
    with: 'with',
    watchReplay: 'Watch replay',
    video: 'video',
    videoAvailable: 'Video available',
    internalEvent: 'Internal',
    moreEvents: (count: number) => `+${count} more event${count > 1 ? 's' : ''}`,
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
    siteName: 'Théo Gianella',
  },
  footer: {
    rights: 'All rights reserved.',
  },
};

export default en;
export type Translations = typeof en;
