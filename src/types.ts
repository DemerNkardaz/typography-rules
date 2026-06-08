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
 * @property label — Descriptive name of the function rule
 * @property kind — Rule type identifier ("function")
 * @property rule — Function applied to full text input
 * @property args — Optional arguments passed to the rule function
 */
export type FunctionRule<
	TArgs extends unknown[] = unknown[],
	TFn extends (text: string, ...args: TArgs) => string = (text: string, ...args: TArgs) => string,
> = BaseRule & {
	label: string;
	kind: 'function';
	rule: TFn;
	args: TArgs;
};

/**
 * Typography rule that transforms RegExp matches into DOM/Tree nodes.
 *
 * @property label — Descriptive name of the node rule
 * @property kind — Rule type identifier ("node")
 * @property rule — Regular expression used for matching text
 * @property nodes — Function that maps a RegExp match to a Node structure
 */
export type NodeFunctionRule = BaseRule & {
	label: string;
	kind: 'node';
	rule: RegExp;
	nodes: (match: RegExpExecArray) => Node;
};

/**
 * Generic typography processing function signature.
 *
 * Accepts a text input and optional additional arguments,
 * and returns a transformed string or a set of nodes.
 */
export type RuleFunction = (text: string, ...args: never[]) => string | Node[];

/**
 * Union type representing all available typography rule variants.
 *
 * Includes:
 * — RegExp-based replacement rules
 * — RegExp-based transform rules
 * — Function-based rules
 * — Node-based rules
 */
export type Rule = RegExpReplaceRule | RegExpTransformRule | FunctionRule | NodeFunctionRule;

/**
 * Represents a basic text leaf node in the document structure.
 *
 * @property type — Node discriminator ("text")
 * @property value — The raw text content
 */
export interface TextNode {
	type: 'text';
	value: string;
}

/**
 * Represents an element node containing children in the document structure.
 *
 * @property type — The element tag or identifier
 * @property className — Optional CSS class for the element
 * @property attrs — Optional key-value map of HTML attributes
 * @property children — Array of child nodes
 */
export interface ElementNode {
	type: string;
	className?: string;
	attrs?: Record<string, string>;
	children: Node[];
}

/**
 * Union type representing a node within the document tree.
 */
export type Node = TextNode | ElementNode;

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
 * @property separator — Character used as a spacing separator
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
export interface RuntSettings {
	threshold?: number;
	space?: Spaces | string;
}

/**
 * Configuration for rules that convert text matches into HTML structures.
 *
 * @property expression — RegExp used to identify target text
 * @property nodes — Factory function to generate Node structures from matches
 */
export interface HtmlNodeSettings {
	expression?: RegExp;
	nodes?: (match: RegExpExecArray) => Node;
}

/**
 * Base configuration for text wrappers.
 *
 * @property marker — String used to identify the wrap boundaries
 * @property wrapper — The opening and closing strings to wrap text with
 */
export interface WrapperBaseSettings {
	marker?: string;
	wrapper?: [string, string];
}

/**
 * Settings for wrapping text within specific HTML tags.
 *
 * @property tag — The HTML tag to use for wrapping
 */
export interface WrapWithTagsSettings extends WrapperBaseSettings {
	tag?: string;
}

/**
 * Settings for ruby annotation text formatting.
 */
export type RubyTextSettings = WrapperBaseSettings;

/**
 * Settings for chemical notation formatting.
 */
export type ChemNotationSettings = WrapperBaseSettings;

/**
 * General configuration for HTML tag output.
 *
 * @property className — CSS class to apply to the generated tag
 * @property attrs — Additional HTML attributes for the generated tag
 */
export interface TagSettings {
	className?: string;
	attrs?: Record<string, string>;
}
