import { SPACES } from '@/glyphs';
import type { runtSettings } from '@/types';

export function runt(
	text: string,
	{ threshold = 10, space = SPACES.noBreak }: runtSettings = {}
): string {
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

	if (words.length < 2) {
		return text;
	}

	const replaceBefore = (pos: number) => {
		for (let i = pos - 1; i >= 0; i--) {
			const char = text[i];

			if (char && /\s/u.test(char)) {
				text = text.slice(0, i) + space + text.slice(i + 1);
				break;
			}
		}
	};

	const protectWord = (index: number, word: string) => {
		const protectedWord = [...word].join('\u2060');

		text = text.slice(0, index) + protectedWord + text.slice(index + length);
	};

	const last = words.at(-1)!;

	if ([...last.word].length >= threshold) {
		replaceBefore(last.index);
		return text;
	}

	const limit = threshold / 1.25;

	for (let i = words.length - 1; i > 0; i--) {
		const word = words[i]!;
		const prev = words[i - 1]!;

		replaceBefore(word.index);

		if ([...prev.word].length >= limit) {
			replaceBefore(prev.index);

			// защитить второе слово от конца
			protectWord(prev.index, prev.word);

			break;
		}
	}

	return text;
}
