import { View, Text, TouchableOpacity, Image } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case "beginner":
      return "#10B981"; // green
    case "intermediate":
      return "#FF6B35"; // orange
    case "advanced":
      return "#EF4444"; // red
    default:
      return "#6B7280"; // gray
  }
};

const getDifficultyText = (difficulty: string) => {
  switch (difficulty) {
    case "beginner":
      return "Beginner";
    case "intermediate":
      return "Intermediate";
    case "advanced":
      return "Advanced";
    default:
      return "Unknown";
  }
};

interface ExerciseCardProps {
  item: {
    _id: string;
    name: string;
    bodyPart?: string;
    equipment?: string[];
    difficulty: string;
    imageUrl?: string;
  };
  onPress: () => void;
}

export default function ExerciseCard({ item, onPress }: ExerciseCardProps) {
  const difficultyColor = getDifficultyColor(item.difficulty);
  
  return (
    <TouchableOpacity
      className="bg-[#0D1F1F] rounded-2xl mb-4 overflow-hidden"
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Image Section */}
      <View className="w-full h-[200px] bg-white">
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            className="w-full h-full"
            resizeMode="contain"
          />
        ) : (
          <View className="w-full h-full items-center justify-center">
            <Ionicons name="fitness" size={48} color="#D1D5DB" />
          </View>
        )}
      </View>

      {/* Content Section */}
      <View className="p-4">
        {/* Body Part Badge */}
        {item.bodyPart && (
          <View className="self-start mb-2">
            <View className="bg-[#1A2F2F] px-3 py-1 rounded-full">
              <Text className="text-white text-xs font-semibold uppercase">
                {item.bodyPart}
              </Text>
            </View>
          </View>
        )}

        {/* Exercise Name */}
        <Text className="text-white text-xl font-bold mb-2">
          {item.name}
        </Text>

        {/* Equipment and Difficulty Row */}
        <View className="flex-row items-center">
          {/* Equipment */}
          {item.equipment && item.equipment.length > 0 && (
            <View className="flex-row items-center mr-3">
              <Text className="text-gray-400 text-sm">
                🏋️ {item.equipment[0]}
              </Text>
            </View>
          )}

          {/* Separator */}
          {item.equipment && item.equipment.length > 0 && (
            <Text className="text-gray-600 text-sm mr-3">•</Text>
          )}

          {/* Difficulty */}
          <Text 
            className="text-sm font-semibold"
            style={{ color: difficultyColor }}
          >
            {getDifficultyText(item.difficulty)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
