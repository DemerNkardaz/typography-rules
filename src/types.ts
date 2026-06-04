export interface BaseRule {
	weight?: number;
}

export type RegExpReplaceRule = BaseRule & {
	kind: 'replace';
	rule: RegExp;
	replacement: string;
};

export type RegExpTransformRule = BaseRule & {
	kind: 'transform';
	rule: RegExp;
	transform: (match: RegExpExecArray) => string;
};

// Намеренно broad-тип для функций-правил: параметры после text конкретизируются
// в конкретных функциях (напр. smartQuotes), но для хранения в массиве Rule[]
// и вызова через spread нужен общий знаменатель. eslint-disable-next-line покрывает
// единственное легитимное использование any в этом файле.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RuleFunction = (text: string, ...args: any[]) => string;

export type FunctionRule<T extends unknown[] = unknown[]> = BaseRule & {
	kind: 'function';
	rule: RuleFunction;
	args?: T;
};

export type Rule = RegExpReplaceRule | RegExpTransformRule | FunctionRule;

export interface QuoteSettings {
	outer: [string, string];
	inner: [string, string];
}

export interface NumberSpaceSettings {
	minLength?: number;
	separateFloat?: boolean;
}
