import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'exercise',
  title: 'Exercise',
  type: 'document',
  description: 'Exercise definitions with details about difficulty, instructions, and media',
  fields: [
    defineField({
      name: 'exerciseId',
      title: 'Exercise ID',
      type: 'string',
      description: 'Unique external ID from the exercise database',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'name',
      title: 'Exercise Name',
      type: 'string',
      description: 'The name of the exercise (e.g., "Barbell Bench Press", "Squats")',
      validation: (Rule) => Rule.required().max(100),
    }),
    defineField({
      name: 'instructions',
      title: 'Instructions',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Step-by-step instructions for performing the exercise',
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'primaryMuscles',
      title: 'Primary Muscles',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Primary muscles targeted by this exercise',
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'secondaryMuscles',
      title: 'Secondary Muscles',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Secondary muscles engaged during this exercise',
    }),
    defineField({
      name: 'bodyPart',
      title: 'Body Part',
      type: 'string',
      description: 'Main body part targeted (e.g., "chest", "back", "shoulders")',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'equipment',
      title: 'Equipment',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Equipment needed for this exercise',
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'difficulty',
      title: 'Difficulty Level',
      type: 'string',
      description: 'The difficulty level of the exercise',
      options: {
        list: [
          { title: 'Beginner', value: 'beginner' },
          { title: 'Intermediate', value: 'intermediate' },
          { title: 'Advanced', value: 'advanced' },
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'image',
      title: 'Exercise Image',
      type: 'image',
      description: 'A visual representation of the exercise showing proper form (GIF or image)',
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alt Text',
          description: 'Alt text for accessibility',
          validation: (Rule) => Rule.required(),
        },
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'videoUrl',
      title: 'Video URL',
      type: 'url',
      description: 'Link to a video demonstration of the exercise (YouTube, Vimeo, etc.)',
      validation: (Rule) =>
        Rule.uri({
          scheme: ['http', 'https'],
        }),
    }),
    defineField({
      name: 'isActive',
      title: 'Is Active',
      type: 'boolean',
      description: 'Toggle to show or hide this exercise in the app',
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      title: 'name',
      bodyPart: 'bodyPart',
      difficulty: 'difficulty',
      media: 'image',
      isActive: 'isActive',
    },
    prepare(selection) {
      const { title, bodyPart, difficulty, media, isActive } = selection
      return {
        title: title,
        subtitle: `${bodyPart ? bodyPart.toUpperCase() : ''} • ${difficulty ? difficulty.charAt(0).toUpperCase() + difficulty.slice(1) : 'No difficulty'} ${!isActive ? '(Inactive)' : ''}`,
        media: media,
      }
    },
  },
})
