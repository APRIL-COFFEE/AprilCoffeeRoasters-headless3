export const collectionCategories = [
  {
    label: "New",
    handle: "new",
    description: "The latest coffees, brewers, and gear from April Coffee Roasters.",
  },
  {
    label: "Everything",
    handle: "everything",
    description: "Shop all April Coffee Roasters coffees, brewers, and brewing gear.",
  },
  {
    label: "Filter Coffee",
    handle: "filter-coffee",
    description: "Filter roast coffees from April Coffee Roasters, shipped worldwide.",
  },
  {
    label: "Espresso Coffee",
    handle: "espresso-coffee",
    description: "Espresso roast coffees from April Coffee Roasters.",
  },
  {
    label: "Limited Coffee",
    handle: "limited-coffee",
    description: "Limited-release coffees from April Coffee Roasters.",
  },
  {
    label: "Organic Coffee",
    handle: "organic-coffee",
    description: "Organic coffees roasted by April Coffee Roasters.",
  },
  {
    label: "Coffee Subscriptions",
    handle: "coffee-subscriptions",
    description: "Monthly coffee subscriptions from April Coffee Roasters.",
  },
  {
    label: "Sample Box",
    handle: "samplebox",
    description: "Sample boxes of April Coffee Roasters coffees.",
  },
  {
    label: "Filter Drip Packs",
    handle: "filter-drip-packs",
    description: "Filter drip packs roasted by April Coffee Roasters.",
  },
  {
    label: "Brewers",
    handle: "brewers",
    description: "April brewers for filter coffee, including plastic, ceramic, glass, and hybrid.",
  },
  {
    label: "Paper Filter",
    handle: "paper-filter",
    description: "Paper filters sized for April brewers.",
  },
  {
    label: "Cups & Mugs",
    handle: "cupsandmugs",
    description: "Cups and mugs from April Coffee Roasters.",
  },
  {
    label: "Thermos",
    handle: "thermos",
    description: "Thermoses and flasks from April Coffee Roasters.",
  },
  {
    label: "Accessories",
    handle: "accessories",
    description: "Brewing accessories from April Coffee Roasters.",
  },
  {
    label: "Bundles",
    handle: "bundles",
    description:
      "Brewer bundles with paper filters and 250g of April filter coffee.",
  },
  {
    label: "Clothing",
    handle: "clothing",
    description: "Clothing and apparel from April Coffee Roasters.",
  },
  {
    label: "Projects",
    handle: "projects",
    description: "Projects and collaborations from April Coffee Roasters.",
  },
  {
    label: "Tasting Menu",
    handle: "tasting-menu",
    description: "Book the April Coffee Roasters tasting menu in Copenhagen.",
  },
] as const;

export type CollectionCategoryHandle =
  (typeof collectionCategories)[number]["handle"];
