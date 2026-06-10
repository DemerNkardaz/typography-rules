import type {
	Node,
	TagSettings,
	WrapWithTagsSettings,
	WrapWithTagExpressionSettings,
} from '@/types';

/**
 * Parses text and wraps content found within specific markers into HTML tags.
 * Supports nested structures by recursively calling itself.
 *
 * @param text The input string to parse
 * @param settings Configuration for the marker, tag type, and wrapper delimiters
 * @param tagSettings Optional class name and attributes for the generated tag
 * @returns An array of nodes representing the processed text and wrapped elements
 */
export function wrapWithTag(text: string): Node[];

/**
 * Parses text using a custom RegExp and wraps matched regions into HTML tags.
 *
 * When `placement` is provided, it acts as a structural template:
 * - `$1`, `$2`, etc. reference capture groups from `expression`
 * - `<TAG>...</TAG>` marks which part of the match gets wrapped
 *
 * @example
 * // expression: /([\d\s]м)(2|3)/g, tag: 'sup', placement: '$1<TAG>$2</TAG>'
 * // 'Площадь 25м2' → 'Площадь 25м<sup>2</sup>'
 *
 * @param text The input string to parse
 * @param settings Configuration with expression, tag, and optional placement
 * @param tagSettings Optional class name and attributes for the generated tag
 * @returns An array of nodes representing the processed text and wrapped elements
 */
export function wrapWithTag(
	text: string,
	settings: WrapWithTagsSettings,
	tagSettings?: TagSettings
): Node[];
export function wrapWithTag(
	text: string,
	settings: WrapWithTagExpressionSettings,
	tagSettings?: TagSettings
): Node[];
export function wrapWithTag(
	text: string,
	settings: WrapWithTagsSettings | WrapWithTagExpressionSettings = {},
	tagSettings: TagSettings = {}
): Node[] {
	if ('expression' in settings) {
		return wrapWithTagExpression(text, settings, tagSettings);
	}

	const { marker = '^', tag = 'sup', wrapper = ['[', ']'] } = settings;
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

		result.push({
			type: tag,
			...(tagSettings.className && { className: tagSettings.className }),
			...(tagSettings.attrs && { attrs: tagSettings.attrs }),
			children: wrapWithTag(text.slice(start + 2, end)),
		});

		i = end + 1;
	}

	return result;
}

// ─── Expression overload implementation ──────────────────────────────────────

const TAG_OPEN = '<TAG>';
const TAG_CLOSE = '</TAG>';

function wrapWithTagExpression(
	text: string,
	{ expression, tag = 'sup', placement }: WrapWithTagExpressionSettings,
	tagSettings: TagSettings = {}
): Node[] {
	const result: Node[] = [];
	const regex = new RegExp(
		expression.source,
		expression.flags.includes('g') ? expression.flags : expression.flags + 'g'
	);
	let lastIndex = 0;
	let match: RegExpExecArray | null;

	while ((match = regex.exec(text)) !== null) {
		if (match[0].length === 0) {
			regex.lastIndex++;
			continue;
		}

		if (match.index > lastIndex) {
			result.push({ type: 'text', value: text.slice(lastIndex, match.index) });
		}

		if (placement) {
			result.push(...resolvePlacement(match, placement, tag, tagSettings));
		} else {
			result.push({
				type: tag,
				...(tagSettings.className && { className: tagSettings.className }),
				...(tagSettings.attrs && { attrs: tagSettings.attrs }),
				children: [{ type: 'text', value: match[0] }],
			});
		}

		lastIndex = match.index + match[0].length;
	}

	if (lastIndex < text.length) {
		result.push({ type: 'text', value: text.slice(lastIndex) });
	}

	return result;
}

/**
 * Resolves a placement template into an array of nodes.
 *
 * Replaces `$N` references with capture groups and wraps the content
 * inside `<TAG>...</TAG>` into an element node.
 *
 * @example
 * // placement: '$1<TAG>$2</TAG>', match for /([\d\s]м)(2|3)/
 * // → [TextNode('25м'), ElementNode('sup', [TextNode('2')])]
 */
function resolvePlacement(
	match: RegExpExecArray,
	placement: string,
	tag: string,
	tagSettings: TagSettings
): Node[] {
	const resolved = placement.replace(/\$(\d+)/g, (_, n: string) => match[Number(n)] ?? '');

	const tagOpenIdx = resolved.indexOf(TAG_OPEN);
	const tagCloseIdx = resolved.indexOf(TAG_CLOSE);

	if (tagOpenIdx === -1 || tagCloseIdx === -1) {
		return [{ type: 'text', value: resolved }];
	}

	const nodes: Node[] = [];

	if (tagOpenIdx > 0) {
		nodes.push({ type: 'text', value: resolved.slice(0, tagOpenIdx) });
	}

	nodes.push({
		type: tag,
		...(tagSettings.className && { className: tagSettings.className }),
		...(tagSettings.attrs && { attrs: tagSettings.attrs }),
		children: [{ type: 'text', value: resolved.slice(tagOpenIdx + TAG_OPEN.length, tagCloseIdx) }],
	});

	const after = resolved.slice(tagCloseIdx + TAG_CLOSE.length);
	if (after) {
		nodes.push({ type: 'text', value: after });
	}

	return nodes;
}
