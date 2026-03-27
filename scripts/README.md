# Exercise Seed Script

This script fetches exercises from the AscendAPI ExerciseDB (completely free, no API key needed) and populates your Sanity CMS with curated exercise data, including uploading GIF images as Sanity assets.

## Prerequisites

Your `.env.local` file must contain:

```env
SANITY_API_TOKEN=your_sanity_token_here
```

This is already configured in your `.env.local` file.

## How to Run

```bash
npm run seed:exercises
```

## What It Does

1. **Wipes existing exercises** from Sanity (to ensure consistency)
2. **Fetches all exercises** from AscendAPI ExerciseDB (free, no auth)
3. **Curates ~180 exercises** by body part:
   - Chest: 20
   - Back: 20
   - Shoulders: 20
   - Upper arms: 20
   - Lower arms: 15
   - Upper legs: 20
   - Lower legs: 15
   - Waist: 20
   - Cardio: 15
   - Neck: 15
4. For each curated exercise:
   - Transforms name to Title Case
   - Cleans instruction steps (removes "Step:N " prefix)
   - Maps equipment to difficulty level
   - Downloads and uploads GIF to Sanity
   - Creates exercise document with all fields
5. Adds 300ms delay between uploads to avoid rate limiting
6. Provides detailed progress logging

## Data Transformations

- **Name**: "barbell bench press" → "Barbell Bench Press"
- **Instructions**: "Step:1 Lie flat..." → "Lie flat..." (array of strings)
- **Difficulty**: Mapped from equipment types
- **Body Part**: Uses first item from bodyParts array
- **Muscles**: targetMuscles → primaryMuscles, secondaryMuscles preserved

## Output

The script provides clear feedback:
- 🗑️ Wiped X existing exercises
- 📥 Fetching exercises from API
- 🎯 Curating by body part
- ✅ Successfully created exercises
- ❌ Failed exercises (with error details)
- 📊 Final summary with counts

## Notes

- Completely free - no API key required
- Wipes existing data before seeding for consistency
- Safe duplicate checking by exerciseId
- If an individual exercise fails, the script continues
- GIFs are uploaded to Sanity and accessible via `image.asset->url`
