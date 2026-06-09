import { newRule } from '@/api';
import { chemNotation, rubyText, wrapWithTag } from '@/functions';

/**
 * Shared markup rules applied across all locales.
 *
 * Handles:
 * - whitespace normalization
 * - dash normalization (hyphens, en/em dashes)
 * - ellipsis conversion
 * - math symbol normalization
 * - number spacing rules
 * - apostrophe normalization
 *
 * This layer forms the base typography pipeline
 * before locale-specific transformations.
 */
export default [
	// HTML Wraps

	// Chemical
	newRule('/common/wraps/chem', chemNotation, [{ className: '@yalla-typography-chem' }], Infinity),

	// Wraps for ルビ, furigana
	newRule(
		'/common/wraps/ruby',
		rubyText,
		[{ marker: '?:' }, { className: '@yalla-typography-ruby --alternate' }],
		Infinity
	),
	newRule(
		'/common/wraps/ruby',
		rubyText,
		[{ marker: '!:' }, { className: '@yalla-typography-ruby --under' }],
		Infinity
	),
	newRule(
		'/common/wraps/ruby',
		rubyText,
		[{ marker: ':' }, { className: '@yalla-typography-ruby --over' }],
		Infinity
	),

	// Wraps for superscript and subscript
	newRule(
		'/common/wraps/sup',
		wrapWithTag,
		[{ marker: '^', tag: 'sup' }, { className: '@yalla-typography-sup' }],
		Infinity
	),
	newRule(
		'/common/wraps/sub',
		wrapWithTag,
		[{ marker: '_', tag: 'sub' }, { className: '@yalla-typography-sub' }],
		Infinity
	),
];
