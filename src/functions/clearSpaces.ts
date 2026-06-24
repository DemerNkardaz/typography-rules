import { SPACES } from '@nkardaz/typography-rules/glyphs';
import type { ClearSpacesSettings } from '@/types';

/**
 * Replaces multiple spaces with a single space.
 *
 * @param text - Input text.
 *
 * @param spaces - Array of space characters to remove.
 *
 * @returns Text with multiple spaces replaced by a single space.
 *
 * @example
 * clearSpaces('a  b  c') // 'a b c'
 * clearSpaces('a\u2009\u2009b\u2009\u2009c') // 'a\u2009b\u2009c' (thin space)
 */
export function clearSpaces(
	text: string,
	{ spaces = SPACES.find('noBreak', 'hair', 'thin') ?? [SPACES._] }: ClearSpacesSettings = {}
): string {
	let result = text;

	spaces.forEach((s) => {
		const escaped = s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
		const regex = new RegExp(`${escaped}{2,}`, 'g');
		result = result.replace(regex, s);
	});

	return result;
}
