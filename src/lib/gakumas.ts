function calculatePointByLine(line: number) {
  const boundaries = [1500, 2250, 3050, 3450, 3650];
  const baseValues = [0, 5000, 10000, 20000, 30000, 40000];
  const factors = [0.3, 0.15, 0.08, 0.04, 0.02, 0.01];

  for (let i = 0; i < boundaries.length; i++) {
    if (line < boundaries[i]) {
      return (
        baseValues[i] + (line - (i > 0 ? boundaries[i - 1] : 0)) / factors[i]
      );
    }
  }
  return (
    baseValues[boundaries.length] +
    (line - boundaries[boundaries.length - 1]) / factors[boundaries.length]
  );
}

export function calculateGakumasPoints(status: number[]) {
  const winnerStatus = status.map(e => Math.min(1500, e + 30));
  const stageTotal = Math.floor(
    winnerStatus.reduce((prev, current) => prev + current) * 2.3,
  );
  const [S, APlus, A] = [13000, 11500, 10000].map(e =>
    Math.ceil(calculatePointByLine(e - 1700 - stageTotal)),
  );
  return {
    stageTotal,
    SPlus: 0,
    S,
    APlus,
    A,
  };
}

export function calculateGakumasPointsMaster(status: number[]) {
  const winnerStatus = status.map(e => Math.min(1800, e + 30));
  const stageTotal = Math.floor(
    winnerStatus.reduce((prev, current) => prev + current) * 2.3,
  );
  const [SPlus, S, APlus] = [14500, 13000, 11500].map(e =>
    Math.ceil(calculatePointByLine(e - 1700 - stageTotal)),
  );
  return {
    stageTotal,
    SPlus,
    S,
    APlus,
    A: 0,
  };
}

export function isMaster(status: number[]) {
  const sum = status.reduce((prev, current) => prev + current);
  const overflowed = status.some(e => e > 1500);
  return overflowed || sum > 3700;
}
