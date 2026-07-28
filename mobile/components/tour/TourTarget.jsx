import React, { useEffect, useRef, cloneElement, isValidElement, Children } from 'react';
import { View } from 'react-native';
import { useProductTour } from '../../context/ProductTourContext';

/**
 * Registers a measurable target for the product tour spotlight.
 * Zero visual change when the tour is inactive.
 */
export function TourTarget({ id, children, style, onPress }) {
  const ref = useRef(null);
  const { registerTarget, unregisterTarget, notifyTargetPress } = useProductTour();

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
    });

    return () => unregisterTarget(id);
  }, [id, registerTarget, unregisterTarget]);

  const handlePress = (event) => {
    notifyTargetPress(id);
    if (typeof onPress === 'function') {
      onPress(event);
    }
  };

  const child = Children.count(children) === 1 ? Children.only(children) : null;

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
