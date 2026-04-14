import type { Translations } from "./en";

const fr: Translations = {
  nav: {
    title: "tgianella.dev",
    home: "Accueil",
    blog: "Blog",
    talks: "Conférences",
    gallery: "Blue Screens",
    openMenu: "Ouvrir le menu",
    closeMenu: "Fermer le menu",
    mainNavLabel: "Navigation principale",
  },
  langSwitcher: {
    label: "English",
    lang: "en",
  },
  themeSwitcher: {
    toLight: "Passer en mode clair",
    toDark: "Passer en mode sombre",
  },
  home: {
    bio: [
      "Passionné par toutes les technologies du web, je façonne des interfaces performantes, accessibles et intuitives. Étant extrêmement curieux, je suis toujours à la recherche de nouvelles choses à apprendre, et vous trouverez sur ce site des articles et conférences sur certains sujets qui ont retenu mon attention.",
      "Je suis particulièrement intéressé par le fonctionnement des navigateurs web, des outils utilisés pour construire des applications web (transpilation, bundling, etc.) et de toutes les subtilités de JavaScript et CSS. En dehors de ça, je suis amateur de cinéma, de cuisine et de littérature.",
    ],
    tagline: "Développeur Front-end",
    github: "Profil GitHub",
    linkedin: "Profil LinkedIn",
    rss: "Flux RSS",
    sections: {
      blog: "Derniers articles",
      talks: "Conférences récentes",
      gallery: "Blue Screens",
    },
    readMore: "Lire la suite",
    seeAll: "Voir tout",
  },
  prose: {
    copyLink: "Copier le lien de la section",
    linkCopied: "Copié !",
  },
  blog: {
    title: "Blog",
    description: "Articles sur le développement web et plus.",
    readingTime: (minutes: number) => `${minutes} min`,
    publishedOn: "Publié le",
    updatedOn: "Mis à jour le",
    tags: "Tags",
    backToList: "← Retour au blog",
    firstPublishedIn: "Publié initialement dans",
    writtenWith: "Écrit avec",
  },
  talks: {
    title: "Conférences",
    intro: [
      "J'ai gardé de ma première carrière dans l'enseignement supérieur le goût du partage et j'ai eu l'occasion de transmettre mes connaissances sur les sujets qui me passionnent à de nombreuses reprises lors de conférences internes, locales ou nationales.",
      "Retrouvez ici les résumés, slides et captations vidéos de toutes mes conférences.",
    ],
    description: "Conférences et présentations.",
    upcoming: "À venir",
    watchTalk: "Voir la conférence",
    viewSlides: "Voir les slides",
    backToList: "← Retour aux conférences",
    events: "Événements",
    with: "avec",
    watchReplay: "Voir le replay",
    internalEvent: "Interne",
    moreEvents: (count: number) =>
      `+${count} autre${count > 1 ? "s" : ""} événement${count > 1 ? "s" : ""}`,
    listTab: "Conférences",
    timelineTab: "Chronologie",
  },
  gallery: {
    title: "Blue Screens",
    description:
      "Une de mes obsessions est de photographier les écrans d'affichages qui montrent autre chose que ce qu'ils devraient (messages d'erreur, menus, écrans d'accueil de l'OS, etc.). Je trouve ça fascinant et plus intéressant qu'il n'y paraît. Voici mes meilleures trouvailles !",
    photos: (count: number) => `${count} photo${count !== 1 ? "s" : ""}`,
    backToList: "← Retour à la galerie",
  },
  seo: {
    siteName: "Théo Gianella",
  },
  footer: {
    rights: "Tous droits réservés.",
  },
  notFound: {
    title: "Page introuvable",
    description: "La page que vous cherchez n'existe pas ou a été déplacée.",
    backHome: "Retour à l'accueil",
  },
};

export default fr;
