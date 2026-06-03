"use client";

import { useState, useCallback } from "react";

export function useFormConfirmation<T>() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingData, setPendingData] = useState<T | null>(null);

  const onPreSubmit = useCallback((data: T) => {
    setPendingData(data);
    setShowConfirm(true);
  }, []);

  const resetConfirmation = useCallback(() => {
    setShowConfirm(false);
    setPendingData(null);
  }, []);

  return { showConfirm, setShowConfirm, pendingData, onPreSubmit, resetConfirmation };
}
