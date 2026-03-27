import * as dotenv from 'dotenv';
import { createClient } from '@sanity/client';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Validate environment variables
const SANITY_API_TOKEN = process.env.SANITY_API_TOKEN;

if (!SANITY_API_TOKEN) {
  console.error('❌ Error: SANITY_API_TOKEN is missing from .env.local');
  process.exit(1);
}

// Initialize Sanity client
const sanityClient = createClient({
  projectId: 'erf0p9zk',
  dataset: 'production',
  apiVersion: '2024-03-27',
  token: SANITY_API_TOKEN,
  useCdn: false,
});

async function clearExercises() {
  console.log('🗑️  Starting to clear all exercises from Sanity...\n');
  
  try {
    // Fetch all exercise documents with their image asset references
    const query = `*[_type == "exercise"]{_id, "imageAssetId": image.asset._ref}`;
    const exercises = await sanityClient.fetch(query);
    
    if (!exercises || exercises.length === 0) {
      console.log('✅ No exercises found in Sanity. Nothing to delete.');
      return;
    }
    
    console.log(`📊 Found ${exercises.length} exercises to delete\n`);
    
    // Delete exercises one by one (to handle references gracefully)
    let deletedCount = 0;
    let skippedCount = 0;
    
    for (const exercise of exercises) {
      try {
        // Try to delete the exercise
        await sanityClient.delete(exercise._id);
        deletedCount++;
        
        // If exercise had an image asset, try to delete it too
        if (exercise.imageAssetId) {
          try {
            await sanityClient.delete(exercise.imageAssetId);
          } catch (assetError) {
            // Asset might be referenced elsewhere or already deleted, that's ok
          }
        }
      } catch (error) {
        // If deletion fails (e.g., due to references), skip it
        console.log(`⚠️  Skipped exercise ${exercise._id} (may have references)`);
        skippedCount++;
      }
    }
    
    console.log(`\n✅ Successfully deleted ${deletedCount} exercises`);
    if (skippedCount > 0) {
      console.log(`⚠️  Skipped ${skippedCount} exercises (they have references from other documents)`);
      console.log(`   You may need to delete referencing documents first (e.g., workouts)\n`);
    }
    
  } catch (error) {
    console.error('❌ Error clearing exercises:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run the clear script
clearExercises();
