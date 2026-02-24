const mongoose = require('mongoose');
const DesignTemplate = require('./models/design-template');
require('dotenv').config();

const seedTemplates = [
  // ========================================
  // BIRTHDAY TEMPLATES
  // ========================================
  {
    name: 'Balloon Party',
    category: 'birthday',
    description: 'Colorful balloons and confetti design',
    imageUrl: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=300',
    colors: {
      primary: '#FF6B6B',
      secondary: '#FFD93D',
      accent: '#4ECDC4',
      text: '#333333',
      background: '#FFF9F0',
    },
    isPremium: false,
    tags: ['birthday', 'colorful', 'fun', 'casual', 'kids'],
  },
  {
    name: 'Elegant Birthday',
    category: 'birthday',
    description: 'Sophisticated gold and white design',
    imageUrl: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=300',
    colors: {
      primary: '#C4A661',
      secondary: '#FFFFFF',
      accent: '#8B7355',
      text: '#2C2C2C',
      background: '#F5F5F5',
    },
    isPremium: true,
    tags: ['birthday', 'elegant', 'sophisticated', 'gold', 'adult'],
  },
  {
    name: 'Minimalist Birthday',
    category: 'birthday',
    description: 'Clean and modern design',
    imageUrl: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=300',
    colors: {
      primary: '#000000',
      secondary: '#FFFFFF',
      accent: '#FF6B6B',
      text: '#333333',
      background: '#FFFFFF',
    },
    isPremium: false,
    tags: ['birthday', 'minimalist', 'modern', 'simple'],
  },
  
  // ========================================
  // WEDDING TEMPLATES
  // ========================================
  {
    name: 'Classic Wedding',
    category: 'wedding',
    description: 'Timeless ivory and gold wedding design',
    imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=300',
    colors: {
      primary: '#F8F4E8',
      secondary: '#C4A661',
      accent: '#8B7355',
      text: '#2C2C2C',
      background: '#FFFFFF',
    },
    isPremium: true,
    tags: ['wedding', 'classic', 'elegant', 'gold', 'formal'],
  },
  {
    name: 'Garden Wedding',
    category: 'wedding',
    description: 'Fresh floral garden theme',
    imageUrl: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=300',
    colors: {
      primary: '#A8E6CF',
      secondary: '#FFD93D',
      accent: '#FF6B6B',
      text: '#333333',
      background: '#FFF9F0',
    },
    isPremium: false,
    tags: ['wedding', 'garden', 'floral', 'outdoor', 'spring'],
  },
  {
    name: 'Rustic Wedding',
    category: 'wedding',
    description: 'Warm rustic barn theme',
    imageUrl: 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=300',
    colors: {
      primary: '#8B7355',
      secondary: '#D4A574',
      accent: '#FFFFFF',
      text: '#2C2C2C',
      background: '#F5EFE7',
    },
    isPremium: true,
    tags: ['wedding', 'rustic', 'barn', 'country', 'vintage'],
  },
  
  // ========================================
  // BABY SHOWER TEMPLATES
  // ========================================
  {
    name: 'Sweet Baby Blue',
    category: 'baby_shower',
    description: 'Soft pastel blue baby shower design',
    imageUrl: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=300',
    colors: {
      primary: '#B0E0E6',
      secondary: '#FFD93D',
      accent: '#FFB6C1',
      text: '#333333',
      background: '#FFF9F0',
    },
    isPremium: false,
    tags: ['baby_shower', 'pastel', 'boy', 'blue', 'cute'],
  },
  {
    name: 'Sweet Baby Pink',
    category: 'baby_shower',
    description: 'Soft pastel pink baby shower design',
    imageUrl: 'https://images.unsplash.com/photo-1519689373023-dd07c7988603?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1519689373023-dd07c7988603?w=300',
    colors: {
      primary: '#FFB6C1',
      secondary: '#FFD93D',
      accent: '#B0E0E6',
      text: '#333333',
      background: '#FFF9F0',
    },
    isPremium: false,
    tags: ['baby_shower', 'pastel', 'girl', 'pink', 'cute'],
  },
  {
    name: 'Safari Baby',
    category: 'baby_shower',
    description: 'Fun safari animals theme',
    imageUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=300',
    colors: {
      primary: '#D4A574',
      secondary: '#8B7355',
      accent: '#A8E6CF',
      text: '#333333',
      background: '#FFF9F0',
    },
    isPremium: true,
    tags: ['baby_shower', 'safari', 'animals', 'neutral', 'fun'],
  },
  
  // ========================================
  // GRADUATION TEMPLATES
  // ========================================
  {
    name: 'Proud Graduate',
    category: 'graduation',
    description: 'Celebratory graduation design',
    imageUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=300',
    colors: {
      primary: '#4ECDC4',
      secondary: '#FFD93D',
      accent: '#FF6B6B',
      text: '#333333',
      background: '#FFF9F0',
    },
    isPremium: false,
    tags: ['graduation', 'celebration', 'achievement', 'school'],
  },
  {
    name: 'Class of 2026',
    category: 'graduation',
    description: 'Modern class year design',
    imageUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=300',
    colors: {
      primary: '#000000',
      secondary: '#C4A661',
      accent: '#FFFFFF',
      text: '#FFFFFF',
      background: '#1A1A1A',
    },
    isPremium: true,
    tags: ['graduation', 'modern', 'class', 'elegant'],
  },
  
  // ========================================
  // ANNIVERSARY TEMPLATES
  // ========================================
  {
    name: 'Golden Anniversary',
    category: 'anniversary',
    description: 'Elegant gold anniversary design',
    imageUrl: 'https://images.unsplash.com/photo-1516589091380-5d8e87df6999?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1516589091380-5d8e87df6999?w=300',
    colors: {
      primary: '#C4A661',
      secondary: '#FFFFFF',
      accent: '#8B7355',
      text: '#2C2C2C',
      background: '#F5F5F5',
    },
    isPremium: true,
    tags: ['anniversary', 'gold', 'elegant', 'romantic'],
  },
  {
    name: 'Love Story',
    category: 'anniversary',
    description: 'Romantic love theme',
    imageUrl: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=300',
    colors: {
      primary: '#FF6B6B',
      secondary: '#FFB6C1',
      accent: '#FFD93D',
      text: '#333333',
      background: '#FFF9F0',
    },
    isPremium: false,
    tags: ['anniversary', 'love', 'romantic', 'hearts'],
  },
  
  // ========================================
  // GENERAL TEMPLATES
  // ========================================
  {
    name: 'Celebration',
    category: 'general',
    description: 'All-purpose celebration design',
    imageUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800',
    thumbnailUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=300',
    colors: {
      primary: '#FF6B6B',
      secondary: '#4ECDC4',
      accent: '#FFD93D',
      text: '#333333',
      background: '#FFF9F0',
    },
    isPremium: false,
    tags: ['general', 'celebration', 'party', 'fun'],
  },
];

