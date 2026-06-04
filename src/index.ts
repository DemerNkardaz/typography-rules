/**
 * Example function
 * @param name - Input name
 * @returns Formatted greeting
 *
 * @example
 * ```ts
 * greet('World') // Returns "Hello World"
 * ```
 */
export function greet(name = 'World'): string {
	return `Hello ${name}`;
}

export { smartQuotes, smartNumberSpaces, newRule, registerRule } from '@/functions';
export { CHARACTERS, PUNCTUATION, WALLET } from '@/storage';
export type * from './types';
