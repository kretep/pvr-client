
export const activities = [
  { value: "huttenbouw", label: "Huttenbouw", shortLabel: "hb" },
  { value: "sportenspel", label: "Sport & spel", shortLabel: "sp" },
  { value: "knutselen", label: "Knutselen", shortLabel: "kn" },
  { value: "theater", label: "Theater", shortLabel: "th" },
  { value: "workshop1", label: "Workshop 1", shortLabel: "ws1" },
  { value: "workshop2", label: "Workshop 2", shortLabel: "ws2" }
];

export function getActivityShortLabel(activityValue) {
  return activities.find(item => item.value === activityValue).shortLabel;
}

export function getShortActivities(activity1, activity2) {
  if (activity1 === activity2) {
    return getActivityShortLabel(activity1);
  }
  return `${getActivityShortLabel(activity1)}/${getActivityShortLabel(activity2)}`;
}
