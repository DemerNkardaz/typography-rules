import type { Node, TagSettings, ChemNotationSettings } from '@/types';

interface ScriptPositions {
	base: string;
	supL: string;
	subL: string;
	supR: string;
	subR: string;
}

function parseScripts(content: string): ScriptPositions | null {
	type Token = { kind: 'sup' | 'sub'; value: string } | { kind: 'base'; value: string };

	const tokens: Token[] = [];
	let j = 0;

	while (j < content.length) {
		if (content[j] === '(') {
			const close = content.indexOf(')', j);
			if (close === -1) break;

			const inner = content.slice(j + 1, close);
			if (inner.startsWith('^')) {
				tokens.push({ kind: 'sup', value: inner.slice(1) });
			} else if (inner.startsWith('_')) {
				tokens.push({ kind: 'sub', value: inner.slice(1) });
			}
			j = close + 1;
		} else {
			let k = j;
			while (k < content.length && content[k] !== '(') k++;
			const chunk = content.slice(j, k).trim();
			if (chunk) tokens.push({ kind: 'base', value: chunk });
			j = k;
		}
	}

	const baseIdx = tokens.findIndex((t) => t.kind === 'base' && t.value);
	if (baseIdx === -1) return null;

	const base = (tokens[baseIdx] as { kind: 'base'; value: string }).value;
	const left = tokens.slice(0, baseIdx);
	const right = tokens.slice(baseIdx + 1);

	return {
		base,
		supL: left.find((t) => t.kind === 'sup')?.value ?? '',
		subL: left.find((t) => t.kind === 'sub')?.value ?? '',
		supR: right.find((t) => t.kind === 'sup')?.value ?? '',
		subR: right.find((t) => t.kind === 'sub')?.value ?? '',
	};
}

function splitParts(content: string): string[] {
	const parts: string[] = [];
	let depth = 0;
	let start = 0;

	for (let i = 0; i < content.length; i++) {
		if (content[i] === '(') depth++;
		else if (content[i] === ')') depth--;
		else if (content[i] === '-' && depth === 0) {
			parts.push(content.slice(start, i));
			start = i + 1;
		}
	}
	parts.push(content.slice(start));

	return parts.map((p) => p.trim()).filter(Boolean);
}

function textNode(value: string): Node {
	return { type: 'text', value };
}

function mnNode(value: string): Node {
	return { type: 'mn', children: [textNode(value)] };
}

function buildMmultiscripts({ base, supL, subL, supR, subR }: ScriptPositions): Node {
	const baseNode: Node = { type: 'mi', children: [textNode(base)] };

	const children: Node[] = [baseNode, mnNode(subR), mnNode(supR)];

	if (subL || supL) {
		children.push({ type: 'mprescripts', children: [] });
		children.push(mnNode(subL), mnNode(supL));
	}

	return { type: 'mmultiscripts', children };
}

/**
 * Parses chemical notation and converts it into MathML-like <mmultiscripts> structures.
 * * @param text The input string containing chemical notation syntax
 * @param settings Configuration for the marker and wrapper delimiters
 * @param tagSettings Optional class name and attributes for the <math> wrapper
 * @returns An array of nodes including text and <math> nodes
 */
export function chemNotation(
	text: string,
	{ marker = '%', wrapper = ['[', ']'] }: ChemNotationSettings = {},
	{ className, attrs }: TagSettings = {}
): Node[] {
	const result: Node[] = [];
	const open = wrapper[0] + marker;
	const openChar = wrapper[0];
	const closeChar = wrapper[1];
	let i = 0;

	while (i < text.length) {
		const start = text.indexOf(open, i);
		if (start === -1) {
			result.push(textNode(text.slice(i)));
			break;
		}
		if (start > i) result.push(textNode(text.slice(i, start)));

		let depth = 0;
		let j = start;
		let end = -1;
		while (j < text.length) {
			if (text[j] === openChar) depth++;
			else if (text[j] === closeChar) {
				depth--;
				if (depth === 0) {
					end = j;
					break;
				}
			}
			j++;
		}

		if (end === -1) {
			result.push(textNode(text.slice(start)));
			break;
		}

		const content = text.slice(start + open.length, end);
		const parts = splitParts(content);
		const parsed = parts.map(parseScripts).filter((p): p is ScriptPositions => p !== null);

		if (!parsed.length) {
			result.push(textNode(text.slice(start, end + 1)));
			i = end + 1;
			continue;
		}

		result.push({
			type: 'math',
			...(className && { className }),
			...(attrs && { attrs }),
			children: parsed.map(buildMmultiscripts),
		});

		i = end + 1;
	}

	return result;
}
