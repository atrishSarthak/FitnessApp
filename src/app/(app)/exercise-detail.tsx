import {
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  BackHandler,
} from 'react-native';
import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { client } from '@/lib/sanity/client';
import { defineQuery } from 'groq';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const singleExerciseQuery = defineQuery(
  `*[_type == "exercise" && _id == $id][0] {
    _id,
    exerciseId,
    name,
    instructions,
    primaryMuscles,
    secondaryMuscles,
    bodyPart,
    equipment,
    difficulty,
    "imageUrl": image.asset->url,
    videoUrl,
    isActive
  }`
);

// Query for analytics data (last 90 days)
const analyticsQuery = defineQuery(
  `*[_type == "workoutRecord" && completedAt > $startDate && exercises[].exercise._ref == $exerciseId] {
    _id,
    completedAt,
    exercises[exercise._ref == $exerciseId] {
      sets[] {
        weight,
        reps,
        completed
      }
    }
  }`
);

type Tab = 'TARGET' | 'INSTRUCTIONS' | 'EQUIPMENT' | 'ANALYTICS';

export default function ExerciseDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const insets = useSafeAreaInsets();

  const [exercise, setExercise] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('TARGET');
  const [analytics, setAnalytics] = useState<any>(null);
  const isNavigatingBack = useRef(false);

  const IMAGE_HEIGHT = SCREEN_HEIGHT * 0.42;
  
  const buttonBottomY = insets.top + 12 + 44 + 16;
  const topSnapPoint = SCREEN_HEIGHT - buttonBottomY;
  
  const snapPoints = useMemo(() => [SCREEN_HEIGHT * 0.58, topSnapPoint], [topSnapPoint]);

  // Reset navigation flag on mount
  useEffect(() => {
    isNavigatingBack.current = false;
  }, []);

  // Handle sheet close when dragged below initial position
  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      router.dismiss();
    }
  }, [router]);

  // Prevent hardware back button from closing the screen via sheet
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      // Return false to allow default back behavior (handled by back button only)
      return false;
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const fetchExercise = async () => {
      if (!id) return;

      try {
        const data = await client.fetch(singleExerciseQuery, { id });
        setExercise(data);

        // Fetch analytics data
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        
        const analyticsData = await client.fetch(analyticsQuery, {
          exerciseId: id,
          startDate: ninetyDaysAgo.toISOString(),
        });

        // Calculate analytics
        const calculatedAnalytics = calculateAnalytics(analyticsData);
        setAnalytics(calculatedAnalytics);
      } catch (error) {
        console.error('Error fetching exercise:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchExercise();
  }, [id]);

  const calculateAnalytics = (data: any[]) => {
    if (!data || data.length === 0) {
      return {
        bestWeight: 0,
        bestReps: 0,
        bestDate: null,
        totalVolume: 0,
        totalTimes: 0,
        totalSets: 0,
      };
    }

    let bestWeight = 0;
    let bestReps = 0;
    let bestDate = null;
    let totalVolume = 0;
    let totalSets = 0;

    data.forEach((record) => {
      record.exercises?.forEach((ex: any) => {
        ex.sets?.forEach((set: any) => {
          if (set.completed) {
            totalSets++;
            totalVolume += (set.weight || 0) * (set.reps || 0);
            
            if (set.weight > bestWeight) {
              bestWeight = set.weight;
              bestReps = set.reps;
              bestDate = record.completedAt;
            }
          }
        });
      });
    });

    return {
      bestWeight,
      bestReps,
      bestDate,
      totalVolume,
      totalTimes: data.length,
      totalSets,
    };
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={{ color: '#6B7280', marginTop: 16 }}>Loading exercise...</Text>
      </View>
    );
  }

  if (!exercise) {
    return (
      <View style={{ flex: 1, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#6B7280' }}>Exercise not found</Text>
        <TouchableOpacity onPress={() => router.dismiss()} style={{ marginTop: 16 }}>
          <Text style={{ color: '#FF6B35' }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: 'white' }}>
        <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

        {/* Background Layer - GIF fills top 42% */}
        <View style={{ height: IMAGE_HEIGHT, backgroundColor: '#FFFFFF', paddingTop: insets.top }}>
          {exercise?.imageUrl ? (
            <Image
              source={{ uri: exercise.imageUrl }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="contain"
            />
          ) : (
            <View style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="fitness" size={80} color="#D1D5DB" />
            </View>
          )}
        </View>

        {/* Header Buttons - Absolutely positioned from top edge */}
        <View 
          style={{ 
            position: 'absolute',
            top: insets.top + 12,
            left: 0,
            right: 0,
            zIndex: 20,
            paddingHorizontal: 16,
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}
        >
          <TouchableOpacity
            onPress={() => router.dismiss()}
            style={{
              width: 44,
              height: 44,
              backgroundColor: '#0A1628',
              borderRadius: 22,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 5,
            }}
          >
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              width: 44,
              height: 44,
              backgroundColor: '#0A1628',
              borderRadius: 22,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 5,
            }}
          >
            <Ionicons name="star-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Bottom Sheet */}
        <BottomSheet
          ref={bottomSheetRef}
          index={0}
          snapPoints={snapPoints}
          enablePanDownToClose={true}
          enableDynamicSizing={false}
          animateOnMount={true}
          onAnimate={(fromIndex, toIndex) => {
            if (toIndex === -1 && !isNavigatingBack.current) {
              isNavigatingBack.current = true;
              router.dismiss();
            }
          }}
          onChange={(index) => {
            if (index === -1 && !isNavigatingBack.current) {
              isNavigatingBack.current = true;
              router.dismiss();
            }
          }}
          onClose={() => {
            if (!isNavigatingBack.current) {
              isNavigatingBack.current = true;
              router.dismiss();
            }
          }}
          backgroundStyle={{
            backgroundColor: '#0D2318',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
          }}
          handleIndicatorStyle={{
            backgroundColor: 'rgba(255,255,255,0.3)',
            width: 36,
            height: 4,
          }}
        >
          <BottomSheetScrollView
            style={{ flex: 1, paddingHorizontal: 24 }}
            contentContainerStyle={{
              paddingTop: 16,
              paddingBottom: 48,
            }}
            showsVerticalScrollIndicator={false}
          >
            {/* Badges Row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              {exercise.bodyPart && (
                <View
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.12)',
                    paddingHorizontal: 14,
                    paddingVertical: 6,
                    borderRadius: 20,
                    marginRight: 8,
                  }}
                >
                  <Text
                    style={{
                      color: 'white',
                      fontSize: 11,
                      fontWeight: '600',
                      letterSpacing: 1,
                      textTransform: 'uppercase',
                    }}
                  >
                    {exercise.bodyPart}
                  </Text>
                </View>
              )}
              <View
                style={{
                  backgroundColor: '#2D6A4F',
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                  borderRadius: 20,
                }}
              >
                <Text
                  style={{
                    color: 'white',
                    fontSize: 11,
                    fontWeight: '600',
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                  }}
                >
                  TRENDING
                </Text>
              </View>
            </View>

            {/* Exercise Name */}
            <Text
              style={{
                fontSize: 32,
                fontWeight: '700',
                color: 'white',
                marginTop: 10,
                marginBottom: 20,
                lineHeight: 38,
              }}
            >
              {exercise.name}
            </Text>

            {/* Tab Bar */}
            <View
              style={{
                backgroundColor: 'rgba(255,255,255,0.08)',
                borderRadius: 50,
                padding: 4,
                flexDirection: 'row',
                paddingHorizontal: 2,
                marginBottom: 24,
              }}
            >
              {(['TARGET', 'INSTRUCTIONS', 'EQUIPMENT', 'ANALYTICS'] as Tab[]).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    paddingHorizontal: 4,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: activeTab === tab ? '#1A3D2E' : 'transparent',
                    borderRadius: 50,
                  }}
                >
                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.7}
                    style={{
                      fontSize: 10,
                      fontWeight: '600',
                      letterSpacing: 0.5,
                      color: 'white',
                      textTransform: 'uppercase',
                    }}
                  >
                    {tab}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Tab Content */}
            <View style={{ minHeight: SCREEN_HEIGHT * 0.6 }}>
              {activeTab === 'TARGET' && <TargetTab exercise={exercise} />}
              {activeTab === 'INSTRUCTIONS' && <InstructionsTab exercise={exercise} />}
              {activeTab === 'EQUIPMENT' && <EquipmentTab exercise={exercise} />}
              {activeTab === 'ANALYTICS' && <AnalyticsTab analytics={analytics} />}
            </View>

            {/* Bottom padding for scroll */}
            <View style={{ height: 48 }} />
          </BottomSheetScrollView>
        </BottomSheet>
      </View>
    </GestureHandlerRootView>
  );
}

