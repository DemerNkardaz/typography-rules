import type { Node, tagSettings, rubyTextSettings } from '@/types';

export function rubyText(
	text: string,
	{ marker = ':', wrapper = ['[', ']'] }: rubyTextSettings = {},
	{ className, attrs }: tagSettings = {}
): Node[] {
	const result: Node[] = [];
	let i = 0;

	const open = wrapper[0] + marker;

	while (i < text.length) {
		const baseStart = text.indexOf(open, i);

		if (baseStart === -1) {
			result.push({ type: 'text', value: text.slice(i) });
			break;
		}

		if (baseStart > i) {
			result.push({ type: 'text', value: text.slice(i, baseStart) });
		}

		let depth = 0;
		let j = baseStart;
		let baseEnd = -1;

		while (j < text.length) {
			if (text[j] === wrapper[0]) depth++;
			else if (text[j] === wrapper[1]) {
				depth--;
				if (depth === 0) {
					baseEnd = j;
					break;
				}
			}
			j++;
		}

		if (baseEnd === -1) {
			result.push({ type: 'text', value: text.slice(baseStart) });
			break;
		}

		const furiganaStart = text.indexOf(open, baseEnd + 1);

		if (furiganaStart !== baseEnd + 1) {
			// нет второй части — оставляем как текст
			result.push({ type: 'text', value: text.slice(baseStart, baseEnd + 1) });
			i = baseEnd + 1;
			continue;
		}

		depth = 0;
		j = furiganaStart;
		let furiganaEnd = -1;

		while (j < text.length) {
			if (text[j] === wrapper[0]) depth++;
			else if (text[j] === wrapper[1]) {
				depth--;
				if (depth === 0) {
					furiganaEnd = j;
					break;
				}
			}
			j++;
		}

		if (furiganaEnd === -1) {
			result.push({ type: 'text', value: text.slice(baseStart) });
			break;
		}

		const baseInner = text.slice(baseStart + open.length, baseEnd);
		const furiganaInner = text.slice(furiganaStart + open.length, furiganaEnd);

		const baseParts = baseInner.split('|');
		const furiganaParts = furiganaInner.split('|');

		const children: Node[] = [];

		for (let k = 0; k < baseParts.length; k++) {
			children.push({
				type: 'rb',
				children: [{ type: 'text', value: baseParts[k] ?? '' }],
			});
			children.push({
				type: 'rt',
				children: [{ type: 'text', value: furiganaParts[k] ?? '' }],
			});
		}

		result.push({
			type: 'ruby',
			...(className && { className }),
			...(attrs && { attrs }),
			children,
		});

		i = furiganaEnd + 1;
	}

	return result;
}
