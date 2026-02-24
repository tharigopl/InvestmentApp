const mongoose = require('mongoose');

const designTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  
  category: {
    type: String,
    enum: ['birthday', 'wedding', 'graduation', 'baby_shower', 
           'anniversary', 'housewarming', 'general', 'other'],
    required: true,
  },
  
  description: String,
  
  imageUrl: {
    type: String,
    required: true,
  },
  
  thumbnailUrl: String,
  
  colors: {
    primary: {
      type: String,
      default: '#FF6B6B',
    },
    secondary: {
      type: String,
      default: '#4ECDC4',
    },
    accent: {
      type: String,
      default: '#FFD93D',
    },
    text: {
      type: String,
      default: '#333333',
    },
    background: {
      type: String,
      default: '#FFF9F0',
    },
  },
  
  isPremium: {
    type: Boolean,
    default: false,
  },
  
  isActive: {
    type: Boolean,
    default: true,
  },
  
  usageCount: {
    type: Number,
    default: 0,
  },
  
  tags: [String],
  
}, {
  timestamps: true,
});

// Indexes
designTemplateSchema.index({ category: 1, isActive: 1 });
designTemplateSchema.index({ tags: 1 });
designTemplateSchema.index({ isPremium: 1, isActive: 1 });

module.exports = mongoose.model('DesignTemplate', designTemplateSchema);