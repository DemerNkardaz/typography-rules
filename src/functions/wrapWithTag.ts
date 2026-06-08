import type { Node, tagSettings, wrapWithTagsSettings } from '@/types';

export function wrapWithTag(
	text: string,
	{ marker = '^', tag = 'sup', wrapper = ['[', ']'] }: wrapWithTagsSettings = {},
	{ className, attrs }: tagSettings = {}
): Node[] {
	const result: Node[] = [];
	let i = 0;

	while (i < text.length) {
		const start = text.indexOf(wrapper[0] + marker, i);

		if (start === -1) {
			result.push({ type: 'text', value: text.slice(i) });
			break;
		}

		if (start > i) {
			result.push({ type: 'text', value: text.slice(i, start) });
		}

		let depth = 0;
		let j = start;
		let end = -1;

		while (j < text.length) {
			if (text[j] === wrapper[0]) depth++;
			else if (text[j] === wrapper[1]) {
				depth--;
				if (depth === 0) {
					end = j;
					break;
				}
			}
			j++;
		}

		if (end === -1) {
			result.push({ type: 'text', value: text.slice(start) });
			break;
		}

		const inner = text.slice(start + 2, end);

		result.push({
			type: tag,
			...(className && { className }),
			...(attrs && { attrs }),
			children: wrapWithTag(inner),
		});

		i = end + 1;
	}

	return result;
}
