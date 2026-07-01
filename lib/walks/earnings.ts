export function summarizeEarnings(walks: { status: string; price_estimate: number }[]) {
  const completedWalks = walks.filter((walk) => walk.status === "concluido");

  return {
    completed: completedWalks.length,
    total: completedWalks.reduce((sum, walk) => sum + Number(walk.price_estimate), 0),
  };
}
