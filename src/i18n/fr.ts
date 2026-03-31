import type { Translations } from './en';

const fr: Translations = {
  nav: {
    home: 'Accueil',
    blog: 'Blog',
    talks: 'Conférences',
    gallery: 'Galerie',
  },
  langSwitcher: {
    label: 'English',
    lang: 'en',
  },
  home: {
    greeting: 'Bonjour, je suis',
    tagline: 'Développeur web & photographe',
    cta: 'Lire le blog',
    sections: {
      blog: 'Derniers articles',
      talks: 'Conférences récentes',
      gallery: 'Photographie',
    },
    readMore: 'Lire la suite',
    seeAll: 'Voir tout',
  },
  blog: {
    title: 'Blog',
    description: 'Articles sur le développement web et plus.',
    readingTime: (minutes: number) => `${minutes} min de lecture`,
    publishedOn: 'Publié le',
    updatedOn: 'Mis à jour le',
    tags: 'Tags',
    backToList: '← Retour au blog',
  },
  talks: {
    title: 'Conférences',
    description: 'Conférences et présentations.',
    watchTalk: 'Voir la conférence',
    viewSlides: 'Voir les slides',
    backToList: '← Retour aux conférences',
    at: 'à',
  },
  gallery: {
    title: 'Galerie',
    description: 'Une sélection de mes photographies.',
    photos: (count: number) => `${count} photo${count !== 1 ? 's' : ''}`,
    backToList: '← Retour à la galerie',
    close: 'Fermer',
    prev: 'Photo précédente',
    next: 'Photo suivante',
  },
  seo: {
    siteName: 'Théo Gianella',
  },
  footer: {
    rights: 'Tous droits réservés.',
  },
};

export default fr;
