import { SPACES } from '@/glyphs';
import type { NumberSpaceSettings } from '@/types';

/**
 * Inserts non-breaking spaces into large numeric sequences inside text.
 *
 * This function detects integers and optional fractional parts, and formats
 * them with `SPACES.nb` as a thousands separator. It also supports optional
 * formatting of fractional parts.
 *
 * @param text - Input text that may contain numbers.
 *
 * @param settings - Formatting options:
 * - `minLength` — minimum integer length before spacing is applied (default: 5)
 * - `separateFloat` — whether to insert spacing inside fractional part groups
 *
 * @returns Text with formatted numbers containing non-breaking spaces.
 *
 * @example
 * smartNumberGrouping("Price: 1234567");
 * // "Price: 1 234 567"
 *
 * @example
 * smartNumberGrouping("Value: 1234567.891011", { separateFloat: true });
 * // "Value: 1 234 567.891 011"
 */
export function smartNumberGrouping(
	text: string,
	{ minLength = 5, separateFloat = false, separator = SPACES.noBreak }: NumberSpaceSettings = {}
): string {
	return text.replace(
		/(?<![a-zA-Zа-яА-ЯёЁ\d])([+\-\u2212]?)(\d[\d\u00A0]*)([.,]\d+)?(?!\d)/g,
		(match, sign: string, rawInt: string, floatPart: string | undefined) => {
			const intPart = rawInt.replace(/\u00A0/g, '');

			if (intPart.length < minLength) return match;

			const formattedInt = intPart.replace(/(\d)(?=(\d{3})+$)/g, `$1${separator}`);

			let formattedFloat = floatPart ?? '';
			if (separateFloat && floatPart) {
				const sep = floatPart[0]; // '.' OR ','
				const digits = floatPart.slice(1);
				const spaced = digits.replace(/(\d{3})(?=\d)/g, `$1${separator}`);
				formattedFloat = sep + spaced;
			}

			return sign + formattedInt + formattedFloat;
		}
	);
}
