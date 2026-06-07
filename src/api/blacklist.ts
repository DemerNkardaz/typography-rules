interface TrieNode {
	children: Map<string, TrieNode>;
	end: boolean;
}

function createNode(): TrieNode {
	return {
		children: new Map(),
		end: false,
	};
}

const root: TrieNode = createNode();

let globalDisabled = false;

/**
 * Splits rule path into segments.
 *
 * Example:
 * "/english/math" → ["english", "math"]
 */
function getParts(rule: string): string[] {
	return rule.split('/').filter(Boolean);
}

/**
 * Internal blacklist implemented as a Trie.
 *
 * Supports hierarchical rule disabling:
 * — Exact match: "/english/math"
 * — Prefix match: "/english/math" disables "/english/math/*"
 *
 * Special rule:
 * — "*" disables all rules globally
 *
 * This structure allows efficient prefix-based rule matching
 * without scanning a flat Set.
 */
export function disableRule(rule: string): void {
	if (rule === '*') {
		globalDisabled = true;
		return;
	}

	let node = root;

	for (const part of getParts(rule)) {
		if (!node.children.has(part)) {
			node.children.set(part, createNode());
		}
		node = node.children.get(part)!;
	}

	node.end = true;
}

/**
 * Re-enables a previously disabled rule.
 *
 * If the rule was globally disabled via "*",
 * global flag will be cleared.
 *
 * Note: removing a prefix rule does not automatically
 * restore sub-rules if they were individually disabled.
 *
 * @param rule Rule path to enable
 */
export function enableRule(rule: string): void {
	if (rule === '*') {
		globalDisabled = false;
		return;
	}

	const stack: { node: TrieNode; part: string }[] = [];
	let node = root;

	for (const part of getParts(rule)) {
		if (!node.children.has(part)) return;

		stack.push({ node, part });
		node = node.children.get(part)!;
	}

	node.end = false;

	// optional cleanup: remove empty nodes to keep trie small
	for (let i = stack.length - 1; i >= 0; i--) {
		const entry = stack[i];

		if (!entry) continue;

		const { node: parent, part } = entry;
		const child = parent.children.get(part)!;

		if (child.end || child.children.size > 0) break;

		parent.children.delete(part);
	}
}

/**
 * Toggles a rule between enabled and disabled state.
 *
 * If rule is currently disabled → it will be enabled.
 * If rule is enabled → it will be disabled.
 *
 * @param rule Rule path to toggle
 */
export function toggleRule(rule: string): void {
	if (isRuleDisabled(rule)) {
		enableRule(rule);
	} else {
		disableRule(rule);
	}
}

/**
 * Checks whether a rule is disabled.
 *
 * A rule is considered disabled if:
 * — global disable flag "*" is active
 * — any parent rule in the path is disabled
 * — the rule itself is explicitly disabled
 *
 * Example:
 * "/english/math" disables:
 * — "/english/math"
 * — "/english/math/geometry"
 *
 * @param rule Rule path to check
 * @returns true if rule is disabled
 */
export function isRuleDisabled(rule: string): boolean {
	if (globalDisabled) return true;

	let node = root;

	for (const part of getParts(rule)) {
		if (node.end) return true;
		if (!node.children.has(part)) return false;
		node = node.children.get(part)!;
	}

	return node.end;
}

/**
 * Checks whether all rules are globally disabled.
 *
 * Global disable is represented by "*" rule.
 *
 * @returns true if global disable is active
 */
export function isGloballyDisabled(): boolean {
	return globalDisabled;
}

/**
 * Clears the entire rule blacklist.
 *
 * This removes:
 * — all explicitly disabled rules in the Trie
 * — global disable flag ("*")
 *
 * After calling this function, all rules become enabled again
 * unless re-disabled explicitly.
 */
export function clearBlacklist(): void {
	// reset global flag
	globalDisabled = false;

	// reset trie
	root.children.clear();
	root.end = false;
}
