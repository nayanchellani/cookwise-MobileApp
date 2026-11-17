export const DISH_KEYWORD_IMAGES: Array<{ keywords: string[]; url: string }> = [
  {
    keywords: ['paneer', 'makhani', 'tikka masala', 'shahi paneer', 'curry paneer'],
    url: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['fusilli', 'pasta', 'arrabbiata', 'penne', 'spaghetti', 'rigatoni', 'lasagna', 'fettuccine', 'noodle'],
    url: 'https://images.unsplash.com/photo-1608897013039-887f21d8c804?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['taco', 'tacos', 'baja', 'burrito', 'quesadilla', 'fajita', 'tortilla'],
    url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['salmon', 'fish', 'tuna', 'pescatarian', 'seafood', 'cod', 'shrimp', 'prawn'],
    url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['poke', 'edamame', 'tofu', 'bowl', 'salad', 'greens', 'quinoa', 'kale'],
    url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['biryani', 'curry', 'rice', 'pulao', 'masala', 'korma'],
    url: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['stew', 'lentil', 'dal', 'daal', 'soup', 'broth', 'chili', 'chowder'],
    url: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['stir fry', 'fried rice', 'wok', 'pad thai', 'ramen', 'teriyaki', 'dumpling'],
    url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['pizza', 'flatbread', 'margherita', 'focaccia'],
    url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['sandwich', 'burger', 'toast', 'panini', 'bagel', 'wrap'],
    url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['egg', 'omelet', 'omelette', 'shakshuka', 'frittata', 'scramble', 'poached'],
    url: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80',
  },
  {
    keywords: ['pancake', 'waffle', 'oats', 'porridge', 'granola', 'dessert', 'parfait'],
    url: 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=800&q=80',
  },
];

export const CUISINE_IMAGES: Record<string, string> = {
  Indian:
    'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=80',
  Italian:
    'https://images.unsplash.com/photo-1608897013039-887f21d8c804?auto=format&fit=crop&w=800&q=80',
  Mexican:
    'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=800&q=80',
  Asian:
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
  Mediterranean:
    'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=800&q=80',
  Any:
    'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=800&q=80',
  default:
    'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=800&q=80',
};

export function getRecipeImage(cuisine?: string | null, recipeName?: string | null): string {
  if (recipeName) {
    const lowerName = recipeName.toLowerCase();
    for (const item of DISH_KEYWORD_IMAGES) {
      if (item.keywords.some((kw) => lowerName.includes(kw))) {
        return item.url;
      }
    }
  }

  if (cuisine && CUISINE_IMAGES[cuisine]) {
    return CUISINE_IMAGES[cuisine];
  }

  return CUISINE_IMAGES.default;
}
