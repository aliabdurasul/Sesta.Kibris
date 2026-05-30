/**
 * Homepage promo types — admin-managed banner slider (MVP).
 */

export type HomepagePromo = {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  market_id: string;
  cta_text: string;
  is_active: boolean;
  sort_order: number;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
};

/** Market joined for admin list / public href resolution */
export type HomepagePromoWithMarket = HomepagePromo & {
  market_name: string;
  market_slug: string;
};

/** Client slider slide — resolved image + link */
export type HomepagePromoSlide = {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string | null;
  cta: string;
  href: string;
};

export type HomepagePromoFormData = {
  title: string;
  subtitle: string;
  image_url: string;
  market_id: string;
  cta_text: string;
  sort_order: number;
  is_active: boolean;
};
