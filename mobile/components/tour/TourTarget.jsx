import React, { useEffect, useRef, cloneElement, isValidElement, Children } from 'react';
import { View } from 'react-native';
import { useProductTour } from '../../context/ProductTourContext';

/**
 * Registers a measurable target for the product tour spotlight.
 * Zero visual change when the tour is inactive.
 *
 * Optional onTourActivate: used when Next should simulate a press for
 * measure-only targets (no child onPress), e.g. meals-first-slot.
 */
export function TourTarget({ id, children, style, onPress, onTourActivate }) {
  const ref = useRef(null);
  const { registerTarget, unregisterTarget, notifyTargetPress } = useProductTour();
  const onPressRef = useRef(onPress);
  const onTourActivateRef = useRef(onTourActivate);
  const childOnPressRef = useRef(null);

  onPressRef.current = onPress;
  onTourActivateRef.current = onTourActivate;

  useEffect(() => {
    if (!id) return undefined;

    registerTarget(id, {
      measure: () =>
        new Promise((resolve) => {
          const node = ref.current;
          if (!node || typeof node.measureInWindow !== 'function') {
            resolve(null);
            return;
          }
          node.measureInWindow((x, y, width, height) => {
            if (
              !Number.isFinite(x) ||
              !Number.isFinite(y) ||
              !Number.isFinite(width) ||
              !Number.isFinite(height) ||
              width <= 0 ||
              height <= 0
            ) {
              resolve(null);
              return;
            }
            resolve({ x, y, width, height });
          });
        }),
      press: () => {
        if (typeof onTourActivateRef.current === 'function') {
          onTourActivateRef.current();
          return;
        }
        notifyTargetPress(id);
        if (typeof onPressRef.current === 'function') {
          onPressRef.current();
        }
        if (typeof childOnPressRef.current === 'function') {
          childOnPressRef.current();
        }
      },
    });

    return () => unregisterTarget(id);
  }, [id, registerTarget, unregisterTarget, notifyTargetPress]);

  const handlePress = (event) => {
    notifyTargetPress(id);
    if (typeof onPress === 'function') {
      onPress(event);
    }
  };

  const child = Children.count(children) === 1 ? Children.only(children) : null;
  childOnPressRef.current =
    isValidElement(child) && typeof child.props.onPress === 'function'
      ? child.props.onPress
      : null;

  if (isValidElement(child) && (onPress || typeof child.props.onPress === 'function')) {
    const originalOnPress = child.props.onPress;
    return (
      <View ref={ref} collapsable={false} style={style}>
        {cloneElement(child, {
          onPress: (event) => {
            handlePress(event);
            originalOnPress?.(event);
          },
        })}
      </View>
    );
  }

  return (
    <View ref={ref} collapsable={false} style={style}>
      {children}
    </View>
  );
}
