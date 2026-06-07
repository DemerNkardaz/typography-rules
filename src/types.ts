import type { Spaces } from '@/glyphs';

/**
 * Base configuration for all typography rules.
 *
 * Provides shared properties such as execution priority.
 *
 * @property weight — Optional execution weight used for sorting rules.
 * Lower values are executed earlier.
 */
export interface BaseRule {
	weight?: number;
}

/**
 * Typography rule that performs direct string replacement using RegExp.
 *
 * Matches a pattern and replaces it with a static string value.
 *
 * @property kind — Rule type identifier ("replace")
 * @property rule — Regular expression used for matching text
 * @property replacement — Replacement string applied to matches
 */
export type RegExpReplaceRule = BaseRule & {
	kind: 'replace';
	rule: RegExp;
	replacement: string;
};

/**
 * Typography rule that transforms matched RegExp results dynamically.
 *
 * Unlike replace rules, transformation logic is computed per match.
 *
 * @property kind — Rule type identifier ("transform")
 * @property rule — Regular expression used for matching text
 * @property transform — Function that returns replacement string for each match
 */
export type RegExpTransformRule = BaseRule & {
	kind: 'transform';
	rule: RegExp;
	transform: (match: RegExpExecArray) => string;
};

/**
 * Typography rule based on a custom processing function.
 *
 * Used for complex transformations that cannot be expressed with RegExp.
 *
 * @property kind — Rule type identifier ("function")
 * @property rule — Function applied to full text input
 * @property args — Optional arguments passed to the rule function
 */
export type FunctionRule<
	TArgs extends unknown[] = unknown[],
	TFn extends (text: string, ...args: TArgs) => string = (text: string, ...args: TArgs) => string,
> = BaseRule & {
	kind: 'function';
	rule: TFn;
	args: TArgs;
};

/**
 * Generic typography processing function signature.
 *
 * Accepts a text input and optional additional arguments,
 * and returns a transformed string.
 */
export type RuleFunction = (text: string, ...args: never[]) => string;

/**
 * Union type representing all available typography rule variants.
 *
 * Includes:
 * — RegExp-based replacement rules
 * — RegExp-based transform rules
 * — Function-based rules
 */
export type Rule = RegExpReplaceRule | RegExpTransformRule | FunctionRule;

// Function’s types

/**
 * Configuration for smart quote transformation.
 *
 * Defines outer and inner quotation marks used during nesting.
 *
 * @property outer — Primary quote pair [opening, closing]
 * @property inner — Nested quote pair [opening, closing]
 */
export interface QuoteSettings {
	outer?: [string, string];
	inner?: [string, string];
}

/**
 * Configuration for numeric spacing rules.
 *
 * Controls how spacing is applied inside numeric expressions.
 *
 * @property minLength — Minimum digit length required to apply spacing
 * @property separateFloat — Whether to format fractional parts separately
 * @property spaceCharacter — Character used as a spacing separator
 */
export interface NumberSpaceSettings {
	minLength?: number;
	separateFloat?: boolean;
	separator?: Spaces | string;
}

/**
 * Configuration for space removal rules.
 *
 * @property spaces — Array of space characters to remove
 */
export interface ClearSpacesSettings {
	spaces?: Spaces[] | string[];
}

/**
 * Configuration for runt handling.
 *
 * @property threshold — Threshold value for runt detection
 * @property space — Space character used for runt replacement
 */
export interface runtSettings {
	threshold?: number;
	space?: Spaces | string;
}
