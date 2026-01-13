import React, { useState, useEffect } from 'react';
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
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useTrainingPlan } from '../../hooks/useTrainingPlan';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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

const DEFAULT_WORKOUT = {
  type: '',
  distance: '',
  intensity: 'Medium',
  notes: '',
};

// Picker styles function
const getPickerStyles = (colors) => StyleSheet.create({
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

// Simple Picker component using Modal
const Picker = ({ visible, options, selectedValue, onValueChange, onClose, title }) => {
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
                <Text
                  style={[
                    pickerStyles.pickerOptionText,
                    selectedValue === option && pickerStyles.pickerOptionTextSelected,
                  ]}
                >
                  {option}
                </Text>
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
    case 'Swim':
      return 'water-outline';
    case 'Bike Ride':
      return 'bicycle-outline';
    case 'Strength Training':
      return 'barbell-outline';
    case 'Distance Run':
    case 'Walk/Hike':
      return 'walk-outline';
    case 'Speed or Agility Training':
      return 'flash-outline';
    default:
      return 'fitness-outline';
  }
};

const getIntensityColor = (intensity) => {
  switch (intensity) {
    case 'High':
      return '#DC2626'; // red
    case 'Medium':
      return '#F6921D'; // orange
    case 'Low':
      return '#3B82F6'; // blue
    case 'Recovery':
      return '#10B981'; // green
    default:
      return '#9CA3AF'; // gray
  }
};

const isWorkoutPlanned = (w) =>
  (w.type && String(w.type).trim()) ||
  (w.distance && String(w.distance).trim()) ||
  (w.notes && String(w.notes).trim());

export default function TrainingScreen() {
  const { user, isGuest } = useAuth();
  const { colors } = useTheme();
  const trainingPlanHook = useTrainingPlan(user, isGuest);

  const [planName, setPlanName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showIntensityPicker, setShowIntensityPicker] = useState(false);
  const [pickerContext, setPickerContext] = useState({ day: null, index: null, field: null });
  
  // Initialize with current day expanded
  const getCurrentDay = () => {
    const today = new Date().getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    // Convert to our day format: Monday=1, Sunday=0 -> monday, sunday
    const dayIndex = today === 0 ? 6 : today - 1; // Sunday becomes index 6, Monday becomes 0
    return DAYS[dayIndex];
  };

  const [expandedDays, setExpandedDays] = useState(() => {
    const currentDay = getCurrentDay();
    return new Set([currentDay]); // Start with current day expanded
  });

  useEffect(() => {
    setPlanName(trainingPlanHook.currentPlanName || '');
  }, [trainingPlanHook.currentPlanName]);

  const handleSave = async () => {
    const nameToUse = planName.trim() || 'Untitled Plan';
    const { error } = await trainingPlanHook.savePlan(nameToUse);

    if (!error) {
      setShowSaveModal(false);
      setShowConfirmation(true);
      setTimeout(() => setShowConfirmation(false), 3000);
    } else {
      Alert.alert('Error', 'Failed to save training plan');
    }
  };

  const handleLoadClick = async () => {
    await trainingPlanHook.loadSavedPlans();
    setShowLoadModal(true);
  };

  const handleLoadPlan = async (planId) => {
    const { error } = await trainingPlanHook.loadPlan(planId);
    if (!error) {
      setShowLoadModal(false);
    } else {
      Alert.alert('Error', 'Failed to load training plan');
    }
  };

  const handleDelete = (planId, planNameToDelete) => {
    Alert.alert(
      'Delete Plan',
      `Delete "${planNameToDelete}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await trainingPlanHook.deletePlan(planId);
            if (error) {
              Alert.alert('Error', 'Failed to delete training plan');
            }
          },
        },
      ]
    );
  };

  const addWorkout = (day) => {
    // Expand the day if it's not already expanded
    setExpandedDays((prev) => {
      const newSet = new Set(prev);
      if (!newSet.has(day)) {
        newSet.add(day);
      }
      return newSet;
    });
    
    const existing = trainingPlanHook.plan[day]?.workouts || [];
    trainingPlanHook.updatePlan(day, 'workouts', [...existing, { ...DEFAULT_WORKOUT }]);
  };

  const removeWorkout = (day, index) => {
    const workouts = [...(trainingPlanHook.plan[day]?.workouts || [])];
    workouts.splice(index, 1);
    trainingPlanHook.updatePlan(
      day,
      'workouts',
      workouts.length ? workouts : [{ ...DEFAULT_WORKOUT }]
    );
  };

  const updateWorkout = (day, index, field, value) => {
    const workouts = [...(trainingPlanHook.plan[day]?.workouts || [{ ...DEFAULT_WORKOUT }])];
    workouts[index] = { ...workouts[index], [field]: value };
    trainingPlanHook.updatePlan(day, 'workouts', workouts);
  };

  const openPicker = (day, index, field, options) => {
    setPickerContext({ day, index, field, options });
    if (field === 'type') {
      setShowTypePicker(true);
    } else if (field === 'intensity') {
      setShowIntensityPicker(true);
    }
  };

  const handlePickerValueChange = (value) => {
    if (pickerContext.day && pickerContext.index !== null) {
      updateWorkout(pickerContext.day, pickerContext.index, pickerContext.field, value);
    }
  };


  const styles = getStyles(colors);

  if (trainingPlanHook.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading training plan…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <View style={styles.titleSection}>
            <Text style={styles.title} numberOfLines={1}>
              {trainingPlanHook.currentPlanName || 'New Training Plan'}
            </Text>
            {trainingPlanHook.currentPlanName && (
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>Active</Text>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnSecondary]}
            onPress={trainingPlanHook.createNewPlan}
          >
            <Ionicons name="add" size={18} color="#6B7280" />
            <Text style={styles.actionBtnText}>New</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnSecondary]}
            onPress={handleLoadClick}
          >
            <Ionicons name="folder-open-outline" size={18} color="#3B82F6" />
            <Text style={[styles.actionBtnText, { color: '#3B82F6' }]}>Load</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnPrimary]}
            onPress={() => setShowSaveModal(true)}
            disabled={trainingPlanHook.isSaving}
          >
            {trainingPlanHook.isSaving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="save-outline" size={18} color="#FFFFFF" />
            )}
            <Text style={[styles.actionBtnText, styles.actionBtnTextPrimary]}>
              {trainingPlanHook.isSaving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>

          {showConfirmation && (
            <View style={styles.confirmationBadge}>
              <Ionicons name="checkmark-circle" size={18} color="#10B981" />
              <Text style={styles.confirmationText}>Saved!</Text>
            </View>
          )}
        </View>
      </View>

      {/* Training Schedule */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {DAYS.map((day) => {
          const dayData = trainingPlanHook.plan[day] || { workouts: [{ ...DEFAULT_WORKOUT }] };
          const workouts = dayData.workouts?.length ? dayData.workouts : [{ ...DEFAULT_WORKOUT }];
          const plannedCount = workouts.filter((w) => isWorkoutPlanned(w)).length;

          const isExpanded = expandedDays.has(day);

          const toggleDay = () => {
            setExpandedDays((prev) => {
              const newSet = new Set(prev);
              if (newSet.has(day)) {
                newSet.delete(day);
              } else {
                newSet.add(day);
              }
              return newSet;
            });
          };

          return (
            <View key={day} style={styles.dayCard}>
              <TouchableOpacity
                style={styles.dayHeader}
                onPress={toggleDay}
                activeOpacity={0.7}
              >
                <View style={styles.dayHeaderLeft}>
                  <Ionicons
                    name={isExpanded ? 'chevron-down' : 'chevron-forward'}
                    size={18}
                    color="#6B7280"
                    style={styles.dayChevron}
                  />
                  <Ionicons name="calendar-outline" size={18} color="#6B7280" />
                  <Text style={styles.dayTitle}>{day.charAt(0).toUpperCase() + day.slice(1)}</Text>
                  {plannedCount > 0 && (
                    <View style={styles.workoutCountBadge}>
                      <Text style={styles.workoutCountText}>
                        {plannedCount} workout{plannedCount === 1 ? '' : 's'}
                      </Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.addWorkoutBtn}
                  onPress={(e) => {
                    e.stopPropagation();
                    addWorkout(day);
                  }}
                >
                  <Ionicons name="add" size={18} color="#F6921D" />
                  <Text style={styles.addWorkoutText}>Add</Text>
                </TouchableOpacity>
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.workoutsContainer}>
                  {workouts.map((workout, index) => (
                  <View
                    key={index}
                    style={[
                      styles.workoutCard,
                      { borderLeftColor: getIntensityColor(workout.intensity || 'Medium') },
                    ]}
                  >
                    {/* Workout Type */}
                    <TouchableOpacity
                      style={styles.workoutField}
                      onPress={() => openPicker(day, index, 'type', WORKOUT_TYPES)}
                    >
                      <Text style={styles.workoutFieldLabel}>Workout Type</Text>
                      <View style={styles.workoutFieldValue}>
                        {workout.type ? (
                          <View style={styles.workoutTypeRow}>
                            <Ionicons
                              name={getWorkoutIcon(workout.type)}
                              size={18}
                              color="#6B7280"
                            />
                            <Text style={styles.workoutFieldText}>{workout.type}</Text>
                          </View>
                        ) : (
                          <Text style={styles.workoutFieldPlaceholder}>Select workout</Text>
                        )}
                        <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
                      </View>
                    </TouchableOpacity>

                    {/* Distance/Duration */}
                    <View style={styles.workoutField}>
                      <Text style={styles.workoutFieldLabel}>Distance/Duration</Text>
                      <TextInput
                        style={styles.workoutInput}
                        placeholder="e.g., 5km, 30 min"
                        value={workout.distance || ''}
                        onChangeText={(text) => updateWorkout(day, index, 'distance', text)}
                        placeholderTextColor="#9CA3AF"
                        returnKeyType="done"
                      />
                    </View>

                    {/* Intensity */}
                    <TouchableOpacity
                      style={styles.workoutField}
                      onPress={() => openPicker(day, index, 'intensity', INTENSITY_LEVELS)}
                    >
                      <Text style={styles.workoutFieldLabel}>Intensity</Text>
                      <View style={styles.workoutFieldValue}>
                        <View style={styles.intensityRow}>
                          <View
                            style={[
                              styles.intensityDot,
                              { backgroundColor: getIntensityColor(workout.intensity || 'Medium') },
                            ]}
                          />
                          <Text style={styles.workoutFieldText}>
                            {workout.intensity || 'Medium'}
                          </Text>
                        </View>
                        <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
                      </View>
                    </TouchableOpacity>

                    {/* Notes */}
                    <View style={styles.workoutField}>
                      <Text style={styles.workoutFieldLabel}>Notes (optional)</Text>
                      <TextInput
                        style={[styles.workoutInput, styles.workoutInputMultiline]}
                        placeholder="Add notes..."
                        value={workout.notes || ''}
                        onChangeText={(text) => updateWorkout(day, index, 'notes', text)}
                        placeholderTextColor="#9CA3AF"
                        multiline
                        numberOfLines={2}
                        returnKeyType="done"
                        blurOnSubmit={true}
                      />
                    </View>

                    {/* Remove Button */}
                    {index > 0 && (
                      <TouchableOpacity
                        style={styles.removeWorkoutBtn}
                        onPress={() => removeWorkout(day, index)}
                      >
                        <Ionicons name="trash-outline" size={18} color="#DC2626" />
                        <Text style={styles.removeWorkoutText}>Remove</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>

      {/* Save Modal */}
      <Modal
        visible={showSaveModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSaveModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowSaveModal(false)}>
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Save Training Plan</Text>
              <TouchableOpacity onPress={() => setShowSaveModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Enter plan name (e.g., Marathon Prep Week 1)"
              value={planName}
              onChangeText={setPlanName}
              placeholderTextColor="#9CA3AF"
              autoFocus
              returnKeyType="done"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setShowSaveModal(false)}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleSave}
                disabled={trainingPlanHook.isSaving}
              >
                <Text style={styles.modalButtonTextPrimary}>
                  {trainingPlanHook.isSaving ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Load Modal */}
      <Modal
        visible={showLoadModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLoadModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowLoadModal(false)}>
          <Pressable style={styles.loadModalContent} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Load Training Plan</Text>
              <TouchableOpacity onPress={() => setShowLoadModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {trainingPlanHook.savedPlans.length === 0 ? (
              <View style={styles.emptyPlansContainer}>
                <Ionicons name="folder-open-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyPlansText}>
                  No saved training plans yet. Create and save one to see it here!
                </Text>
              </View>
            ) : (
              <ScrollView style={styles.plansList}>
                {trainingPlanHook.savedPlans.map((plan) => (
                  <View key={plan.id} style={styles.planItem}>
                    <View style={styles.planItemLeft}>
                      <Text style={styles.planItemName} numberOfLines={1}>
                        {plan.name}
                      </Text>
                      {plan.is_active && (
                        <View style={styles.activeBadgeSmall}>
                          <Text style={styles.activeBadgeTextSmall}>Active</Text>
                        </View>
                      )}
                      <Text style={styles.planItemDate}>
                        Created {new Date(plan.created_at).toLocaleDateString()}
                      </Text>
                    </View>

                    <View style={styles.planItemActions}>
                      {!plan.is_active && (
                        <TouchableOpacity
                          style={styles.planActionBtn}
                          onPress={() => handleLoadPlan(plan.id)}
                        >
                          <Text style={styles.planActionBtnText}>Load</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={[styles.planActionBtn, styles.planActionBtnDelete]}
                        onPress={() => handleDelete(plan.id, plan.name)}
                      >
                        <Ionicons name="trash-outline" size={18} color="#DC2626" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Type Picker */}
      <Picker
        visible={showTypePicker}
        options={WORKOUT_TYPES}
        selectedValue={
          pickerContext.day && pickerContext.index !== null
            ? trainingPlanHook.plan[pickerContext.day]?.workouts?.[pickerContext.index]?.type || ''
            : ''
        }
        onValueChange={handlePickerValueChange}
        onClose={() => setShowTypePicker(false)}
        title="Select Workout Type"
      />

      {/* Intensity Picker */}
      <Picker
        visible={showIntensityPicker}
        options={INTENSITY_LEVELS}
        selectedValue={
          pickerContext.day && pickerContext.index !== null
            ? trainingPlanHook.plan[pickerContext.day]?.workouts?.[pickerContext.index]
                ?.intensity || 'Medium'
            : 'Medium'
        }
        onValueChange={handlePickerValueChange}
        onClose={() => setShowIntensityPicker(false)}
        title="Select Intensity"
      />
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  headerCard: {
    backgroundColor: colors.cardBackground,
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  headerTop: {
    marginBottom: 12,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.text,
    flex: 1,
  },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.successLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.successBorder,
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.successText,
  },
  activeBadgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: colors.successLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.successBorder,
    marginLeft: 8,
  },
  activeBadgeTextSmall: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.successText,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
    minHeight: 36,
  },
  actionBtnSecondary: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionBtnPrimary: {
    backgroundColor: colors.primary,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  actionBtnTextPrimary: {
    color: colors.textInverse,
  },
  confirmationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.successLight,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.success,
    gap: 6,
  },
  confirmationText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.successText,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  dayCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    overflow: 'hidden',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.inputBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dayHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  dayChevron: {
    marginRight: 4,
  },
  dayTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    textTransform: 'capitalize',
  },
  workoutCountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: colors.cardBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  workoutCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  addWorkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.primaryLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    gap: 4,
  },
  addWorkoutText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  workoutsContainer: {
    padding: 14,
    gap: 12,
  },
  workoutCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    padding: 14,
    gap: 12,
  },
  workoutField: {
    marginBottom: 4,
  },
  workoutFieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  workoutFieldValue: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.inputBackground,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 44,
  },
  workoutTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  workoutFieldText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  workoutFieldPlaceholder: {
    fontSize: 14,
    color: colors.placeholderColor,
    flex: 1,
  },
  workoutInput: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.inputBackground,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 14,
    color: colors.text,
    minHeight: 44,
  },
  workoutInputMultiline: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  intensityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  intensityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  removeWorkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 4,
    gap: 6,
  },
  removeWorkoutText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.error,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.modalOverlay,
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 20,
  },
  loadModalContent: {
    backgroundColor: colors.cardBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.text,
  },
  modalInput: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: colors.inputBackground,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 14,
    color: colors.text,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalButtonSecondary: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalButtonPrimary: {
    backgroundColor: colors.primary,
  },
  modalButtonTextSecondary: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  modalButtonTextPrimary: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textInverse,
  },
  emptyPlansContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyPlansText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
    lineHeight: 20,
    fontWeight: '600',
  },
  plansList: {
    maxHeight: 500,
  },
  planItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: colors.inputBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  planItemLeft: {
    flex: 1,
    marginRight: 12,
  },
  planItemName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  planItemDate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    fontWeight: '600',
  },
  planItemActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  planActionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.primary,
    borderRadius: 8,
    minHeight: 36,
    justifyContent: 'center',
  },
  planActionBtnDelete: {
    backgroundColor: colors.errorLight,
    paddingHorizontal: 10,
  },
  planActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textInverse,
  },
});
