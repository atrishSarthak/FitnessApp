import { defineField, defineType, defineArrayMember } from 'sanity'

export default defineType({
  name: 'workout',
  title: 'Workout',
  type: 'document',
  description: 'User workout sessions with exercises, sets, reps, and weights tracked',
  fields: [
    defineField({
      name: 'userId',
      title: 'User ID',
      type: 'string',
      description: 'The Clerk user ID of the person who performed this workout',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'date',
      title: 'Workout Date',
      type: 'datetime',
      description: 'The date and time when this workout was performed',
      validation: (Rule) => Rule.required(),
      options: {
        dateFormat: 'YYYY-MM-DD',
        timeFormat: 'HH:mm',
      },
    }),
    defineField({
      name: 'duration',
      title: 'Duration (seconds)',
      type: 'number',
      description: 'Total workout duration in seconds',
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: 'exercises',
      title: 'Exercises',
      type: 'array',
      description: 'List of exercises performed in this workout with sets, reps, and weights',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'workoutExercise',
          title: 'Workout Exercise',
          fields: [
            defineField({
              name: 'exercise',
              title: 'Exercise',
              type: 'reference',
              description: 'Reference to the exercise definition',
              to: [{ type: 'exercise' }],
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'sets',
              title: 'Sets',
              type: 'array',
              description: 'Individual sets performed for this exercise',
              of: [
                defineArrayMember({
                  type: 'object',
                  name: 'set',
                  title: 'Set',
                  fields: [
                    defineField({
                      name: 'reps',
                      title: 'Reps',
                      type: 'number',
                      description: 'Number of repetitions performed in this set',
                      validation: (Rule) => Rule.required().min(0),
                    }),
                    defineField({
                      name: 'weight',
                      title: 'Weight',
                      type: 'number',
                      description: 'Weight used for this set',
                      validation: (Rule) => Rule.required().min(0),
                    }),
                    defineField({
                      name: 'weightUnit',
                      title: 'Weight Unit',
                      type: 'string',
                      description: 'Unit of measurement for the weight',
                      options: {
                        list: [
                          { title: 'Pounds (lbs)', value: 'lbs' },
                          { title: 'Kilograms (kg)', value: 'kg' },
                        ],
                        layout: 'radio',
                      },
                      validation: (Rule) => Rule.required(),
                      initialValue: 'lbs',
                    }),
                  ],
                  preview: {
                    select: {
                      reps: 'reps',
                      weight: 'weight',
                      weightUnit: 'weightUnit',
                    },
                    prepare(selection) {
                      const { reps, weight, weightUnit } = selection
                      return {
                        title: `${reps} reps × ${weight} ${weightUnit}`,
                      }
                    },
                  },
                }),
              ],
              validation: (Rule) => Rule.required().min(1),
            }),
          ],
          preview: {
            select: {
              exerciseName: 'exercise.name',
              sets: 'sets',
            },
            prepare(selection) {
              const { exerciseName, sets } = selection
              const setCount = sets?.length || 0
              return {
                title: exerciseName || 'Unknown Exercise',
                subtitle: `${setCount} set${setCount !== 1 ? 's' : ''}`,
              }
            },
          },
        }),
      ],
      validation: (Rule) => Rule.required().min(1),
    }),
  ],
  preview: {
    select: {
      userId: 'userId',
      date: 'date',
      duration: 'duration',
      exercises: 'exercises',
    },
    prepare(selection) {
      const { userId, date, duration, exercises } = selection
      
      // Format date
      const workoutDate = date ? new Date(date).toLocaleDateString() : 'No date'
      
      // Format duration
      const minutes = duration ? Math.floor(duration / 60) : 0
      const seconds = duration ? duration % 60 : 0
      const durationStr = `${minutes}m ${seconds}s`
      
      // Count exercises
      const exerciseCount = exercises?.length || 0
      
      return {
        title: `Workout - ${workoutDate}`,
        subtitle: `${exerciseCount} exercise${exerciseCount !== 1 ? 's' : ''} • ${durationStr} • User: ${userId?.substring(0, 8)}...`,
      }
    },
  },
})
