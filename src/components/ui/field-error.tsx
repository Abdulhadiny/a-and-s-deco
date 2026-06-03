"use client";

export function FieldError({
  error,
  id,
}: {
  error?: { message?: string };
  id?: string;
}) {
  if (!error?.message) return null;
  return (
    <p id={id} role="alert" className="text-sm text-rose-500 mt-1 font-medium">
      {error.message}
    </p>
  );
}