// TARGET Tab Component
function TargetTab({ exercise }: { exercise: any }) {
  return (
    <View>
      {/* PRIMARY Section */}
      {exercise.primaryMuscles && exercise.primaryMuscles.length > 0 && (
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: '600',
              color: 'rgba(255,255,255,0.5)',
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              marginBottom: 12,
              marginTop: 20,
            }}
          >
            PRIMARY
          </Text>
          {exercise.primaryMuscles.map((muscle: string, index: number) => (
            <View key={index}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 14,
                  gap: 16,
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    backgroundColor: '#FF6B35',
                    borderRadius: 8,
                  }}
                />
                <Text
                  style={{
                    color: 'white',
                    fontSize: 16,
                    fontWeight: '500',
                    textTransform: 'capitalize',
                    flex: 1,
                  }}
                >
                  {muscle}
                </Text>
              </View>
              {index < exercise.primaryMuscles.length - 1 && (
                <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.08)' }} />
              )}
            </View>
          ))}
        </View>
      )}

      {/* SECONDARY Section */}
      {exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0 && (
        <View>
          <Text
            style={{
              fontSize: 11,
              fontWeight: '600',
              color: 'rgba(255,255,255,0.5)',
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              marginBottom: 12,
              marginTop: 20,
            }}
          >
            SECONDARY
          </Text>
          {exercise.secondaryMuscles.map((muscle: string, index: number) => (
            <View key={index}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 14,
                  gap: 16,
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    backgroundColor: '#4A5568',
                    borderRadius: 8,
                  }}
                />
                <Text
                  style={{
                    color: 'white',
                    fontSize: 16,
                    fontWeight: '500',
                    textTransform: 'capitalize',
                    flex: 1,
                  }}
                >
                  {muscle}
                </Text>
              </View>
              {index < exercise.secondaryMuscles.length - 1 && (
                <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.08)' }} />
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// INSTRUCTIONS Tab Component
function InstructionsTab({ exercise }: { exercise: any }) {
  if (!exercise.instructions || exercise.instructions.length === 0) {
    return (
      <View style={{ paddingVertical: 32, alignItems: 'center' }}>
        <Text style={{ color: 'rgba(255,255,255,0.5)' }}>No instructions available</Text>
      </View>
    );
  }

  return (
    <View style={{ marginTop: 8 }}>
      {exercise.instructions.map((instruction: string, index: number) => (
        <View key={index}>
          <View style={{ flexDirection: 'row', paddingVertical: 16, gap: 16 }}>
            <Text
              style={{
                color: 'rgba(255,255,255,0.4)',
                fontSize: 24,
                fontWeight: '700',
                width: 32,
              }}
            >
              {index + 1}
            </Text>
            <Text
              style={{
                color: 'white',
                fontSize: 15,
                fontWeight: '400',
                flex: 1,
                lineHeight: 22,
              }}
            >
              {instruction}
            </Text>
          </View>
          {index < exercise.instructions.length - 1 && (
            <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.08)' }} />
          )}
        </View>
      ))}
    </View>
  );
}

// EQUIPMENT Tab Component
function EquipmentTab({ exercise }: { exercise: any }) {
  if (!exercise.equipment || exercise.equipment.length === 0) {
    return (
      <View style={{ paddingVertical: 32, alignItems: 'center' }}>
        <Text style={{ color: 'rgba(255,255,255,0.5)' }}>No equipment required</Text>
      </View>
    );
  }

  return (
    <View style={{ marginTop: 8 }}>
      {exercise.equipment.map((item: string, index: number) => (
        <View key={index}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 16, gap: 16 }}>
            <View
              style={{
                width: 80,
                height: 80,
                backgroundColor: 'white',
                borderRadius: 8,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.1)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 40 }}>🏋️</Text>
            </View>
            <Text
              style={{
                color: 'white',
                fontSize: 16,
                fontWeight: '500',
                textTransform: 'capitalize',
                flex: 1,
              }}
            >
              {item}
            </Text>
          </View>
          {index < exercise.equipment.length - 1 && (
            <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.08)' }} />
          )}
        </View>
      ))}
    </View>
  );
}

