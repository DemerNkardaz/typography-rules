/** A plain string-to-string map used as the base shape for all glyph dictionaries. */
export type GlyphStringMap = Record<string, string>;

/** Raw glyph key-value data passed into glyph set constructors. */
export type GlyphData = Record<string, string>;

/**
 * A glyph set with typed key access and prototype utility methods.
 *
 * Combines the original data shape `T` with a set of shared methods
 * attached via prototype (see `createCharacters`).
 *
 * @template T - Raw glyph dictionary shape
 */
export type GlyphSet<T extends GlyphData = GlyphData> = {
	[K in keyof T]: T[K];
} & {
	/**
	 * Joins all glyph values into a single string.
	 *
	 * @param joiner - Separator between values. Defaults to `'|'`.
	 * @returns Joined string of all values in the set.
	 *
	 * @example
	 * DASHES.join() // '-|–|⸺|…'
	 * DASHES.join('') // '-–⸺…'
	 */
	join(joiner?: string): string;

	/**
	 * Mutably inserts new entries into the glyph set.
	 *
	 * Note: TypeScript types are not updated after insertion.
	 * Use type casting if access to inserted keys is needed statically.
	 *
	 * @param entries - Key-value pairs to add to the set.
	 *
	 * @example
	 * DASHES.insert({ myDash: '\u2E1A' });
	 */
	insert(entries: GlyphData): void;

	/**
	 * Checks whether a key exists in the glyph set.
	 *
	 * @param key - The key to look up.
	 * @returns `true` if the key is present, `false` otherwise.
	 *
	 * @example
	 * DASHES.hasKey('em') // true
	 * DASHES.hasKey('foo') // false
	 */
	hasKey(key: string): boolean;

	/**
	 * Checks whether a value exists in the glyph set.
	 *
	 * @param value - The glyph value to search for.
	 * @returns `true` if the value is present, `false` otherwise.
	 *
	 * @example
	 * DASHES.hasValue('\u2014') // true
	 */
	hasValue(value: string): boolean;

	/**
	 * Returns the key associated with a given glyph value.
	 *
	 * @param value - The glyph value to look up.
	 * @returns The corresponding key, or `undefined` if not found.
	 *
	 * @example
	 * DASHES.findKey('\u2014') // 'em'
	 * DASHES.findKey('???') // undefined
	 */
	findKey(value: string): string | undefined;

	/**
	 * Returns the values associated with given keys.
	 *
	 * @param keys - The keys to look up.
	 * @returns An array of values, or `undefined` if not found.
	 *
	 * @example
	 * DASHES.find('em', 'en') // ['-', '–']
	 * DASHES.find('foo', 'bar') // undefined
	 */
	find(...keys: string[]): string[] | undefined;
};

/**
 * Structural contract for glyph sets used in generic contexts.
 *
 * Used where the concrete type parameter `T` is not available -
 * for example, as values inside `createCharacterSet` group maps.
 *
 * The index signature allows arbitrary string keys alongside
 * the explicitly declared utility methods.
 */
export interface GlyphSetInterface {
	[key: string]:
		| string
		| ((joiner?: string) => string)
		| ((entries: GlyphData) => void)
		| ((key: string) => boolean)
		| ((value: string) => boolean)
		| ((value: string) => string | undefined)
		| ((...keys: string[]) => string[] | undefined);
	join(joiner?: string): string;
	insert(entries: GlyphData): void;
	hasKey(key: string): boolean;
	hasValue(value: string): boolean;
	findKey(value: string): string | undefined;
	find(...keys: string[]): string[] | undefined;
}

/**
 * Prototype interface for grouped character sets (e.g. `PUNCTUATION`).
 *
 * Provides locale-aware access to glyph groups via hierarchical resolution:
 * `common[key]` is merged with `locale[key]`, locale values taking precedence.
 *
 * @template T - The full character set structure, optionally containing a `common` group
 * and one or more locale groups.
 */
export interface ProtoSet<T extends { common?: Record<string, GlyphSetInterface> }> {
	/**
	 * Retrieves a merged glyph set for a given locale and group key.
	 *
	 * Merges the `common[key]` group with `locale[key]`, with locale
	 * values overriding common ones where keys collide.
	 *
	 * @param dataSet - Locale identifier (any key of `T` except `'common'`).
	 * @param key - Group key present in `common` and/or the target locale.
	 * @returns Merged glyph set for the requested locale and group.
	 *
	 * @example
	 * PUNCTUATION.get('en', 'leftSided')  // common + en leftSided merged
	 * PUNCTUATION.get('ru', 'rightSided') // common + ru rightSided merged
	 */
	get<TDataSet extends Exclude<keyof T, 'common'>, TKey extends keyof (T['common'] & T[TDataSet])>(
		this: T & ProtoSet<T>,
		dataSet: TDataSet,
		key: TKey
	): GlyphSetInterface;

	/**
	 * Returns all top-level group keys of the character set, including `'common'`.
	 *
	 * @returns Array of string keys present on the character set object.
	 *
	 * @example
	 * PUNCTUATION.getList() // ['common', 'ru', 'en', 'fr', 'is']
	 */
	getList(): (keyof T & string)[];

	/**
	 * Checks whether a given group key exists in the character set.
	 *
	 * @param key - Group key to check.
	 * @returns `true` if the key is present, `false` otherwise.
	 *
	 * @example
	 * PUNCTUATION.hasKey('en') // true
	 * PUNCTUATION.hasKey('de') // false
	 */
	hasKey(key: keyof T & string): boolean;
}
