import { newRule } from '@/api';

export default [
	// HTML Helpers

	newRule('/english/number/float-value', /(\d+)\\.(\d+)/g, '$1[^$2]'),
];