async function seedDesigns() {
  try {

    const uri = process.env.MONGODB_URI || (() => {
        const user = process.env.MONGO_USER;
        const pass = process.env.MONGO_PASS;
        const db = process.env.MONGO_DB;
        const hosts = process.env.MONGO_HOSTS;
        const replicaSet = process.env.MONGO_REPLICA_SET;
        const options = process.env.MONGO_OPTIONS;
        
        if (replicaSet) {
          return `mongodb://${user}:${pass}@${hosts}/${db}?replicaSet=${replicaSet}&${options}`;
        } else {
          return `mongodb+srv://${user}:${pass}@${hosts}/${db}?${options}`;
        }
      })();
      

    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');
    
    // Clear existing templates
    await DesignTemplate.deleteMany({});
    console.log('🗑️  Cleared existing templates');
    
    // Insert new templates
    const inserted = await DesignTemplate.insertMany(seedTemplates);
    console.log(`✅ Seeded ${inserted.length} design templates`);
    
    // Display templates by category
    console.log('\n📋 Templates by category:');
    const categories = [...new Set(seedTemplates.map(t => t.category))];
    
    for (const category of categories) {
      const count = seedTemplates.filter(t => t.category === category).length;
      const premium = seedTemplates.filter(t => t.category === category && t.isPremium).length;
      console.log(`  ${category}: ${count} total (${premium} premium)`);
    }
    
  } catch (error) {
    console.error('❌ Error seeding designs:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run if called directly
if (require.main === module) {
  seedDesigns();
}

module.exports = seedDesigns;