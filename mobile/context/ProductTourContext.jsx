import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useSegments } from 'expo-router';
import { usePostHog } from 'posthog-react-native';
import { useAuth } from './AuthContext';
import { capture } from '../lib/analytics';
import {
  PRODUCT_TOUR_STEPS,
  TOUR_ROUTE_MAP,
  TOUR_VIEW_FROM_SEGMENT,
} from '../components/tour/tourSteps';

const ProductTourContext = createContext(undefined);

const POLL_INTERVAL_MS = 100;
const POLL_CEILING_MS = 3000;
const CUTOUT_PADDING = 8;

const storageKeyForUser = (userId) => `hasSeenProductTour_${userId}`;

const isLayoutValid = (layout) =>
  layout &&
  Number.isFinite(layout.x) &&
  Number.isFinite(layout.y) &&
  Number.isFinite(layout.width) &&
  Number.isFinite(layout.height) &&
  layout.width > 0 &&
  layout.height > 0;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function ProductTourProvider({ children }) {
  const router = useRouter();
  const segments = useSegments();
  const posthog = usePostHog();
  const { user, isGuest, loading: authLoading, getUserRole } = useAuth();

  const [isActive, setIsActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [steps, setSteps] = useState(PRODUCT_TOUR_STEPS);
  const [currentTarget, setCurrentTarget] = useState(null);
  const [awaitingTarget, setAwaitingTarget] = useState(false);

  const targetsRef = useRef(new Map());
  const isActiveRef = useRef(false);
  const stepIndexRef = useRef(0);
  const stepsRef = useRef(PRODUCT_TOUR_STEPS);
  const pollGenerationRef = useRef(0);
  const autoStartCheckedRef = useRef(false);
  const autoStartGenerationRef = useRef(0);
  const lastAutoStartUserRef = useRef(null);
  const expectedRouteRef = useRef(null);
  const navigatingRef = useRef(false);

  useEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  useEffect(() => {
    stepIndexRef.current = stepIndex;
  }, [stepIndex]);

  useEffect(() => {
    stepsRef.current = steps;
  }, [steps]);

  const currentStep = steps[stepIndex] || null;

  const markSeen = useCallback(async () => {
    if (!user?.id) return;
    try {
      await AsyncStorage.setItem(storageKeyForUser(user.id), 'true');
    } catch (error) {
      console.warn('ProductTour: failed to write seen flag', error);
    }
  }, [user?.id]);

  const track = useCallback(
    (eventName, properties = {}) => {
      capture(posthog, eventName, properties);
    },
    [posthog]
  );

  const getCurrentView = useCallback(() => {
    const leaf = segments[segments.length - 1] || 'dashboard';
    return TOUR_VIEW_FROM_SEGMENT[leaf] || leaf;
  }, [segments]);

  const navigateToRoute = useCallback(
    (routeName) => {
      if (!routeName) return;
      const path = TOUR_ROUTE_MAP[routeName];
      if (!path) return;
      if (getCurrentView() === routeName) return;
      navigatingRef.current = true;
      expectedRouteRef.current = routeName;
      router.push(path);
      // Clear navigating flag shortly after push so abandonment can detect real drifts
      setTimeout(() => {
        navigatingRef.current = false;
      }, 800);
    },
    [getCurrentView, router]
  );

  const registerTarget = useCallback((id, entry) => {
    if (!id || !entry) return;
    targetsRef.current.set(id, entry);
  }, []);

  const unregisterTarget = useCallback((id) => {
    if (!id) return;
    targetsRef.current.delete(id);
  }, []);

  const getTargetLayout = useCallback(async (id) => {
    if (!id) return null;
    const entry = targetsRef.current.get(id);
    if (!entry?.measure) return null;
    try {
      const layout = await entry.measure();
      return isLayoutValid(layout) ? layout : null;
    } catch {
      return null;
    }
  }, []);

  const stopTour = useCallback(
    async ({ reason, analyticsEvent, analyticsProps } = {}) => {
      pollGenerationRef.current += 1;
      isActiveRef.current = false;
      setIsActive(false);
      setAwaitingTarget(false);
      setCurrentTarget(null);
      setStepIndex(0);
      expectedRouteRef.current = null;
      navigatingRef.current = false;

      await markSeen();

      if (analyticsEvent) {
        track(analyticsEvent, analyticsProps);
      } else if (reason) {
        track('product_tour_abandoned', {
          stepId: stepsRef.current[stepIndexRef.current]?.id,
          reason,
        });
      }
    },
    [markSeen, track]
  );

  const resolveStepTarget = useCallback(
    async (step, generation) => {
      if (!step?.targetId) {
        if (generation !== pollGenerationRef.current) return { status: 'cancelled' };
        setCurrentTarget(null);
        setAwaitingTarget(false);
        return { status: 'ready', layout: null };
      }

      setAwaitingTarget(true);
      const startedAt = Date.now();

      while (Date.now() - startedAt < POLL_CEILING_MS) {
        if (generation !== pollGenerationRef.current || !isActiveRef.current) {
          return { status: 'cancelled' };
        }

        const layout = await getTargetLayout(step.targetId);
        if (layout) {
          if (generation !== pollGenerationRef.current) return { status: 'cancelled' };
          setCurrentTarget({
            id: step.targetId,
            ...layout,
            padding: CUTOUT_PADDING,
          });
          setAwaitingTarget(false);
          return { status: 'ready', layout };
        }

        await sleep(POLL_INTERVAL_MS);
      }

      if (generation !== pollGenerationRef.current || !isActiveRef.current) {
        return { status: 'cancelled' };
      }

      track('product_tour_step_missing_target', { stepId: step.id });
      setCurrentTarget(null);
      setAwaitingTarget(false);
      return { status: 'missing' };
    },
    [getTargetLayout, track]
  );

  const activateStep = useCallback(
    async (nextIndex, nextSteps = stepsRef.current) => {
      const step = nextSteps[nextIndex];
      if (!step) {
        await stopTour({
          analyticsEvent: 'product_tour_completed',
        });
        return;
      }

      const generation = ++pollGenerationRef.current;
      stepIndexRef.current = nextIndex;
      setStepIndex(nextIndex);
      expectedRouteRef.current = step.route || null;

      if (step.route) {
        navigateToRoute(step.route);
      }

      track('product_tour_step', { stepId: step.id, stepIndex: nextIndex });

      const result = await resolveStepTarget(step, generation);
      if (result.status === 'missing') {
        // Auto-advance so we never hang on a blank overlay
        const following = nextIndex + 1;
        if (following < nextSteps.length) {
          activateStep(following, nextSteps);
        } else {
          await stopTour({ analyticsEvent: 'product_tour_completed' });
        }
      }
    },
    [navigateToRoute, resolveStepTarget, stopTour, track]
  );

  const startTour = useCallback(
    async (stepsArray) => {
      const nextSteps =
        Array.isArray(stepsArray) && stepsArray.length > 0
          ? stepsArray
          : PRODUCT_TOUR_STEPS;

      stepsRef.current = nextSteps;
      setSteps(nextSteps);
      navigatingRef.current = true;
      isActiveRef.current = true;
      setIsActive(true);
      setCurrentTarget(null);
      setAwaitingTarget(false);
      track('product_tour_started');
      await activateStep(0, nextSteps);
      // Keep navigating guard briefly for settings → dashboard replay
      setTimeout(() => {
        navigatingRef.current = false;
      }, 800);
    },
    [activateStep, track]
  );

  const next = useCallback(async () => {
    if (!isActiveRef.current) return;
    const following = stepIndexRef.current + 1;
    if (following >= stepsRef.current.length) {
      await stopTour({ analyticsEvent: 'product_tour_completed' });
      return;
    }
    await activateStep(following);
  }, [activateStep, stopTour]);

  const back = useCallback(async () => {
    if (!isActiveRef.current) return;
    let previous = stepIndexRef.current - 1;
    // Skip ephemeral modal step when backing up — the generate sheet won't be open
    while (previous >= 0 && stepsRef.current[previous]?.id === 'meals_generate') {
      previous -= 1;
    }
    if (previous < 0) return;
    await activateStep(previous);
  }, [activateStep]);

  const skip = useCallback(async () => {
    if (!isActiveRef.current) return;
    const step = stepsRef.current[stepIndexRef.current];
    await stopTour({
      analyticsEvent: 'product_tour_skipped',
      analyticsProps: {
        stepId: step?.id,
        stepIndex: stepIndexRef.current,
      },
    });
  }, [stopTour]);

  const finish = useCallback(async () => {
    if (!isActiveRef.current) return;
    await stopTour({ analyticsEvent: 'product_tour_completed' });
  }, [stopTour]);

  const notifyTargetPress = useCallback(
    (id) => {
      if (!isActiveRef.current) return;
      const step = stepsRef.current[stepIndexRef.current];
      if (!step || step.targetId !== id) return;

      if (step.advanceOn === 'mealGenerated') {
        // Hide spotlight while generation runs; meals.jsx advances on success.
        setAwaitingTarget(true);
        setCurrentTarget(null);
        return;
      }

      if (step.advanceOn !== 'targetPress') return;
      next();
    },
    [next]
  );

  /** Escape hatch when a modal/sheet closes without pressing the highlighted action. */
  const notifyTargetDismissed = useCallback(
    (id) => {
      if (!isActiveRef.current) return;
      const step = stepsRef.current[stepIndexRef.current];
      if (!step || step.targetId !== id) return;
      if (step.id !== 'meals_generate') return;
      next();
    },
    [next]
  );

  const remeasureCurrentTarget = useCallback(async () => {
    if (!isActiveRef.current) return;
    const step = stepsRef.current[stepIndexRef.current];
    if (!step?.targetId) return;
    const layout = await getTargetLayout(step.targetId);
    if (layout) {
      setCurrentTarget({
        id: step.targetId,
        ...layout,
        padding: CUTOUT_PADDING,
      });
    }
  }, [getTargetLayout]);

  // Remeasure while a step with a target is showing (orientation / layout shifts)
  useEffect(() => {
    if (!isActive || !currentStep?.targetId || awaitingTarget) return undefined;

    const intervalId = setInterval(() => {
      remeasureCurrentTarget();
    }, 500);

    return () => clearInterval(intervalId);
  }, [isActive, currentStep?.targetId, awaitingTarget, remeasureCurrentTarget]);

  // Abandon if app backgrounds mid-tour
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (!isActiveRef.current) return;
      if (nextState === 'background') {
        stopTour({ reason: 'app_backgrounded' });
      }
    });
    return () => sub.remove();
  }, [stopTour]);

  // Abandon if user navigates outside the tour's expected route
  useEffect(() => {
    if (!isActive) return;
    if (navigatingRef.current) return;

    const expected = expectedRouteRef.current;
    if (!expected) return;

    const currentView = getCurrentView();
    const inApp = segments[0] === '(app)';
    if (!inApp) {
      stopTour({ reason: 'left_app_shell' });
      return;
    }

    // Allow transient mismatch briefly after push; hard-nav away from expected kills tour
    if (currentView !== expected) {
      // Footer/header nav during allowTargetPress steps is intentional — those steps
      // advance via notifyTargetPress. Only abandon when the new view isn't the
      // current or next step's route.
      const step = stepsRef.current[stepIndexRef.current];
      const nextStep = stepsRef.current[stepIndexRef.current + 1];
      const allowed = new Set(
        [step?.route, nextStep?.route, expected].filter(Boolean)
      );
      if (!allowed.has(currentView)) {
        stopTour({ reason: 'route_mismatch' });
      }
    }
  }, [isActive, segments, getCurrentView, stopTour]);

  // Reset auto-start gate when switching accounts (not on first assign)
  useEffect(() => {
    const prev = lastAutoStartUserRef.current;
    if (prev === user?.id) return;
    lastAutoStartUserRef.current = user?.id ?? null;
    if (prev != null) {
      autoStartCheckedRef.current = false;
      autoStartGenerationRef.current += 1;
    }
  }, [user?.id]);

  // Auto-start once for authenticated client users when entering (app)
  useEffect(() => {
    if (authLoading || isGuest || !user?.id) return;
    if (autoStartCheckedRef.current) return;
    if (segments[0] !== '(app)') return;

    const generation = ++autoStartGenerationRef.current;
    let cancelled = false;

    const maybeStart = async () => {
      try {
        const role = await getUserRole?.();
        if (cancelled || generation !== autoStartGenerationRef.current) return;
        if (role === 'nutritionist') {
          autoStartCheckedRef.current = true;
          return;
        }

        const seen = await AsyncStorage.getItem(storageKeyForUser(user.id));
        if (cancelled || generation !== autoStartGenerationRef.current) return;

        autoStartCheckedRef.current = true;
        if (seen === 'true') return;

        await startTour();
      } catch (error) {
        console.warn('ProductTour: auto-start failed', error);
        if (!cancelled && generation === autoStartGenerationRef.current) {
          autoStartCheckedRef.current = true;
        }
      }
    };

    maybeStart();
    return () => {
      cancelled = true;
    };
  }, [authLoading, isGuest, user?.id, segments, getUserRole, startTour]);

  const value = useMemo(
    () => ({
      isActive,
      stepIndex,
      steps,
      currentStep,
      currentTarget,
      awaitingTarget,
      startTour,
      next,
      back,
      skip,
      finish,
      registerTarget,
      unregisterTarget,
      getTargetLayout,
      notifyTargetPress,
      notifyTargetDismissed,
      remeasureCurrentTarget,
      navigateToRoute,
    }),
    [
      isActive,
      stepIndex,
      steps,
      currentStep,
      currentTarget,
      awaitingTarget,
      startTour,
      next,
      back,
      skip,
      finish,
      registerTarget,
      unregisterTarget,
      getTargetLayout,
      notifyTargetPress,
      notifyTargetDismissed,
      remeasureCurrentTarget,
      navigateToRoute,
    ]
  );

  return (
    <ProductTourContext.Provider value={value}>{children}</ProductTourContext.Provider>
  );
}

export function useProductTour() {
  const ctx = useContext(ProductTourContext);
  if (!ctx) {
    throw new Error('useProductTour must be used within a ProductTourProvider');
  }
  return ctx;
}
