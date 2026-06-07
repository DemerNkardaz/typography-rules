/**
 * Raw map of named RegExp patterns.
 *
 * Used as input to `createPatterns` to build a pattern registry
 * with prototype utilities and safe per-access instantiation.
 */
export type PatternData = Record<string, RegExp>;

/**
 * A pattern registry with prototype utilities attached.
 *
 * Each key from the source `PatternData` becomes a readonly accessor
 * that returns a fresh `RegExp` instance on every access, preventing
 * `lastIndex` pollution from the `g` flag across multiple calls.
 *
 * @template T — Shape of the source pattern map
 */
export type PatternSet<T extends PatternData> = {
	readonly [K in keyof T]: RegExp;
} & Record<string, RegExp | undefined> & {
		/**
		 * Returns all RegExp patterns from the registry.
		 *
		 * Each access returns fresh `RegExp` instances with `lastIndex = 0`,
		 * preventing stateful issues with the `g` flag.
		 *
		 * Used when applying batch protection in preprocessing pipelines.
		 */
		readonly values: RegExp[];

		/**
		 * Returns a single RegExp that combines all patterns via alternation.
		 *
		 * Built from `.source` of each pattern — safe to cache, as `lastIndex`
		 * is not involved at construction time.
		 *
		 * Prefer this over iterating `.values` with sequential `.replace()` calls —
		 * a single combined pass prevents one pattern from corrupting input for another.
		 *
		 * @param flags — RegExp flags for the combined pattern (default: `'g'`)
		 */
		combined(flags?: string): RegExp;

		/**
		 * Populates the registry with new patterns.
		 *
		 * Each pattern is stored as a getter that returns a new `RegExp` instance
		 * on every access, ensuring `lastIndex` is always reset to `0` regardless
		 * of how the pattern was previously used.
		 *
		 * @param patterns — Raw map of named RegExp patterns
		 */
		insert(patterns: PatternData): void;

		/**
		 * Iterator over all RegExp patterns in the registry.
		 *
		 * Each access returns fresh `RegExp` instances with `lastIndex = 0`,
		 * preventing stateful issues with the `g` flag.
		 *
		 * Enables usage in for..of loops, spreading, and pipeline-based processing.
		 */
		[Symbol.iterator](): Iterator<RegExp>;
	};

/**
 * Prototype object attached to all pattern registries created by `createPatterns`.
 *
 * Provides shared `values` getter and `Symbol.iterator` without polluting
 * the enumerable key space of the registry itself.
 *
 * Mirrors the role of `proto` in `createCharacters` from the glyphs module.
 */
export interface PatternProto {
	readonly values: RegExp[];
	combined(flags?: string): RegExp;
	insert(patterns: PatternData): void;
	[Symbol.iterator](): Iterator<RegExp>;
}
