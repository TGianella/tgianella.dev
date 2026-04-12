const en = {
  nav: {
    title: 'tgianella.dev',
    home: 'Home',
    blog: 'Blog',
    talks: 'Talks',
    gallery: 'Blue Screens',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    mainNavLabel: 'Main navigation',
  },
  langSwitcher: {
    label: 'Français',
    lang: 'fr',
  },
  themeSwitcher: {
    toLight: 'Switch to light mode',
    toDark: 'Switch to dark mode',
  },
  home: {
    tagline: 'Frontend Engineer',
    github: 'GitHub profile',
    linkedin: 'LinkedIn profile',
    sections: {
      blog: 'Latest posts',
      talks: 'Recent talks',
      gallery: 'Blue Screens',
    },
    readMore: 'Read more',
    seeAll: 'See all',
  },
  prose: {
    copyLink: 'Copy link to section',
    linkCopied: 'Copied!',
  },
  blog: {
    title: 'Blog',
    description: 'Articles about web development and more.',
    readingTime: (minutes: number) => `${minutes} min read`,
    publishedOn: 'Published on',
    updatedOn: 'Updated on',
    tags: 'Tags',
    backToList: '← Back to blog',
    firstPublishedIn: 'First published in',
    writtenWith: 'Written with',
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
    internalEvent: 'Internal',
    moreEvents: (count: number) => `+${count} more event${count > 1 ? 's' : ''}`,
    listTab: 'Talks',
    timelineTab: 'Timeline',
  },
  gallery: {
    title: 'Blue Screens',
    description: 'A hobby of mine is to snap pictures of public display screens with errors on them. I find them very interesting and somehow meaningful, here are my best catches !',
    photos: (count: number) => `${count} photo${count !== 1 ? 's' : ''}`,
    backToList: '← Back to Gallery',
  },
  seo: {
    siteName: 'Théo Gianella',
  },
  footer: {
    rights: 'All rights reserved.',
  },
  notFound: {
    title: 'Page not found',
    description: 'The page you are looking for does not exist or has been moved.',
    backHome: 'Back to home',
  },
};

export default en;
export type Translations = typeof en;
