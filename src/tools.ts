export const checkMinutes = (limit: number, activites: Array<number>) => {
  const totalMinutes = activites.reduce((sum, item) => item + sum, 0);

  return {
    totalMinutes,
    valid: totalMinutes <= limit,
  };
};
