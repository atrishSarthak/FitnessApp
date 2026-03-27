// Sanity types for the fitness app

export interface Exercise {
  _id: string;
  _type: 'exercise';
  exerciseId?: string;
  name: string;
  instructions?: string[];
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  bodyPart?: string;
  equipment?: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  image?: {
    asset?: {
      _ref: string;
      _type: 'reference';
    };
    alt?: string;
    _type: 'image';
  };
  imageUrl?: string; // For GROQ queries that resolve the image URL
  videoUrl?: string;
  isActive?: boolean;
}

export interface Workout {
  _id: string;
  _type: 'workout';
  name: string;
  description?: string;
  exercises?: WorkoutExercise[];
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkoutExercise {
  _key: string;
  exercise: {
    _ref: string;
    _type: 'reference';
  };
  sets?: number;
  reps?: number;
  weight?: number;
  restTime?: number;
}

export interface WorkoutRecord {
  _id: string;
  _type: 'workoutRecord';
  workout: {
    _ref: string;
    _type: 'reference';
  };
  user: {
    _ref: string;
    _type: 'reference';
  };
  completedAt: string;
  duration?: number;
  exercises?: WorkoutRecordExercise[];
  notes?: string;
}

export interface WorkoutRecordExercise {
  _key: string;
  exercise: {
    _ref: string;
    _type: 'reference';
  };
  sets?: WorkoutRecordSet[];
}

export interface WorkoutRecordSet {
  _key: string;
  reps: number;
  weight: number;
  completed: boolean;
}
