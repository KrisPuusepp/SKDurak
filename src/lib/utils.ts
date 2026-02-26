import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[])
{
  return twMerge(clsx(inputs))
}

export function generateUUID(): string
{
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) =>
  {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Fisher–Yates (aka Knuth) Shuffle.
// Source: https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
export function shuffle(array: any[])
{
  let currentIndex = array.length;

  // While there remain elements to shuffle...
  while (currentIndex != 0)
  {

    // Pick a remaining element...
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
}

/**
 * Gets an element from an array at a specific index, 
 * wrapping around if the index is out of bounds.
 */
export function getCircularElement<T>(arr: T[], index: number): T
{
  const len = arr.length;
  if (len === 0) throw new Error("Array is empty");

  // The magic formula for circular indexing
  const circularIndex = ((index % len) + len) % len;
  return arr[circularIndex];
}

/**
 * Calculates a wrapped index for an array of a given length.
 * works for both positive and negative offsets.
 */
export const getCircularIndex = (length: number, index: number): number =>
{
  if (length <= 0) return 0; // Avoid division by zero
  return ((index % length) + length) % length;
};