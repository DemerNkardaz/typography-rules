export type StringMap = Record<string, string>;

export type CharacterData = Record<string, string>;

export type CharacterSet<T extends CharacterData = CharacterData> = {
	[K in keyof T]: T[K];
} & {
	join(joiner?: string): string;
};

export interface AnyCharacterSet {
	[key: string]: string | ((joiner?: string) => string);
	join(joiner?: string): string;
}

export interface ProtoSet<T extends { common?: Record<string, AnyCharacterSet> }> {
	get<TDataSet extends Exclude<keyof T, 'common'>, TKey extends keyof (T['common'] & T[TDataSet])>(
		this: T & ProtoSet<T>,
		dataSet: TDataSet,
		key: TKey
	): AnyCharacterSet;
}
