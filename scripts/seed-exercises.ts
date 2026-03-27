import * as dotenv from 'dotenv';
import fetch from 'node-fetch';
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

// API response types
interface AscendAPIResponse {
  success: boolean;
  metadata: {
    totalPages: number;
    totalExercises: number;
    currentPage: number;
  };
  data: AscendExercise[];
}

interface AscendExercise {
  exerciseId: string;
  name: string;
  gifUrl: string;
  targetMuscles: string[];
  bodyParts: string[];
  equipments: string[];
  secondaryMuscles: string[];
  instructions: string[];
}

// Curation config: how many exercises per body part
const CURATION_CONFIG: Record<string, number> = {
  chest: 20,
  back: 20,
  shoulders: 20,
  'upper arms': 20,
  'lower arms': 15,
  'upper legs': 20,
  'lower legs': 15,
  waist: 20,
  cardio: 15,
  neck: 15,
};

// Title case transformation
function toTitleCase(str: string): string {
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Clean instructions - strip "Step:N " prefix
function cleanInstructions(instructions: string[]): string[] {
  return instructions.map(instruction => 
    instruction.replace(/^Step:\d+\s+/, '')
  );
}

// Map equipments to difficulty level
function mapDifficulty(equipments: string[]): 'beginner' | 'intermediate' | 'advanced' {
  const equipmentsLower = equipments.map(e => e.toLowerCase());
  
  // Beginner: bodyweight and simple equipment
  if (equipmentsLower.some(e => 
    e.includes('body weight') || 
    e.includes('resistance band') || 
    e.includes('dumbbell')
  )) {
    return 'beginner';
  }
  
  // Advanced: complex equipment
  if (equipmentsLower.some(e => 
    e.includes('barbell') || 
    e.includes('cable') || 
    e.includes('weighted')
  )) {
    return 'advanced';
  }
  
  // Everything else is intermediate
  return 'intermediate';
}

// Download GIF as buffer
async function downloadGif(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download GIF: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// Upload GIF to Sanity and return asset reference
async function uploadGifToSanity(gifBuffer: Buffer, filename: string): Promise<string> {
  const asset = await sanityClient.assets.upload('image', gifBuffer, {
    contentType: 'image/gif',
    filename: filename,
  });
  return asset._id;
}

// Check if exercise already exists by exerciseId
async function exerciseExists(exerciseId: string): Promise<boolean> {
  const query = `*[_type == "exercise" && exerciseId == $exerciseId][0]`;
  const result = await sanityClient.fetch(query, { exerciseId });
  return !!result;
}

// Create exercise document in Sanity
async function createExercise(exercise: AscendExercise, imageAssetId: string): Promise<void> {
  const doc = {
    _type: 'exercise',
    exerciseId: exercise.exerciseId,
    name: toTitleCase(exercise.name),
    instructions: cleanInstructions(exercise.instructions),
    primaryMuscles: exercise.targetMuscles,
    secondaryMuscles: exercise.secondaryMuscles,
    bodyPart: exercise.bodyParts[0],
    equipment: exercise.equipments,
    difficulty: mapDifficulty(exercise.equipments),
    image: {
      _type: 'image',
      asset: {
        _type: 'reference',
        _ref: imageAssetId,
      },
      alt: toTitleCase(exercise.name),
    },
    isActive: true,
  };
  
  await sanityClient.create(doc);
}

// Delay helper
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Wipe all existing exercises
async function wipeExistingExercises(): Promise<void> {
  console.log('🗑️  Wiping existing exercises...');
  const ids = await sanityClient.fetch(`*[_type == "exercise"]._id`);
  
  if (!ids || ids.length === 0) {
    console.log('   No existing exercises to wipe\n');
    return;
  }
  
  // Delete one by one to handle references gracefully
  let deleted = 0;
  for (const id of ids) {
    try {
      await sanityClient.delete(id);
      deleted++;
    } catch (error) {
      // Skip if referenced
    }
  }
  
  console.log(`   Wiped ${deleted} existing exercises\n`);
}

// Fetch all exercises from API with pagination
async function fetchAllExercises(): Promise<AscendExercise[]> {
  console.log('📥 Fetching exercises from API...');
  const allExercises: AscendExercise[] = [];
  let offset = 0;
  const limit = 100;
  let page = 1;
  
  while (true) {
    const url = `https://oss.exercisedb.dev/api/v1/exercises?limit=${limit}&offset=${offset}`;
    
    try {
      const response = await fetch(url);
      
      if (response.status === 429) {
        console.log(`   ⏳ Rate limited on page ${page}, waiting 10s...`);
        await delay(10000);
        continue;
      }
      
      if (!response.ok) {
        console.log(`   ⚠️  Stopped at page ${page} (${response.statusText})`);
        break;
      }
      
      const apiResponse = await response.json() as AscendAPIResponse;
      
      if (!apiResponse.success || !apiResponse.data || apiResponse.data.length === 0) {
        break;
      }
      
      console.log(`   Page ${page}: ${apiResponse.data.length} exercises`);
      allExercises.push(...apiResponse.data);
      
      if (apiResponse.data.length < limit) {
        break;
      }
      
      offset += limit;
      page++;
      await delay(2000); // 2s between pages
      
    } catch (error) {
      console.log(`   ⚠️  Error on page ${page}, stopping fetch`);
      break;
    }
  }
  
  console.log(`\n✅ Fetched ${allExercises.length} total exercises\n`);
  return allExercises;
}

// Curate exercises by body part
function curateExercises(exercises: AscendExercise[]): AscendExercise[] {
  const grouped: Record<string, AscendExercise[]> = {};
  
  // Group by body part
  exercises.forEach(ex => {
    const bodyPart = ex.bodyParts[0]?.toLowerCase() || 'other';
    if (!grouped[bodyPart]) {
      grouped[bodyPart] = [];
    }
    grouped[bodyPart].push(ex);
  });
  
  // Take first N from each configured body part
  const curated: AscendExercise[] = [];
  
  Object.entries(CURATION_CONFIG).forEach(([bodyPart, count]) => {
    const exercises = grouped[bodyPart] || [];
    const selected = exercises.slice(0, count);
    curated.push(...selected);
    console.log(`   ${bodyPart}: ${selected.length} exercises`);
  });
  
  return curated;
}

// Main seed function
async function seedExercises() {
  console.log('🚀 Starting exercise seed script...\n');
  
  try {
    // Step 1: Fetch all exercises
    const allExercises = await fetchAllExercises();
    
    // Step 2: Curate exercises
    console.log('🎯 Curating exercises by body part:');
    const curatedExercises = curateExercises(allExercises);
    console.log(`\n✅ Selected ${curatedExercises.length} exercises total\n`);
    
    // Step 3: Process each exercise
    let successCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    
    for (let i = 0; i < curatedExercises.length; i++) {
      const exercise = curatedExercises[i];
      const progress = `[${i + 1}/${curatedExercises.length}]`;
      
      try {
        // Check if exercise already exists (safety net)
        const exists = await exerciseExists(exercise.exerciseId);
        if (exists) {
          console.log(`${progress} ⏭️  Skipping "${toTitleCase(exercise.name)}" (already exists)`);
          skippedCount++;
          continue;
        }
        
        console.log(`${progress} 🔄 Processing "${toTitleCase(exercise.name)}"...`);
        
        // Download GIF
        const gifBuffer = await downloadGif(exercise.gifUrl);
        
        // Upload GIF to Sanity
        const slug = exercise.name.replace(/\s+/g, '-').toLowerCase().replace(/[^a-z0-9-]/g, '');
        const filename = `${slug}.gif`;
        const assetId = await uploadGifToSanity(gifBuffer, filename);
        
        // Create exercise document
        await createExercise(exercise, assetId);
        
        console.log(`${progress} ✅ ${toTitleCase(exercise.name)}`);
        successCount++;
        
        // Delay to avoid rate limiting
        if (i < curatedExercises.length - 1) {
          await delay(300);
        }
      } catch (error) {
        console.error(`${progress} ❌ Failed: ${toTitleCase(exercise.name)} — ${error instanceof Error ? error.message : error}`);
        failedCount++;
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Seed Summary:');
    console.log(`   ✅ Successfully created: ${successCount}`);
    console.log(`   ⏭️  Skipped (duplicates): ${skippedCount}`);
    console.log(`   ❌ Failed: ${failedCount}`);
    console.log('='.repeat(50));
    console.log('\n🎉 Seed script completed!');
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run the seed script
seedExercises();
