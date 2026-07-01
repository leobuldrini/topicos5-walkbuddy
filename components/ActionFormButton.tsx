type ActionResult = { error?: string; ok?: boolean } | void;

export function ActionFormButton({
  action,
  label,
  variant = "default",
}: {
  action: () => Promise<ActionResult>;
  label: string;
  variant?: "default" | "danger" | "secondary";
}) {
  const className =
    variant === "danger"
      ? "rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
      : variant === "secondary"
        ? "rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
        : "rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white";

  async function formAction() {
    "use server";
    await action();
  }

  return (
    <form action={formAction}>
      <button type="submit" className={className}>
        {label}
      </button>
    </form>
  );
}
