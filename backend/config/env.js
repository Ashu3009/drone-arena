const path = require('path');
const dotenv = require('dotenv');

// Determine which .env file to load based on NODE_ENV
const envFile = process.env.NODE_ENV
  ? `.env.${process.env.NODE_ENV}`
  : '.env';

const envPath = path.resolve(__dirname, '..', envFile);

console.log(`🔧 Loading environment: ${process.env.NODE_ENV || 'default'}`);
console.log(`📁 Environment file: ${envFile}`);

// Load environment variables
dotenv.config({ path: envPath });

// Export configuration
module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  MQTT_BROKER: process.env.MQTT_BROKER || 'mqtt://localhost:1883',
  MQTT_ENABLED: process.env.MQTT_ENABLED === 'true',
};
