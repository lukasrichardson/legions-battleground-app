export interface CardDocument {
  _id: string; // MongoDB ObjectId as string
  id: number;
  title: string;
  featured_image: string;
  text: string;
  content: {
    paragraphs: string[];
    lines: string[];
    html: string;
  };
  card_code: string;
  card_release: string;
  legion: {
    names: string[];
    slugs: string[];
  };
  set: {
    names: string[];
    slugs: string[];
  };
  variant: {
    names: string[];
    slugs: string[];
  };
  rarity: {
    names: string[];
    slugs: string[];
  };
  card_type: {
    names: string[];
    slugs: string[];
  };
  card_subtype: {
    names: string[];
    slugs: string[];
  };
  card_srl: {
    names: string[];
    slugs: string[];
  };
  keywords: {
    names: string[];
    slugs: string[];
  };
  permalink: string;
  attack: number;
}