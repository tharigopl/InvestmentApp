// backend/test-event-schema.js
const mongoose = require('mongoose');
const Event = require('./models/event');
require('dotenv').config();

async function testEventSchema() {
  try {
    // Connect to MongoDB
    // MongoDB connection string (use MONGODB_URI if available, otherwise construct from parts)
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
    
    // Create a test event with new fields
    const testEvent = new Event({
      eventType: 'birthday',
      eventTitle: 'Test Event with New Fields',
      eventDate: new Date('2026-12-25'),
      eventTime: '6:00 PM',
      targetAmount: 500,
      createdBy: new mongoose.Types.ObjectId(), // Dummy ID
      
      // NEW FIELDS
      design: {
        type: 'template',
        templateId: 'birthday_balloons',
        primaryColor: '#FF6B6B',
      },
      
      location: {
        venueName: 'Grand Ballroom',
        address: '123 Main St',
        city: 'San Francisco',
        state: 'CA',
        latitude: 37.7749,
        longitude: -122.4194,
      },
      
      registryType: 'stock',
      
      guestList: [
        {
          name: 'John Doe',
          email: 'john@example.com',
          rsvpStatus: 'going',
          plusOnes: 1,
        },
        {
          name: 'Jane Smith',
          email: 'jane@example.com',
          rsvpStatus: 'pending',
        },
      ],
    });
    
    // Generate shareable slug
    testEvent.generateShareableSlug();
    
    // Calculate RSVP stats
    const stats = testEvent.calculateRSVPStats();
    console.log('📊 RSVP Stats:', stats);
    
    // Save to database
    // await testEvent.save(); // Uncomment to actually save
    
    console.log('✅ Event schema test passed!');
    console.log('📝 Test event:', JSON.stringify(testEvent, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testEventSchema();