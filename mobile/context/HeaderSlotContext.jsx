import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

const HeaderSlotStateContext = createContext(null);
const HeaderSlotActionsContext = createContext({
  setHeaderSlot: () => {},
  clearHeaderSlot: () => {},
});

export const HeaderSlotProvider = ({ children }) => {
  const [headerSlot, setHeaderSlotState] = useState(null);
  const ownerRef = useRef(null);

  // Owner-aware setter so a screen's blur cleanup can't wipe the next screen's slot.
  // Race: leaving Meals → Training often runs one screen's cleanup after the next's set.
  const setHeaderSlot = useCallback((slot, owner = 'default') => {
    ownerRef.current = owner;
    setHeaderSlotState(slot);
  }, []);

  const clearHeaderSlot = useCallback((owner = 'default') => {
    // Only the current owner may clear — prevents focus/blur races from blanking
    // the day strip after another screen has already claimed the slot.
    if (ownerRef.current === owner) {
      ownerRef.current = null;
      setHeaderSlotState(null);
    }
  }, []);

  const actions = useMemo(
    () => ({ setHeaderSlot, clearHeaderSlot }),
    [setHeaderSlot, clearHeaderSlot]
  );

  return (
    <HeaderSlotActionsContext.Provider value={actions}>
      <HeaderSlotStateContext.Provider value={headerSlot}>
        {children}
      </HeaderSlotStateContext.Provider>
    </HeaderSlotActionsContext.Provider>
  );
};

/** Subscribe to the current header slot (e.g. Layout/Header). */
export const useHeaderSlot = () => useContext(HeaderSlotStateContext);

/** Set/clear without re-rendering when the slot content changes. */
export const useHeaderSlotActions = () => useContext(HeaderSlotActionsContext);
