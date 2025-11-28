// Script to update image URLs from localhost to production backend URL
const mongoose = require('mongoose');
require('dotenv').config();

const PRODUCTION_BACKEND_URL = 'https://drone-arena-backend.onrender.com';

async function updateImageUrls() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const Tournament = require('../models/Tournament');
    const Team = require('../models/Team');

    // Update Tournament Images
    console.log('📸 Updating Tournament Images...');
    const tournaments = await Tournament.find({
      $or: [
        { bannerImage: { $regex: /^http:\/\/localhost/ } },
        { logoImage: { $regex: /^http:\/\/localhost/ } },
        { gallery: { $elemMatch: { $regex: /^http:\/\/localhost/ } } }
      ]
    });

    console.log(`   Found ${tournaments.length} tournaments with localhost URLs`);

    for (const tournament of tournaments) {
      let updated = false;

      // Update banner
      if (tournament.bannerImage && tournament.bannerImage.includes('localhost')) {
        tournament.bannerImage = tournament.bannerImage.replace(
          /http:\/\/localhost:\d+/,
          PRODUCTION_BACKEND_URL
        );
        updated = true;
      }

      // Update logo
      if (tournament.logoImage && tournament.logoImage.includes('localhost')) {
        tournament.logoImage = tournament.logoImage.replace(
          /http:\/\/localhost:\d+/,
          PRODUCTION_BACKEND_URL
        );
        updated = true;
      }

      // Update gallery
      if (tournament.gallery && tournament.gallery.length > 0) {
        tournament.gallery = tournament.gallery.map(url =>
          url.replace(/http:\/\/localhost:\d+/, PRODUCTION_BACKEND_URL)
        );
        updated = true;
      }

      if (updated) {
        await tournament.save();
        console.log(`   ✅ Updated: ${tournament.name}`);
      }
    }

    // Update Team Images
    console.log('\n👥 Updating Team Images...');
    const teams = await Team.find({
      $or: [
        { 'members.photo': { $regex: /^http:\/\/localhost/ } }
      ]
    });

    console.log(`   Found ${teams.length} teams with localhost URLs`);

    for (const team of teams) {
      let updated = false;

      // Update member photos
      if (team.members && team.members.length > 0) {
        team.members.forEach(member => {
          if (member.photo && member.photo.includes('localhost')) {
            member.photo = member.photo.replace(
              /http:\/\/localhost:\d+/,
              PRODUCTION_BACKEND_URL
            );
            updated = true;
          }
        });
      }

      if (updated) {
        await team.save();
        console.log(`   ✅ Updated: ${team.name}`);
      }
    }

    console.log('\n✅ Migration Complete!');
    console.log(`\nAll image URLs updated from localhost to ${PRODUCTION_BACKEND_URL}`);

    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateImageUrls();
