// Mock Unsplash utility for demo purposes
// In production, you would use the actual Unsplash API or your own image service

export interface UnsplashImage {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  alt_description: string;
  description: string;
  user: {
    name: string;
    username: string;
  };
}

// Mock implementation that returns predefined healthcare-related images
export const unsplash_tool = {
  async search(query: string): Promise<string> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return healthcare-related images based on query
    const healthcareImages = {
      'medical pharmacy': 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
      'african healthcare': 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
      'modern pharmacy': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
      'healthcare technology': 'https://images.unsplash.com/photo-1584362917165-526a968579e8?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
      'community health': 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
      'medicine pills': 'https://images.unsplash.com/photo-1550572017-edd951aa8ca4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
      'doctor consultation': 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
      'pharmacy counter': 'https://images.unsplash.com/photo-1559719020-64cd106e20ec?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'
    };

    // Return a matching image or default to the first one
    const matchingKey = Object.keys(healthcareImages).find(key => 
      key.toLowerCase().includes(query.toLowerCase()) || 
      query.toLowerCase().includes(key.toLowerCase())
    );

    return healthcareImages[matchingKey as keyof typeof healthcareImages] || 
           healthcareImages['medical pharmacy'];
  },

  async getMultiple(queries: string[]): Promise<string[]> {
    const images = await Promise.all(queries.map(query => this.search(query)));
    return images;
  }
};

// Predefined collections for different use cases
export const IMAGE_COLLECTIONS = {
  hero_backgrounds: [
    'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
    'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
    'https://images.unsplash.com/photo-1584362917165-526a968579e8?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
    'https://images.unsplash.com/photo-1582750433449-648ed127bb54?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'
  ],
  
  feature_images: [
    'https://images.unsplash.com/photo-1550572017-edd951aa8ca4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1551601651-2a8555f1a136?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1559719020-64cd106e20ec?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1576671275791-79a1ac8c3e71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
  ],

  testimonial_avatars: [
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1494790108755-2616b612b142?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80'
  ]
};

// Helper function to get random image from collection
export function getRandomImage(collection: keyof typeof IMAGE_COLLECTIONS): string {
  const images = IMAGE_COLLECTIONS[collection];
  return images[Math.floor(Math.random() * images.length)];
}

// Helper function to preload images
export function preloadImages(urls: string[]): Promise<void[]> {
  return Promise.all(
    urls.map(url => 
      new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = url;
      })
    )
  );
}