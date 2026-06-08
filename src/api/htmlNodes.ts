import type { ElementNode, HtmlNodeSettings, Node, TextNode } from '@/types';

import type { Text } from 'mdast';
import type { MdxJsxTextElement } from 'mdast-util-mdx-jsx';

export function htmlNode(text: string, { expression, nodes }: HtmlNodeSettings = {}): Node[] {
	if (!expression || !nodes) {
		return [{ type: 'text', value: text }];
	}

	const result: Node[] = [];
	let lastIndex = 0;

	for (const match of text.matchAll(expression)) {
		const matchStart = match.index!;

		if (matchStart > lastIndex) {
			result.push({ type: 'text', value: text.slice(lastIndex, matchStart) });
		}

		result.push(nodes(match));

		lastIndex = matchStart + match[0].length;
	}

	if (lastIndex < text.length) {
		result.push({ type: 'text', value: text.slice(lastIndex) });
	}

	return result;
}

export function renderNode(node: Node): string {
	if (node.type === 'text') {
		return (node as TextNode).value;
	}

	const element = node as ElementNode;

	const attrs: string[] = [];

	if (element.className) {
		attrs.push(`class="${element.className}"`);
	}

	if (element.attrs) {
		for (const [name, value] of Object.entries(element.attrs)) {
			attrs.push(`${name}="${value}"`);
		}
	}

	const attrString = attrs.length > 0 ? ` ${attrs.join(' ')}` : '';
	const inner = element.children.map(renderNode).join('');

	return `<${element.type}${attrString}>${inner}</${element.type}>`;
}

export function renderNodes(nodes: Node[]): string {
	return nodes.map(renderNode).join('');
}

export function nodeToMdast(n: Node): Text | MdxJsxTextElement {
	if (n.type === 'text') {
		return {
			type: 'text',
			value: (n as TextNode).value,
		} as Text;
	}

	const element = n as ElementNode;

	const attributes: MdxJsxTextElement['attributes'] = [];

	if (element.className) {
		attributes.push({
			type: 'mdxJsxAttribute',
			name: 'className',
			value: element.className,
		});
	}

	if (element.attrs) {
		for (const [name, value] of Object.entries(element.attrs)) {
			attributes.push({
				type: 'mdxJsxAttribute',
				name,
				value,
			});
		}
	}

	return {
		type: 'mdxJsxTextElement',
		name: element.type,
		attributes,
		children: element.children.map(nodeToMdast),
	} as MdxJsxTextElement;
}
