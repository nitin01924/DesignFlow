import { useCallback, useEffect, useMemo, useState } from "react";
import { CanvasHistoryManager } from "./CanvasHistoryManager.js";

const INITIAL_STATE = {
  isReady: false,
  canUndo: false,
  canRedo: false,
  isRestoring: false,
  undoLabel: null,
  redoLabel: null,
  length: 0,
};

const isFormControl = (target) =>
  target instanceof HTMLElement &&
  (target.isContentEditable ||
    target.matches("input, textarea, select, [role='textbox']"));

export function useCanvasHistory({ disabled = false, maxStates = 100 } = {}) {
  const [manager] = useState(() => new CanvasHistoryManager({ maxStates }));
  const [state, setState] = useState(INITIAL_STATE);

  useEffect(() => manager.subscribe(setState), [manager]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (
        disabled ||
        event.altKey ||
        !(event.ctrlKey || event.metaKey) ||
        event.key.toLowerCase() !== "z" ||
        isFormControl(event.target)
      ) {
        return;
      }

      event.preventDefault();
      if (event.shiftKey) {
        void manager.redo();
      } else {
        void manager.undo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [disabled, manager]);

  const attachCanvas = useCallback(
    (canvas, options) => manager.attach(canvas, options),
    [manager],
  );
  const detachCanvas = useCallback(
    (canvas) => manager.detach(canvas),
    [manager],
  );
  const reset = useCallback((action) => manager.reset(action), [manager]);
  const undo = useCallback(() => manager.undo(), [manager]);
  const redo = useCallback(() => manager.redo(), [manager]);
  const execute = useCallback(
    (action, mutation) => manager.execute(action, mutation),
    [manager],
  );
  const begin = useCallback((action) => manager.begin(action), [manager]);
  const update = useCallback(
    (action, mutation) => manager.update(action, mutation),
    [manager],
  );
  const commit = useCallback((action) => manager.commit(action), [manager]);
  const cancel = useCallback(() => manager.cancel(), [manager]);
  const getTimeline = useCallback(() => manager.getTimeline(), [manager]);

  return useMemo(
    () => ({
      ...state,
      attachCanvas,
      detachCanvas,
      reset,
      undo,
      redo,
      execute,
      begin,
      update,
      commit,
      cancel,
      getTimeline,
    }),
    [
      attachCanvas,
      begin,
      cancel,
      commit,
      detachCanvas,
      execute,
      getTimeline,
      redo,
      reset,
      state,
      undo,
      update,
    ],
  );
}
