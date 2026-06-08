import type { Node, TagSettings, WrapWithTagsSettings } from '@/types';

/**
 * Parses text and wraps content found within specific markers into HTML tags.
 * Supports nested structures by recursively calling itself.
 * * @param text The input string to parse
 * @param settings Configuration for the marker, tag type, and wrapper delimiters
 * @param tagSettings Optional class name and attributes for the generated tag
 * @returns An array of nodes representing the processed text and wrapped elements
 */
export function wrapWithTag(
	text: string,
	{ marker = '^', tag = 'sup', wrapper = ['[', ']'] }: WrapWithTagsSettings = {},
	{ className, attrs }: TagSettings = {}
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
