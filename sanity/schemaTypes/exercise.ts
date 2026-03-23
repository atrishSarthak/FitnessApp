import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'exercise',
  title: 'Exercise',
  type: 'document',
  description: 'Exercise definitions with details about difficulty, instructions, and media',
  fields: [
    defineField({
      name: 'name',
      title: 'Exercise Name',
      type: 'string',
      description: 'The name of the exercise (e.g., "Push-ups", "Squats")',
      validation: (Rule) => Rule.required().max(100),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      description: 'Detailed description of how to perform the exercise, including form tips and common mistakes to avoid',
      validation: (Rule) => Rule.required().max(500),
      rows: 5,
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
      description: 'A visual representation of the exercise showing proper form',
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alt Text',
          description: 'Remember to use alt text for people to be able to read what is happening in the image if they are using a screen reader, it\'s also important for SEO',
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
      difficulty: 'difficulty',
      media: 'image',
      isActive: 'isActive',
    },
    prepare(selection) {
      const { title, difficulty, media, isActive } = selection
      return {
        title: title,
        subtitle: `${difficulty ? difficulty.charAt(0).toUpperCase() + difficulty.slice(1) : 'No difficulty'} ${!isActive ? '(Inactive)' : ''}`,
        media: media,
      }
    },
  },
})
