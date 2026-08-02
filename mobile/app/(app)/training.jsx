import React, { useState, useEffect, useMemo, useLayoutEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useHeaderSlotActions } from '../../context/HeaderSlotContext';
import { useWorkoutLog } from '../../hooks/useWorkoutLog';
import { ErrorState } from '../../components/ErrorState';
import { TourTarget } from '../../components/tour/TourTarget';
import { DaySelector } from '../../components/meals/MealsHeader';
import {
  DAYS,
  getMondayOfCurrentWeek,
  getWeekDateNumbers,
} from '../../utils/mealHelpers';
import {
  addDaysToDateString,
} from '../../context/WorkoutLogContext';
import { getCurrentDayOfWeek } from '../../hooks/useMealCompletions';

const MAX_WORKOUTS = 5;

const WORKOUT_TYPES = [
  'Rest',
  'Distance Run',
  'Speed or Agility Training',
  'Bike Ride',
  'Walk/Hike',
  'Swim',
  'Strength Training',
  'Sport Practice',
];

const INTENSITY_LEVELS = ['High', 'Medium', 'Low', 'Recovery'];
const INTENSITY_PILLS = ['Low', 'Medium', 'High', 'Recovery'];

const WORKOUT_TIMING_OPTIONS = ['—', 'Morning', 'Afternoon', 'Evening'];

const DEFAULT_WORKOUT = {
  type: '',
  distance: '',
  intensity: 'Medium',
  notes: '',
  timing: '',
};

const getPickerStyles = (colors) =>
  StyleSheet.create({
    pickerOverlay: {
      flex: 1,
      backgroundColor: colors.modalOverlay,
      justifyContent: 'flex-end',
    },
    pickerContainer: {
      backgroundColor: colors.cardBackground,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '70%',
      padding: 20,
    },
    pickerHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    pickerTitle: {
      fontSize: 18,
      fontWeight: '900',
      color: colors.text,
    },
    pickerOptions: {
      maxHeight: 400,
    },
    pickerOption: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 12,
      borderRadius: 10,
      marginBottom: 8,
      backgroundColor: colors.inputBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    pickerOptionLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: 10,
    },
    pickerOptionIcon: {
      marginRight: 0,
    },
    pickerOptionSelected: {
      backgroundColor: colors.primaryLight,
      borderColor: colors.primary,
    },
    pickerOptionText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },
    pickerOptionTextSelected: {
      color: colors.primary,
      fontWeight: '800',
    },
  });

