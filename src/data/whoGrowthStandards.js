// Hardcoded WHO Child Growth Standards reference points.
// Values are monthly interpolated from commonly used -2SD / median / +2SD tables
// for 0-24 months. The app treats -2SD..+2SD as the quick "normal range" band.

const WEIGHT_BOY = [
  [0, 2.5, 3.3, 4.4], [1, 3.4, 4.5, 5.8], [2, 4.3, 5.6, 7.1],
  [3, 5.0, 6.4, 8.0], [4, 5.6, 7.0, 8.7], [5, 6.0, 7.5, 9.3],
  [6, 6.4, 7.9, 9.8], [7, 6.7, 8.3, 10.3], [8, 6.9, 8.6, 10.7],
  [9, 7.1, 8.9, 11.0], [10, 7.4, 9.2, 11.4], [11, 7.6, 9.4, 11.7],
  [12, 7.7, 9.6, 12.0], [13, 7.9, 9.9, 12.3], [14, 8.1, 10.1, 12.6],
  [15, 8.3, 10.3, 12.8], [16, 8.4, 10.5, 13.1], [17, 8.6, 10.7, 13.4],
  [18, 8.8, 10.9, 13.7], [19, 8.9, 11.1, 13.9], [20, 9.1, 11.3, 14.2],
  [21, 9.2, 11.5, 14.5], [22, 9.4, 11.8, 14.7], [23, 9.5, 12.0, 15.0],
  [24, 9.7, 12.2, 15.3],
];

const WEIGHT_GIRL = [
  [0, 2.4, 3.2, 4.2], [1, 3.2, 4.2, 5.5], [2, 3.9, 5.1, 6.6],
  [3, 4.5, 5.8, 7.5], [4, 5.0, 6.4, 8.2], [5, 5.4, 6.9, 8.8],
  [6, 5.7, 7.3, 9.3], [7, 6.0, 7.6, 9.8], [8, 6.3, 7.9, 10.2],
  [9, 6.5, 8.2, 10.5], [10, 6.7, 8.5, 10.9], [11, 6.9, 8.7, 11.2],
  [12, 7.0, 8.9, 11.5], [13, 7.2, 9.2, 11.8], [14, 7.4, 9.4, 12.1],
  [15, 7.6, 9.6, 12.4], [16, 7.7, 9.8, 12.6], [17, 7.9, 10.0, 12.9],
  [18, 8.1, 10.2, 13.2], [19, 8.2, 10.4, 13.5], [20, 8.4, 10.6, 13.7],
  [21, 8.6, 10.9, 14.0], [22, 8.7, 11.1, 14.3], [23, 8.9, 11.3, 14.6],
  [24, 9.0, 11.5, 14.8],
];

const LENGTH_BOY = [
  [0, 46.1, 49.9, 53.7], [1, 50.8, 54.7, 58.6], [2, 54.4, 58.4, 62.4],
  [3, 57.3, 61.4, 65.5], [4, 59.7, 63.9, 68.0], [5, 61.7, 65.9, 70.1],
  [6, 63.3, 67.6, 71.9], [7, 64.8, 69.2, 73.5], [8, 66.2, 70.6, 75.0],
  [9, 67.5, 72.0, 76.5], [10, 68.7, 73.3, 77.9], [11, 69.9, 74.5, 79.2],
  [12, 71.0, 75.7, 80.5], [13, 72.1, 76.9, 81.8], [14, 73.1, 78.0, 83.0],
  [15, 74.1, 79.1, 84.2], [16, 75.0, 80.2, 85.4], [17, 76.0, 81.2, 86.5],
  [18, 76.9, 82.3, 87.7], [19, 77.7, 83.2, 88.8], [20, 78.6, 84.2, 89.8],
  [21, 79.4, 85.1, 90.9], [22, 80.2, 86.0, 91.9], [23, 81.0, 86.9, 92.9],
  [24, 81.7, 87.8, 93.9],
];

const LENGTH_GIRL = [
  [0, 45.4, 49.1, 52.9], [1, 49.8, 53.7, 57.6], [2, 53.0, 57.1, 61.1],
  [3, 55.6, 59.8, 64.0], [4, 57.8, 62.1, 66.4], [5, 59.6, 64.0, 68.5],
  [6, 61.2, 65.7, 70.3], [7, 62.7, 67.3, 71.9], [8, 64.0, 68.7, 73.5],
  [9, 65.3, 70.1, 75.0], [10, 66.5, 71.5, 76.4], [11, 67.7, 72.8, 77.8],
  [12, 68.9, 74.0, 79.2], [13, 70.0, 75.2, 80.5], [14, 71.0, 76.4, 81.7],
  [15, 72.0, 77.5, 83.0], [16, 73.0, 78.6, 84.2], [17, 74.0, 79.7, 85.4],
  [18, 74.9, 80.7, 86.5], [19, 75.8, 81.7, 87.6], [20, 76.7, 82.7, 88.7],
  [21, 77.5, 83.7, 89.8], [22, 78.4, 84.6, 90.8], [23, 79.2, 85.5, 91.9],
  [24, 80.0, 86.4, 92.9],
];

