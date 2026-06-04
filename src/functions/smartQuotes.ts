import type { QuoteSettings } from '@/types';

export function smartQuotes(
	text: string,
	quotes: QuoteSettings = {
		outer: ['\u00AB', '\u00BB'],
		inner: ['\u201E', '\u201C'],
	}
): string {
	let result = '';
	// Stack tracks which quote char opened each level: '"' or "'"
	const stack: ('"' | "'")[] = [];

	for (let i = 0; i < text.length; i++) {
		const char = text[i];
		const prev = text[i - 1] ?? '';
		const next = text[i + 1] ?? '';

		if (char === '"') {
			const afterSpace = prev === '' || /\s/.test(prev);
			const beforeSpace = next === '' || /\s/.test(next);

			let isOpen: boolean;
			if (stack.length === 0) {
				isOpen = true;
			} else if (afterSpace && !beforeSpace) {
				isOpen = true;
			} else if (!afterSpace && beforeSpace) {
				isOpen = false;
			} else if (!afterSpace && !beforeSpace) {
				isOpen = false;
			} else {
				isOpen = false;
			}

			if (isOpen) {
				const q = stack.length === 0 ? quotes.outer : quotes.inner;
				result += q[0];
				stack.push('"');
			} else {
				// Find the matching '"' on the stack and pop it
				const matchIdx = [...stack].reverse().indexOf('"');
				if (matchIdx !== -1) {
					stack.splice(stack.length - 1 - matchIdx, 1);
				}
				const q = stack.length === 0 ? quotes.outer : quotes.inner;
				result += q[1];
			}
			continue;
		}

		if (char === "'") {
			const insideDoubleQuotes = stack.includes('"');

			// Apostrophe: letter directly before AND letter/digit directly after
			// e.g. it's, don't, o'clock — not a quote
			const isApostrophe =
				/[a-zA-Z\u0430-\u044F\u0410-\u042F\u0451\u0401]/.test(prev) &&
				/[a-zA-Z\u0430-\u044F\u0410-\u042F\u0451\u04010-9]/.test(next);

			if (isApostrophe || !insideDoubleQuotes) {
				// Pass through; the common apostrophe rule handles ' \u2192 \u2019
				result += char;
				continue;
			}

			// Inside double quotes: treat as inner quote
			const lastDoubleIdx = stack.lastIndexOf('"');
			const hasOpenSingle = stack.slice(lastDoubleIdx + 1).includes("'");

			// If no open single quote yet inside this double-quote level → opening.
			// If one is already open → closing (regardless of spacing).
			const isOpen = !hasOpenSingle;

			if (isOpen) {
				result += quotes.inner[0];
				stack.push("'");
			} else {
				const matchIdx = [...stack].reverse().indexOf("'");
				if (matchIdx !== -1) {
					stack.splice(stack.length - 1 - matchIdx, 1);
				}
				result += quotes.inner[1];
			}
			continue;
		}

		result += char;
	}

	return result;
}

export default smartQuotes;
