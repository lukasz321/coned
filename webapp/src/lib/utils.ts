import { abbrevDaysOfWeek, daysOfWeek } from "./constants";

export function withOrdinalSuffix(day: number): string {
  // Given a day number of the month, append an ordinal suffix.
  // ex. 2 -> 2nd, 21 -> 21st, 17 -> 17th
  if (day >= 11 && day <= 13) {
    return day + "th";
  }
  switch (day % 10) {
    case 1:
      return day + "st";
    case 2:
      return day + "nd";
    case 3:
      return day + "rd";
    default:
      return day + "th";
  }
}

export function calculateMean(arrayOfNumbers: number[]): number {
  const total = arrayOfNumbers.reduce((acc, c) => acc + c, 0);
  return total / arrayOfNumbers.length;
}

export function toWeekdayName(date: Date, abbreviated: boolean = false) {
  const today = new Date();

  if (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  ) {
    return "Today";
  }

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  ) {
    return "Yesterday";
  } else {
    if (abbreviated) {
      return abbrevDaysOfWeek[date.getDay()];
    }
    return daysOfWeek[date.getDay()];
  }
}

export const numHoursToTimeString = (width: number) => {
  if (width <= 96) return `${width}h`;
  else if (width <= 30 * 24) return `${(width / 24).toFixed(0)}d`;
  else return `${(width / 24 / 7).toFixed(0)}wk`;
};