const HEAD_BOY = [
  [0, 32.1, 34.5, 36.9], [1, 35.1, 37.3, 39.5], [2, 36.9, 39.1, 41.3],
  [3, 38.3, 40.5, 42.7], [4, 39.4, 41.6, 43.9], [5, 40.3, 42.6, 44.8],
  [6, 41.0, 43.3, 45.6], [7, 41.7, 44.0, 46.3], [8, 42.2, 44.5, 46.9],
  [9, 42.6, 45.0, 47.4], [10, 43.0, 45.4, 47.8], [11, 43.4, 45.8, 48.2],
  [12, 43.6, 46.1, 48.5], [13, 43.9, 46.3, 48.8], [14, 44.1, 46.6, 49.0],
  [15, 44.3, 46.8, 49.3], [16, 44.5, 47.0, 49.5], [17, 44.7, 47.2, 49.7],
  [18, 44.9, 47.4, 49.9], [19, 45.0, 47.5, 50.0], [20, 45.2, 47.7, 50.2],
  [21, 45.3, 47.8, 50.4], [22, 45.4, 48.0, 50.5], [23, 45.6, 48.1, 50.7],
  [24, 45.7, 48.3, 50.8],
];

const HEAD_GIRL = [
  [0, 31.7, 33.9, 36.1], [1, 34.3, 36.5, 38.8], [2, 36.0, 38.3, 40.5],
  [3, 37.2, 39.5, 41.8], [4, 38.2, 40.6, 42.9], [5, 39.0, 41.5, 43.8],
  [6, 39.7, 42.2, 44.6], [7, 40.4, 42.8, 45.3], [8, 40.9, 43.4, 45.9],
  [9, 41.3, 43.8, 46.3], [10, 41.7, 44.2, 46.8], [11, 42.0, 44.6, 47.1],
  [12, 42.3, 44.9, 47.5], [13, 42.6, 45.2, 47.7], [14, 42.9, 45.4, 48.0],
  [15, 43.1, 45.7, 48.2], [16, 43.3, 45.9, 48.5], [17, 43.5, 46.1, 48.7],
  [18, 43.7, 46.2, 48.9], [19, 43.8, 46.4, 49.0], [20, 44.0, 46.6, 49.2],
  [21, 44.1, 46.7, 49.4], [22, 44.3, 46.9, 49.5], [23, 44.4, 47.0, 49.7],
  [24, 44.6, 47.2, 49.8],
];

export const WHO_GROWTH_STANDARDS = {
  weight: { boy: WEIGHT_BOY, girl: WEIGHT_GIRL },
  height: { boy: LENGTH_BOY, girl: LENGTH_GIRL },
  head: { boy: HEAD_BOY, girl: HEAD_GIRL },
};

export const GROWTH_METRICS = {
  weight: { label: 'Cân nặng', unit: 'kg', icon: 'weight', decimals: 1 },
  height: { label: 'Chiều cao', unit: 'cm', icon: 'ruler', decimals: 1 },
  head: { label: 'Chu vi đầu', unit: 'cm', icon: 'baby', decimals: 1 },
};

export function normalizeGender(gender) {
  return gender === 'girl' ? 'girl' : 'boy';
}

export function getAgeMonths(birthDate, dateLike = new Date()) {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const date = new Date(dateLike);
  if (Number.isNaN(birth.getTime()) || Number.isNaN(date.getTime())) return null;
  return Math.max(0, (date.getTime() - birth.getTime()) / 2629800000);
}

export function getWHOStandard(metric, gender, monthAge) {
  const data = WHO_GROWTH_STANDARDS[metric]?.[normalizeGender(gender)];
  if (!data || monthAge == null) return null;
  const month = Math.max(0, Math.min(24, monthAge));
  const lowerPoint = [...data].reverse().find(point => point[0] <= month) || data[0];
  const upperPoint = data.find(point => point[0] >= month) || data[data.length - 1];

  if (lowerPoint[0] === upperPoint[0]) {
    return { month, lower: lowerPoint[1], median: lowerPoint[2], upper: lowerPoint[3] };
  }

  const ratio = (month - lowerPoint[0]) / (upperPoint[0] - lowerPoint[0]);
  const lerp = (a, b) => a + (b - a) * ratio;
  return {
    month,
    lower: lerp(lowerPoint[1], upperPoint[1]),
    median: lerp(lowerPoint[2], upperPoint[2]),
    upper: lerp(lowerPoint[3], upperPoint[3]),
  };
}

export function evaluateGrowthValue(metric, gender, monthAge, value) {
  if (value == null || value === '') return null;
  const standard = getWHOStandard(metric, gender, monthAge);
  if (!standard) return null;
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return null;

  if (numeric < standard.lower) return { status: 'under', label: 'Dưới ngưỡng', standard };
  if (numeric > standard.upper) return { status: 'over', label: 'Trên ngưỡng', standard };
  return { status: 'normal', label: 'Trong ngưỡng tốt', standard };
}
