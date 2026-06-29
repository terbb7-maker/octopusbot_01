type AuthFormMessageProps = {
  error?: string;
  success?: string;
};

export function AuthFormMessage({ error, success }: AuthFormMessageProps) {
  const message = error ?? success;

  if (!message) {
    return null;
  }

  return (
    <p
      className={
        error
          ? "rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          : "rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300"
      }
    >
      {message}
    </p>
  );
}
