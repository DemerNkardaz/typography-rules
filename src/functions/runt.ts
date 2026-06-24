import { SPACES } from '@nkardaz/typography-rules/glyphs';
import type { Node, RuntSettings } from '@/types';
import { wrapWithTag } from './wrapWithTag';

const NOWRAP_MARKER = '~';
const NOWRAP_WRAPPER = ['[', ']'] as [string, string];

export function runt(
	text: string,
	{ threshold = 10, space = SPACES.noBreak, minLineLength = 75 * 2 }: RuntSettings = {}
): Node[] {
	if (text.length < minLineLength) return [{ type: 'text', value: text }];
	const segmenter = new Intl.Segmenter(undefined, {
		granularity: 'word',
	});

	const words = [...segmenter.segment(text)]
		.filter((s) => s.isWordLike)
		.map((s) => ({
			index: s.index,
			word: s.segment,
			length: s.segment.length,
		}));

	if (words.length < 2) return [{ type: 'text', value: text }];

	const noBreakPositions = new Set<number>();
	let nowrapRange: { start: number; end: number } | null = null;

	const markSpaceBefore = (pos: number) => {
		for (let i = pos - 1; i >= 0; i--) {
			const char = text[i];
			if (char && /\s/u.test(char)) {
				noBreakPositions.add(i);
				break;
			}
		}
	};

	const last = words.at(-1)!;

	if ([...last.word].length >= threshold) {
		markSpaceBefore(last.index);
		return [{ type: 'text', value: applyNoBreaks(text, noBreakPositions, space) }];
	}

	const limit = threshold / 1.25;

	for (let i = words.length - 1; i > 0; i--) {
		const word = words[i]!;
		const prev = words[i - 1]!;

		markSpaceBefore(word.index);

		if ([...prev.word].length >= limit) {
			markSpaceBefore(prev.index);

			nowrapRange = {
				start: prev.index,
				end: word.index + word.word.length,
			};

			break;
		}
	}

	const processed = applyNoBreaks(text, noBreakPositions, space);

	if (!nowrapRange) return [{ type: 'text', value: processed }];

	const marked =
		processed.slice(0, nowrapRange.start) +
		NOWRAP_WRAPPER[0] +
		NOWRAP_MARKER +
		processed.slice(nowrapRange.start, nowrapRange.end) +
		NOWRAP_WRAPPER[1] +
		processed.slice(nowrapRange.end);

	return wrapWithTag(
		marked,
		{
			marker: NOWRAP_MARKER,
			tag: 'span',
			wrapper: NOWRAP_WRAPPER,
		},
		{
			attrs: { style: 'white-space: nowrap;' },
		}
	);
}

function applyNoBreaks(text: string, positions: Set<number>, space: string): string {
	if (positions.size === 0) return text;
	let out = '';
	for (let i = 0; i < text.length; i++) {
		out += positions.has(i) ? space : text[i];
	}
	return out;
}