// ANALYTICS Tab Component
function AnalyticsTab({ analytics }: { analytics: any }) {
  if (!analytics) {
    return (
      <View style={{ paddingVertical: 32, alignItems: 'center' }}>
        <ActivityIndicator size="small" color="#FF6B35" />
      </View>
    );
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <View>
      {/* Header */}
      <Text
        style={{
          fontSize: 11,
          fontWeight: '600',
          color: 'rgba(255,255,255,0.5)',
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          marginBottom: 16,
        }}
      >
        IN THE LAST 90 DAYS
      </Text>

      {/* RECORDS Card */}
      <View
        style={{
          backgroundColor: '#1A2F2F',
          borderRadius: 16,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <Text style={{ color: 'white', fontSize: 18, fontWeight: '700', marginBottom: 12 }}>
          RECORDS
        </Text>

        {/* Dropdown (UI only) */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
            paddingBottom: 12,
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(255,255,255,0.1)',
          }}
        >
          <Text style={{ color: '#D1D5DB', fontSize: 14 }}>Best Weight</Text>
          <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
        </View>

        {/* Value Display */}
        <Text style={{ color: '#FF6B35', fontSize: 36, fontWeight: '700', marginBottom: 4 }}>
          {analytics.bestWeight}kg
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 16 }}>
          {analytics.bestReps} reps • {formatDate(analytics.bestDate)}
        </Text>

        {/* Chart Placeholder */}
        <View
          style={{
            height: 160,
            backgroundColor: '#0D2318',
            borderRadius: 8,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Chart coming soon</Text>
        </View>
      </View>

      {/* MORE INFORMATIONS Card */}
      <View
        style={{
          backgroundColor: '#1A2F2F',
          borderRadius: 16,
          padding: 16,
        }}
      >
        <Text style={{ color: 'white', fontSize: 18, fontWeight: '700', marginBottom: 12 }}>
          MORE INFORMATIONS
        </Text>

        <View>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingVertical: 12,
            }}
          >
            <Text style={{ color: '#D1D5DB', fontSize: 15 }}>Total volume</Text>
            <Text style={{ color: '#FF6B35', fontSize: 15, fontWeight: '600' }}>
              {analytics.totalVolume}kg
            </Text>
          </View>
          <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.1)' }} />

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingVertical: 12,
            }}
          >
            <Text style={{ color: '#D1D5DB', fontSize: 15 }}>Total Times</Text>
            <Text style={{ color: '#FF6B35', fontSize: 15, fontWeight: '600' }}>
              {analytics.totalTimes}
            </Text>
          </View>
          <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.1)' }} />

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingVertical: 12,
            }}
          >
            <Text style={{ color: '#D1D5DB', fontSize: 15 }}>Total sets</Text>
            <Text style={{ color: '#FF6B35', fontSize: 15, fontWeight: '600' }}>
              {analytics.totalSets}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