const Picker = ({ visible, options, selectedValue, onValueChange, onClose, title, getOptionIcon }) => {
  const { colors } = useTheme();
  const pickerStyles = getPickerStyles(colors);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={pickerStyles.pickerOverlay} onPress={onClose}>
        <Pressable style={pickerStyles.pickerContainer} onPress={() => {}}>
          <View style={pickerStyles.pickerHeader}>
            <Text style={pickerStyles.pickerTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView style={pickerStyles.pickerOptions}>
            {options.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  pickerStyles.pickerOption,
                  selectedValue === option && pickerStyles.pickerOptionSelected,
                ]}
                onPress={() => {
                  onValueChange(option);
                  onClose();
                }}
              >
                <View style={pickerStyles.pickerOptionLeft}>
                  {getOptionIcon ? (
                    <Ionicons
                      name={getOptionIcon(option)}
                      size={20}
                      color={selectedValue === option ? colors.primary : colors.textSecondary}
                      style={pickerStyles.pickerOptionIcon}
                    />
                  ) : null}
                  <Text
                    style={[
                      pickerStyles.pickerOptionText,
                      selectedValue === option && pickerStyles.pickerOptionTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </View>
                {selectedValue === option && (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const getWorkoutIcon = (type) => {
  switch (type) {
    case 'Rest':
      return 'bed-outline';
    case 'Distance Run':
      return 'walk-outline';
    case 'Speed or Agility Training':
      return 'flash-outline';
    case 'Bike Ride':
      return 'bicycle-outline';
    case 'Walk/Hike':
      return 'trail-sign-outline';
    case 'Swim':
      return 'water-outline';
    case 'Strength Training':
      return 'barbell-outline';
    case 'Sport Practice':
      return 'football-outline';
    default:
      return 'fitness-outline';
  }
};

const getIntensityIcon = (intensity) => {
  switch (intensity) {
    case 'High':
      return 'flame-outline';
    case 'Medium':
      return 'speedometer-outline';
    case 'Low':
      return 'leaf-outline';
    case 'Recovery':
      return 'heart-outline';
    default:
      return 'options-outline';
  }
};

const getTimingIcon = (timing) => {
  switch (timing) {
    case 'Morning':
      return 'sunny-outline';
    case 'Afternoon':
      return 'partly-sunny-outline';
    case 'Evening':
      return 'moon-outline';
    case '—':
    default:
      return 'time-outline';
  }
};

const weekdayFromLocalDate = (localDate) => {
  const d = new Date(`${localDate}T00:00:00`);
  const js = d.getDay();
  return DAYS[js === 0 ? 6 : js - 1];
};

export default function TrainingScreen() {
  const { user, isGuest } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const { setHeaderSlot, clearHeaderSlot } = useHeaderSlotActions();
  const isFocused = useIsFocused();
  const workoutLog = useWorkoutLog(user, isGuest);
  const styles = useMemo(() => getStyles(colors, isDarkMode), [colors, isDarkMode]);

  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showIntensityPicker, setShowIntensityPicker] = useState(false);
  const [showTimingPicker, setShowTimingPicker] = useState(false);
  const [pickerContext, setPickerContext] = useState({ index: null, field: null });
  const [showSaved, setShowSaved] = useState(false);
  const [wasSaving, setWasSaving] = useState(false);

  const {
    selectedDate,
    weekStarting,
    isSaving,
    isLoading,
    error,
    updateDayWorkouts,
    getWorkoutsForDate,
    flushPendingSaves,
    setSelectedDate,
    loadWeek,
    clearError,
    goToPreviousWeek,
    goToNextWeek,
  } = workoutLog;

  const selectedDay = useMemo(() => weekdayFromLocalDate(selectedDate), [selectedDate]);
  const weekDateNumbers = useMemo(() => getWeekDateNumbers(weekStarting), [weekStarting]);
  const todayDayOfWeek = getCurrentDayOfWeek();
  const isCurrentWeek = weekStarting === getMondayOfCurrentWeek();

  const rawWorkouts = getWorkoutsForDate(selectedDate);
  const selectedWorkouts = rawWorkouts.length ? rawWorkouts : [{ ...DEFAULT_WORKOUT }];
  const addWorkoutLabel =
    selectedWorkouts.length > 1 ? '+ Add another workout' : '+ Add workout';

  useEffect(() => {
    if (isSaving) {
      setWasSaving(true);
      setShowSaved(false);
      return undefined;
    }
    if (wasSaving) {
      setShowSaved(true);
      const t = setTimeout(() => setShowSaved(false), 2000);
      setWasSaving(false);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [isSaving, wasSaving]);

  useEffect(() => {
    setShowSaved(false);
    setWasSaving(false);
  }, [selectedDate]);

  useEffect(() => {
    if (!error) return;
    // Only alert for save failures after the user edits a workout.
    // Load/revalidate flakes (e.g. brief offline on app resume) stay quiet.
    if (!/save/i.test(error)) return;
    Alert.alert('Error', error, [{ text: 'OK', onPress: clearError }]);
  }, [error, clearError]);

  useEffect(() => {
    if (isFocused) return undefined;
    void flushPendingSaves(selectedDate);
    return undefined;
  }, [isFocused, flushPendingSaves, selectedDate]);

  // Keep set vs clear separate so content updates don't blank the reserved strip.
  useLayoutEffect(() => {
    if (!isFocused) return undefined;

    setHeaderSlot(
      <DaySelector
        days={DAYS}
        weekDateNumbers={weekDateNumbers}
        weekStarting={weekStarting}
        selectedDay={selectedDay}
        onSelectDay={(day) => {
          const idx = DAYS.indexOf(day);
          if (idx < 0) return;
          setSelectedDate(addDaysToDateString(weekStarting, idx));
        }}
        todayDayOfWeek={todayDayOfWeek}
        isCurrentWeek={isCurrentWeek}
        showWeekNav
        onPreviousWeek={goToPreviousWeek}
        onNextWeek={goToNextWeek}
        weekNavDisabled={!user || isGuest}
        animatedStyle={{
          paddingHorizontal: 16,
          paddingTop: 4,
          paddingBottom: 10,
          marginBottom: 0,
        }}
      />,
      'training'
    );
    return undefined;
  }, [
    goToNextWeek,
    goToPreviousWeek,
    isCurrentWeek,
    isFocused,
    isGuest,
    selectedDay,
    setHeaderSlot,
    setSelectedDate,
    todayDayOfWeek,
    user,
    weekDateNumbers,
    weekStarting,
  ]);

  useLayoutEffect(() => {
    if (!isFocused) {
      clearHeaderSlot('training');
    }
    return () => clearHeaderSlot('training');
  }, [clearHeaderSlot, isFocused]);

  const commitWorkouts = (workouts) => {
    updateDayWorkouts(selectedDate, workouts);
  };

  const addWorkout = () => {
    if (selectedWorkouts.length >= MAX_WORKOUTS) return;
    commitWorkouts([...selectedWorkouts, { ...DEFAULT_WORKOUT }]);
  };

  const removeWorkout = (index) => {
    const workouts = [...selectedWorkouts];
    workouts.splice(index, 1);
    commitWorkouts(workouts.length ? workouts : [{ ...DEFAULT_WORKOUT }]);
  };

  const updateWorkout = (index, field, value) => {
    const workouts = selectedWorkouts.map((w, i) =>
      i === index ? { ...w, [field]: value } : w
    );
    commitWorkouts(workouts);
  };

  const openPicker = (index, field) => {
    setPickerContext({ index, field });
    if (field === 'type') setShowTypePicker(true);
    else if (field === 'intensity') setShowIntensityPicker(true);
    else if (field === 'timing') setShowTimingPicker(true);
  };

  const handlePickerValueChange = (value) => {
    if (pickerContext.index === null) return;
    const stored = pickerContext.field === 'timing' && value === '—' ? '' : value;
    updateWorkout(pickerContext.index, pickerContext.field, stored);
  };

  if (error && !isLoading && !Object.keys(workoutLog.logsByDate).length && !Object.keys(workoutLog.draftByDate).length) {
    return (
      <ErrorState
        message={error}
        onRetry={() => {
          clearError();
          loadWeek(weekStarting);
        }}
      />
    );
  }

  if (isLoading && !Object.keys(workoutLog.logsByDate).length) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading workouts…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View pointerEvents="none" style={styles.bgDecor}>
        <View style={[styles.bgCircle, styles.bgCircleMint]} />
        <View style={[styles.bgCircle, styles.bgCirclePeach]} />
      </View>

      <TourTarget id="training-editor" style={{ flex: 1, zIndex: 1 }}>
        <View style={styles.statusRow}>
          {isSaving ? (
            <View style={styles.statusPill}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.statusText}>Saving…</Text>
            </View>
          ) : showSaved ? (
            <View style={[styles.statusPill, styles.statusPillSaved]}>
              <Ionicons name="checkmark-circle" size={12} color={colors.success} />
              <Text style={[styles.statusText, styles.statusTextSaved]}>Saved</Text>
            </View>
          ) : (
            <View style={styles.statusPillSpacer} />
          )}
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.workoutsContainer}>
            {selectedWorkouts.map((workout, index) => (
              <View key={index} style={styles.workoutCard}>
                <TouchableOpacity
                  style={styles.workoutField}
                  onPress={() => openPicker(index, 'type')}
                >
                  <Text style={styles.workoutFieldLabel}>Workout type</Text>
                  <View style={styles.workoutFieldValue}>
                    {workout.type ? (
                      <View style={styles.workoutTypeRow}>
                        <Ionicons
                          name={getWorkoutIcon(workout.type)}
                          size={18}
                          color={colors.textSecondary}
                        />
                        <Text style={styles.workoutFieldText}>{workout.type}</Text>
                      </View>
                    ) : (
                      <Text style={styles.workoutFieldPlaceholder}>Select workout</Text>
                    )}
                    <Ionicons name="chevron-down" size={18} color={colors.textTertiary} />
                  </View>
                </TouchableOpacity>

                <View style={styles.fieldRow}>
                  <View style={[styles.workoutField, styles.fieldFlex]}>
                    <Text style={styles.workoutFieldLabel}>Distance / duration</Text>
                    <TextInput
                      style={styles.workoutInput}
                      placeholder="e.g., 5km, 30 min"
                      value={workout.distance || ''}
                      onChangeText={(text) => updateWorkout(index, 'distance', text)}
                      placeholderTextColor={colors.placeholderColor}
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.workoutField, styles.fieldFlex]}
                    onPress={() => openPicker(index, 'timing')}
                  >
                    <Text style={styles.workoutFieldLabel}>Workout time</Text>
                    <View style={styles.workoutFieldValue}>
                      <View style={styles.workoutTypeRow}>
                        <Ionicons
                          name={getTimingIcon(workout.timing || '—')}
                          size={16}
                          color={colors.textSecondary}
                        />
                        <Text
                          style={
                            workout.timing
                              ? styles.workoutFieldText
                              : styles.workoutFieldPlaceholder
                          }
                        >
                          {workout.timing || '—'}
                        </Text>
                      </View>
                      <Ionicons name="chevron-down" size={18} color={colors.textTertiary} />
                    </View>
                  </TouchableOpacity>
                </View>

                <View style={styles.workoutField}>
                  <Text style={styles.workoutFieldLabel}>Intensity</Text>
                  <View style={styles.intensityPills}>
                    {INTENSITY_PILLS.map((level) => {
                      const selected = (workout.intensity || 'Medium') === level;
                      return (
                        <TouchableOpacity
                          key={level}
                          style={[
                            styles.intensityPill,
                            selected && styles.intensityPillSelected,
                          ]}
                          onPress={() => updateWorkout(index, 'intensity', level)}
                        >
                          <Text
                            style={[
                              styles.intensityPillText,
                              selected && styles.intensityPillTextSelected,
                            ]}
                          >
                            {level}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {selectedWorkouts.length > 1 ? (
                  <TouchableOpacity
                    style={styles.removeWorkoutBtn}
                    onPress={() => removeWorkout(index)}
                  >
                    <Ionicons name="trash-outline" size={16} color={colors.error} />
                    <Text style={styles.removeWorkoutText}>Remove</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ))}

            {selectedWorkouts.length < MAX_WORKOUTS ? (
              <TouchableOpacity
                style={styles.addAnotherWorkoutButton}
                onPress={addWorkout}
                accessibilityLabel={addWorkoutLabel}
              >
                <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                <Text style={styles.addAnotherWorkoutText}>{addWorkoutLabel}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </ScrollView>
      </TourTarget>

      <Picker
        visible={showTypePicker}
        options={WORKOUT_TYPES}
        selectedValue={
          pickerContext.index !== null
            ? selectedWorkouts[pickerContext.index]?.type || ''
            : ''
        }
        onValueChange={handlePickerValueChange}
        onClose={() => setShowTypePicker(false)}
        title="Select Workout Type"
        getOptionIcon={getWorkoutIcon}
      />

      <Picker
        visible={showIntensityPicker}
        options={INTENSITY_LEVELS}
        selectedValue={
          pickerContext.index !== null
            ? selectedWorkouts[pickerContext.index]?.intensity || 'Medium'
            : 'Medium'
        }
        onValueChange={handlePickerValueChange}
        onClose={() => setShowIntensityPicker(false)}
        title="Select Intensity"
        getOptionIcon={getIntensityIcon}
      />

      <Picker
        visible={showTimingPicker}
        options={WORKOUT_TIMING_OPTIONS}
        selectedValue={
          pickerContext.index !== null
            ? selectedWorkouts[pickerContext.index]?.timing || '—'
            : '—'
        }
        onValueChange={handlePickerValueChange}
        onClose={() => setShowTimingPicker(false)}
        title="Workout Time"
        getOptionIcon={getTimingIcon}
      />
    </View>
  );
}

const getStyles = (colors, isDarkMode = false) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: 16,
      overflow: 'hidden',
    },
    bgDecor: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 0,
    },
    bgCircle: {
      position: 'absolute',
      borderRadius: 9999,
    },
    bgCircleMint: {
      width: 260,
      height: 260,
      backgroundColor: isDarkMode ? 'rgba(224,236,222,0.1)' : '#E0ECDE',
      top: -40,
      right: -90,
    },
    bgCirclePeach: {
      width: 280,
      height: 280,
      backgroundColor: isDarkMode ? 'rgba(247,233,218,0.08)' : '#F7E9DA',
      top: 180,
      left: -120,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
      paddingHorizontal: 16,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    statusRow: {
      minHeight: 28,
      marginBottom: 6,
      zIndex: 1,
      alignItems: 'flex-end',
    },
    statusPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: colors.inputBackground,
    },
    statusPillSaved: {
      backgroundColor: colors.successLight,
      borderWidth: 1,
      borderColor: colors.successBorder,
    },
    statusPillSpacer: {
      height: 20,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    statusTextSaved: {
      color: colors.successText,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingTop: 4,
      paddingBottom: 28,
    },
    workoutsContainer: {
      gap: 14,
    },
    addAnotherWorkoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      borderStyle: 'dashed',
      backgroundColor: colors.cardBackground,
    },
    addAnotherWorkoutText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.primary,
    },
    workoutCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 12,
    },
    workoutField: {
      gap: 6,
    },
    fieldRow: {
      flexDirection: 'row',
      gap: 10,
    },
    fieldFlex: {
      flex: 1,
    },
    workoutFieldLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    workoutFieldValue: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.inputBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      paddingVertical: 12,
      minHeight: 48,
    },
    workoutTypeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
    },
    workoutFieldText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      flexShrink: 1,
    },
    workoutFieldPlaceholder: {
      fontSize: 15,
      fontWeight: '500',
      color: colors.placeholderColor,
    },
    workoutInput: {
      backgroundColor: colors.inputBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      paddingVertical: 12,
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      minHeight: 48,
    },
    intensityPills: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    intensityPill: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: colors.inputBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    intensityPillSelected: {
      backgroundColor: colors.primaryLight,
      borderColor: colors.primary,
    },
    intensityPillText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    intensityPillTextSelected: {
      color: colors.primary,
      fontWeight: '800',
    },
    removeWorkoutBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      alignSelf: 'flex-start',
      paddingVertical: 4,
    },
    removeWorkoutText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.error,
    },
  });
