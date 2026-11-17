// Curated, high-resolution food photography URLs (Unsplash CDNs with optimized sizing)
// Categorized by cuisine with deterministic fallbacks

export const CUISINE_IMAGES: Record<string, string> = {
  Indian:
    'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80', // Curried dish with naan
  Italian:
    'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80', // Pasta fresh basil
  Mexican:
    'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80', // Artisanal tacos
  Asian:
    'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80', // Stir fry bowl
  Mediterranean:
    'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=800&q=80', // Fresh salad/mezze bowl
  Any:
    'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=800&q=80', // Rustic kitchen table
  default:
    'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=800&q=80', // Fresh ingredients flatlay
};

export function getRecipeImage(cuisine?: string | null): string {
  if (!cuisine) return CUISINE_IMAGES.default;
  return CUISINE_IMAGES[cuisine] || CUISINE_IMAGES.default;
}
