const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const Department = require('../models/Department');

const DESCRIPTIONS = {
  ROAD: 'Roads, potholes, damaged footpaths and pavements, bridges, flyovers, speed breakers, dividers, traffic signals and road markings. Street lights are NOT handled here; they belong to the Electricity Board.',
  SAN: 'Garbage collection, waste dumps, litter, overflowing bins, dirty or smelly public areas, public toilets, hygiene and general cleanliness.',
  WATER: 'Drinking water supply, pipeline leaks, burst pipes, low pressure, drainage and blocked drains, sewer overflow, waterlogging and flooding.',
  ELEC: 'Street lights and lamp posts not working, public lighting in roads and markets, power outages, damaged electric poles and wires, transformers, sparking cables.',
  SAFE: 'Crime, harassment, illegal encroachment, unsafe public spaces, illegal activity and other threats to public safety.',
  PARK: 'Parks, gardens, playgrounds, public benches, fallen or dangerous trees, grass and plant maintenance, recreation grounds.'
};

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    for (const [code, description] of Object.entries(DESCRIPTIONS)) {
      const r = await Department.updateOne({ code }, { $set: { description } });
      console.log(`${code}: matched ${r.matchedCount}, modified ${r.modifiedCount}`);
    }
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
