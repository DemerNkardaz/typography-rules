# @yalla/typography-rules

A modular, locale-aware typography rules engine for transforming plain text into
typographically correct output. Ships with a glyph registry, smart text
functions, and a composable rule pipeline.

Used as a rules provider for typography plugins such as
[@yalla/typography-core](https://github.com/DemerNkardaz/typography-core) /
[@yalla/remark-typography](https://github.com/DemerNkardaz/remark-typography).

---

## Installation

```bash
npm i @yalla/typography-rules
```

> **Requires Node.js ≥ 24.0.0**

---

## Package Exports

| Export path                         | Description                                                               |
| ----------------------------------- | ------------------------------------------------------------------------- |
| `@yalla/typography-rules`           | Main entry — rules, store, types, functions                               |
| `@yalla/typography-rules/glyphs`    | Glyph registries (DASHES, SPACES, PUNCTUATION, …)                         |
| `@yalla/typography-rules/helpers`   | Text pipeline helpers (protect/unprotect, node markers, pattern registry) |
| `@yalla/typography-rules/functions` | Composable text-processing functions                                      |

---

## Quick Start

### Using default rules

```typescript
import { initTypographyRules, getWeightedRules } from '@yalla/typography-rules';

// Register all built-in rule groups (common, ru, en, …)
initTypographyRules();

// Register all built-in rules for markup, e.g. [^text] → <sup>text</sup>
initMarkupRules();

// Or apply only a specific locale group
initTypographyRules('ru');

// Retrieve the merged, weight-sorted pipeline for a locale
const rules = getWeightedRules('ru'); // common + ru rules, sorted by weight
```

### Defining custom rules

```typescript
import { newRule, registerRule } from '@yalla/typography-rules';

// Replace rule — static string substitution
registerRule('en', newRule('/english/copyright', /\(c\)/gi, '©'));

// Transform rule — dynamic replacement per match
registerRule(
  'en',
  newRule('/english/bracket-numbers', /\d+/g, (match) => `[${match[0]}]`)
);

// Function rule — full custom processing function
import { smartQuotes } from '@yalla/typography-rules/functions';

// Danish quotes: »Jeg husker, at hun sagde ›det her er vigtigt‹ i går.«
registerRule(
  'da',
  newRule('/danish/typography/quotes', smartQuotes, [
    { outer: ['»', '«'], inner: ['›', '‹'] },
  ])
);
```

### Registering multiple rules at once

```typescript
import { newRule, registerRule } from '@yalla/typography-rules';
import { DASHES } from '@yalla/typography-rules/glyphs';

registerRule(
  'en',
  newRule('/english/em-dash', /--/g, DASHES.em),
  newRule('/english/registered', /\(r\)/gi, '®'),
  newRule('/english/trademark', /\(tm\)/gi, '™')
);
```

---

## Core API

### `newRule(label, rule, second?, weight?)`

Creates a typed typography rule object. Supports three overloads:

```typescript
// 1. Replace rule
newRule('/my/rule/label', /--/g, '—');

// 2. Transform rule
newRule('/my/rule/label', /\d+/g, (match: RegExpExecArray) => `[${match[0]}]`);

// 3. Function rule
newRule('/my/rule/label', myFunction, ['arg1', 'arg2']);
```

| Parameter | Type                               | Description                                                                                                              |
| --------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `label`   | `string`                           | Unique rule identifier path, e.g. '/en/math/fractions'. Used by the blacklist system to enable/disable rules selectively |
| `rule`    | `RegExp \| RuleFunction`           | Pattern or processing function                                                                                           |
| `second`  | `string \| transform fn \| args[]` | Replacement, transformer, or arguments                                                                                   |
| `weight`  | `number`                           | Execution priority — lower values run first (default: `0`)                                                               |

---

### `registerRule(locale, rules[])`

Registers one or more rules for a locale. Automatically invalidates the weighted
rule cache for that locale and `'common'`.

```typescript
registerRule('common', newRule('/common/space/cleanup', /\s+/g, ' '));
registerRule('de', newRule('/deutsch/em-dash', /--/g, '—'), newRule(/"/g, '„'));
```

---

### `rulesBase(locale, base, label?, excludes?, ...rules)`

Registers rules for a locale, inheriting from an existing base locale. Useful
for defining locale variants that share most rules with a parent.

```typescript
rulesBase(
  'fr-CA', // target locale
  'fr', // inherit from French
  { expression: /^\/french\//, replacement: '/french-ca/' }, // rename labels
  ['/french/quotes/guillemets'], // exclude specific rules
  newRule('/french-ca/extra', /…/g, '...') // add custom rules on top
);
```

| Parameter  | Type              | Description                                              |
| ---------- | ----------------- | -------------------------------------------------------- |
| `locale`   | `string`          | Target locale to register rules for                      |
| `base`     | `string`          | Source locale to inherit rules from                      |
| `label`    | `LabelTransform?` | Optional `{ expression, replacement }` to rewrite labels |
| `excludes` | `string[]?`       | Rule labels from the base to skip                        |
| `...rules` | `Rule[]`          | Additional rules appended after the inherited ones       |

---

### `initTypographyRules(from?)`

Populates the global rule registry with the built-in default ruleset.

```typescript
initTypographyRules(); // All locales
initTypographyRules('en'); // English rules only
initTypographyRules('ru'); // Russian rules only
```

---

### `initMarkupRules(from?)`

Populates the global rule registry with built-in markup rules (superscript,
subscript, chemical notation, ruby text).

```typescript
initMarkupRules(); // All markup rule groups
initMarkupRules('common'); // Common markup rules only
```

---

### `getWeightedRules(locale)`

Returns a merged, weight-sorted rule pipeline for the given locale: `common`
rules + locale-specific rules, sorted ascending by `weight`.

```typescript
const pipeline = getWeightedRules('en'); // Rule[]
```

---

### `resetTypographyRules()`

Clears all registered rules from the global registry and cache.

---

### `rulesHas(locale)` / `rulesCount(locale)`

Utility functions for inspecting the rule registry:

```typescript
rulesHas('en'); // boolean
rulesCount('en'); // number
```

---

### Rule Blacklist

A trie-based system for selectively disabling rules by their label path without
removing them from the registry. Supports hierarchical matching — disabling a
path prefix disables all rules nested under it.

```typescript
import {
  disableRule,
  enableRule,
  toggleRule,
  isRuleDisabled,
  isGloballyDisabled,
  clearBlacklist,
} from '@yalla/typography-rules';
```

#### `disableRule(rule)`

Disables a rule or an entire rule subtree by path prefix. The special value
`'*'` disables all rules globally.

```typescript
disableRule('/common/math/negative-number'); // disable one rule
disableRule('/english/ligatures'); // disable all ligature rules
disableRule('*'); // disable everything
```

#### `enableRule(rule)`

Re-enables a previously disabled rule. Clears the global flag if `'*'` is
passed.

```typescript
enableRule('/english/ligatures/fi'); // re-enable a single rule
enableRule('*'); // lift global disable
```

#### `toggleRule(rule)`

Flips the disabled state of a rule — disables if enabled, enables if disabled.

```typescript
toggleRule('/common/typography/runt');
```

#### `isRuleDisabled(rule)`

Returns `true` if the rule is disabled either directly, via a parent prefix, or
globally.

```typescript
isRuleDisabled('/common/math/negative-number'); // boolean
```

#### `isGloballyDisabled()`

Returns `true` if all rules have been globally disabled via `disableRule('*')`.

```typescript
isGloballyDisabled(); // boolean
```

#### `clearBlacklist()`

Resets the entire blacklist — removes all disabled paths and clears the global
flag.

```typescript
clearBlacklist();
```

#### Label path conventions

Built-in rule labels follow a consistent hierarchy:

| Segment        | Example                                   | Meaning                |
| -------------- | ----------------------------------------- | ---------------------- |
| `common`       | `/common/math/…`                          | Applies to all locales |
| `english`      | `/english/ligatures/…`                    | English-only rules     |
| `russian`      | `/russian/typography/…`                   | Russian-only rules     |
| Second segment | `/common/space/…`, `/common/typography/…` | Rule category          |
| Third segment  | `/common/math/negative-number`            | Specific case          |
| Fourth segment | `/common/punctuation/dashes/em-dash`      | Specific rule          |

---

## Built-in Functions

These are composable text-processing functions that can be used directly or
wrapped with `newRule`.

Must be imported with `@yalla/typography-rules/functions`

### `smartQuotes(text, settings?)`

Converts straight quotes (`"` and `'`) into typographically correct
opening/closing quote pairs, with support for nested quotation levels and
apostrophe detection.

```typescript
import { smartQuotes } from '@yalla/typography-rules/functions';

smartQuotes('"Hello"'); // “Hello” (en defaults)
smartQuotes('"He said \'hi\'"'); // “He said ‘hi’”
```

**Settings:**

| Option  | Type               | Default            | Description                      |
| ------- | ------------------ | ------------------ | -------------------------------- |
| `outer` | `[string, string]` | `[“, ”]` (English) | Opening and closing outer quotes |
| `inner` | `[string, string]` | `[‘, ’]` (English) | Opening and closing inner quotes |

---

### `smartNumberGrouping(text, settings?)`

Inserts symbols (e.g. `,`) as thousands separators into large numeric sequences
based on locale (uses `Intl.NumberFormat`).

```typescript
import { smartNumberGrouping } from '@yalla/typography-rules/functions';

smartNumberGrouping('Price: 1234567');
// “Price: 1,234,567”

smartNumberGrouping('Value: 1234567.891011', { locale: 'ru-RU' });
// “Value: 1 234 567,891011”
```

**Settings:**

| Option      | Type     | Default   | Description                                            |
| ----------- | -------- | --------- | ------------------------------------------------------ |
| `locale`    | `string` | `'en-US'` | BCP 47 locale tag used by `Intl.NumberFormat`          |
| `minLength` | `number` | `5`       | Minimum integer digit count before grouping is applied |

---

### `clearSpaces(text, settings?)`

Collapses runs of two or more identical space characters into a single one. By
default targets non-breaking, hair, and thin spaces.

```typescript
import { clearSpaces } from '@yalla/typography-rules/functions';

clearSpaces('a  b  c'); // 'a b c'
```

**Settings:**

| Option   | Type                   | Default                 | Description                     |
| -------- | ---------------------- | ----------------------- | ------------------------------- |
| `spaces` | `Spaces[] \| string[]` | `[noBreak, hair, thin]` | Space characters to deduplicate |

---

### `runt(text, settings?)`

Prevents typographic runts — single short words isolated at the end of a
paragraph — by replacing the preceding space with a non-breaking space. For
longer last words, also protects the penultimate word with
`white-space: nowrap`.

**Settings:**

| Option          | Type               | Default          | Description                                                          |
| --------------- | ------------------ | ---------------- | -------------------------------------------------------------------- |
| `threshold`     | `number`           | `10`             | Maximum character length of the last word to trigger runt protection |
| `space`         | `Spaces \| string` | `SPACES.noBreak` | Replacement space character                                          |
| `minLineLength` | `number`           | `150`            | Minimum text length required to apply runt protection at all         |

---

### `wrapWithTag(text, settings?, tagSettings?)`

Wraps matched bracket-marker syntax into an HTML element node. Returns `Node[]`.

```typescript
import { wrapWithTag } from '@yalla/typography-rules/functions';

wrapWithTag('H[^2]O');
// → [text('H'), sup([text('2')]), text('O')]

wrapWithTag('H[*2]O', { marker: '*', tag: 'sup' });
// → [text('H'), sup([text('2')]), text('O')]
```

**Settings:**

| Option    | Type               | Default      | Description                              |
| --------- | ------------------ | ------------ | ---------------------------------------- |
| `marker`  | `string`           | `'^'`        | Character after opening bracket          |
| `tag`     | `string`           | `'sup'`      | HTML tag name for the wrapping element   |
| `wrapper` | `[string, string]` | `['[', ']']` | Bracket pair delimiting the marked range |

**Tag settings:**

| Option      | Type                     | Description                |
| ----------- | ------------------------ | -------------------------- |
| `className` | `string`                 | CSS class on the element   |
| `attrs`     | `Record<string, string>` | Additional HTML attributes |

---

### `rubyText(text, settings?, tagSettings?)`

Parses ruby annotation syntax into a `<ruby>` node tree with `<rb>` / `<rt>`
pairs. Returns `Node[]`.

```typescript
import { rubyText } from '@yalla/typography-rules/functions';

rubyText('[:平安時代][:へいあんじだい]');
// → ruby → [ rb('平安時代'), rt('へいあんじだい') ]

// Multiple base|furigana pairs separated by |
rubyText('[:東|京][:とう|きょう]');
// → ruby → [ rb('東'), rt('ひがし'), rb('京'), rt('きょう') ]
```

**Settings:**

| Option    | Type               | Default      | Description                                              |
| --------- | ------------------ | ------------ | -------------------------------------------------------- |
| `marker`  | `string`           | `':'`        | Character after opening bracket associated with the ruby |
| `wrapper` | `[string, string]` | `['[', ']']` | Bracket pair delimiting the ruby group                   |

**Tag settings:** same as `wrapWithTag`.

---

### `chemNotation(text, settings?, tagSettings?)`

Parses chemical notation syntax into MathML `<mmultiscripts>` node trees for
correct rendering of nuclear/chemical scripts on both sides of a base symbol.
Returns `Node[]`.

```typescript
import { chemNotation } from '@yalla/typography-rules/functions';

chemNotation('Вода [%H(_2)-O]');
chemNotation('[%(^14)(_6)C]');
```

**Syntax inside `[%…]`:**

| Notation      | Meaning                                            |
| ------------- | -------------------------------------------------- |
| `(_val)`      | Subscript (lower index)                            |
| `(^val)`      | Superscript (upper index)                          |
| Before base   | Left-side prescripts (e.g. `(^14)C`)               |
| After base    | Right-side scripts (e.g. `C(_6)`)                  |
| `-` separator | Joins multiple parts in one block (e.g. `H(_2)-O`) |

**Settings:**

| Option    | Type               | Default      | Description                                         |
| --------- | ------------------ | ------------ | --------------------------------------------------- |
| `marker`  | `string`           | `'%'`        | Character after opening bracket                     |
| `wrapper` | `[string, string]` | `['[', ']']` | Bracket pair delimiting the chemical notation block |

**Tag settings:** same as `wrapWithTag`.

**Examples:**

```
[%H(_2)-O]            →  H₂O
[%NH(_4)-ClO(_4)]     →  NH₄ClO₄
[%(^239)U]            →  ²³⁹U
[%(^14)(_6)C]         →  ¹⁴₆C
[%(^2)(_1)H(^7)(_5)]  →  ²₁H⁷₅  (left: 2,1 — right: 7,5)
```

> **Note on font styling:** MathML ignores `font-family` and `font-style`. Use a
> math-capable OpenType font (e.g. STIX Two Math, Latin Modern Math) via
> `@font-face` on the `math` element. To suppress automatic italicisation of
> `<mi>`, pass `attrs: { mathvariant: 'normal' }` via `tagSettings`.

---

## Glyphs

The `@yalla/typography-rules/glyphs` export provides typed, prototype-enhanced
glyph registries. All registries support shared utility methods.

### Available registries

| Export         | Description                                                                     |
| -------------- | ------------------------------------------------------------------------------- |
| `DASHES`       | Em dash, en dash, soft hyphen, figure dash, non-breaking hyphen, etc.           |
| `SPACES`       | All Unicode space variants — non-breaking, thin, hair, narrow, zero-width, etc. |
| `PUNCTUATION`  | Multi-locale quote characters, ellipsis, interrobang, and punctuation marks     |
| `MATHS`        | Minus sign (`−`), fraction slash (`⁄`)                                          |
| `LIGATURES`    | Typographic ligatures: fi, fl, ffi, ffl, Æ, Œ, etc.                             |
| `CHARACTERS`   | Dagger, double dagger, numero (`№`), section sign (`§`), etc.                   |
| `TEMPERATURES` | Temperature unit symbols: ℃, ℉, K and text forms                                |
| `WALLET`       | Currency symbols and ISO 4217 codes                                             |
| `DIGITS`       | ASCII digits and Unicode Roman numeral characters                               |
| `RANGES`       | Character range strings for use in RegExp character classes                     |

### GlyphSet utility methods

All glyph sets expose the following methods:

```typescript
DASHES.join(); // '—|–|⸺|…' — joined string of all values
DASHES.join(''); // '—–⸺…'
DASHES.hasKey('em'); // true
DASHES.hasValue('—'); // true
DASHES.findKey('—'); // 'em'
DASHES.find('em', 'en'); // ['—', '–']
DASHES.insert({ myDash: '\u2E1A' }); // mutably extend the set
```

### PUNCTUATION locale access

```typescript
import { PUNCTUATION } from '@yalla/typography-rules/glyphs';

PUNCTUATION.get('ru', 'leftSided'); // common + ru leftSided merged
PUNCTUATION.get('en', 'rightSided'); // common + en rightSided merged
PUNCTUATION.getList(); // ['common', 'ru', 'en', 'fr', 'is']
PUNCTUATION.hasKey('de'); // false
```

**Supported locales in PUNCTUATION:**

| Locale | Outer quotes    | Inner quotes      |
| ------ | --------------- | ----------------- |
| `ru`   | &laquo;…&raquo; | &bdquo;…&ldquo;   |
| `en`   | &ldquo;…&rdquo; | &lsquo;…&rsquo;   |
| `fr`   | &laquo;…&raquo; | &lsaquo;…&rsaquo; |
| `is`   | &bdquo;…&ldquo; | &sbquo;…&lsquo;   |

---

## Aliases

The `@yalla/typography-rules` export provides an `ALIAS` utility for mapping various locale identifiers to a single root key. All keys and values are automatically normalized to lowercase, and lookups are case-insensitive.

### `createAlias(map)`

Creates a normalized alias map with utility methods.

```typescript
import { createAlias } from '@yalla/typography-rules';

const ALIAS = createAlias({
  en: ['en-US', 'English'],
  ru: ['ru-RU', 'Russian'],
});
```

| Method | Description |
| :--- | :--- |
| `has(alias)` | Checks if an alias exists as a root key or an alternative name. |
| `resolve(alias)` | Resolves an alias to its root key. |
| `push(root, ...aliases)` | Adds new alternative names to an existing or new root key. |
| `normalize(...alias)` | Helper to lowercase one or more strings. |

### Global `ALIAS`

A pre-configured instance used internally for supported locales:

```typescript
import { ALIAS } from '@yalla/typography-rules';

ALIAS.ru;               // ['ru-ru', 'russian', 'русский']
ALIAS.resolve('Russian'); // 'ru'
ALIAS.has('Old English'); // true
```

---

## Helpers

The `@yalla/typography-rules/helpers` export provides utilities for safe text
pipeline construction.

### Protection system

Temporarily wraps structured content (URLs, emails, code, identifiers) in
protection markers before typography transformations, then restores originals
afterward.

```typescript
import { protect, unprotect } from '@yalla/typography-rules/helpers';

const [protectedText, captured] = protect(text);
// ... apply typography rules to `protectedText` ...
const processed = applyRules(protectedText); // your pipeline here
const result = unprotect(processed, captured);
```

**Protected patterns** (not modified by typography rules):

- Email addresses, URLs
- Unix and Windows file paths
- XML/HTML tags
- Inline and block code (backtick syntax)
- UUIDs, git hashes
- IPv4, IPv6, MAC addresses
- Version strings (`v1.2.3`, etc.)
- CSS selectors, CLI flags (`--option`)
- ISBN, ISSN, DOI, ORCID identifiers
- `[##(...)##]` — Special protected block for protect any text inside `()`.

### Pattern registry

```typescript
import { createPatterns, PROTECTED_PATTERNS } from '@yalla/typography-rules/helpers';

const PATTERNS = createPatterns({
  email: /[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+/g,
  url: /https?:\/\/[^\s]+/g,
});

PATTERNS.email;            // fresh RegExp instance (lastIndex = 0) on every access
[...PATTERNS];             // [RegExp, RegExp]
PATTERNS.combined();       // single alternation RegExp
PATTERNS.insert({ ... });  // extend with new patterns
```

### Node markers

Used to join/split text nodes across boundaries during multi-node processing:

```typescript
import {
  joinNodes,
  splitNodes,
  NODE_MARKER,
} from '@yalla/typography-rules/helpers';

const joined = joinNodes(nodes); // 'text1\uE000\uEDFD\uF43Etext2'
// ... apply rules to `joined` ...
splitNodes(processed, nodes); // writes segments back to nodes
```

---

## Default Rules Reference

### Common (applied to all locales)

#### Expressions

Shared named expression patterns used across common rules
(`typography/expressions/common.ts`):

| Name                             | Pattern description                                                       |
| -------------------------------- | ------------------------------------------------------------------------- |
| `plusMinus`                      | `+` followed by `-` or `−`                                                |
| `minusPlus`                      | `-` or `−` followed by `+`                                                |
| `sectionNumeral`                 | Section sign `§` followed by numeral(s)                                   |
| `percentValue`                   | Number followed by `%`, `‰`, or `‱`                                       |
| `numeralsRange`                  | Two digit sequences separated by `-` (e.g. `1-2`)                         |
| `ellipsisRange`                  | Number, then `–` or `−`, then number (e.g. `−2–3`)                        |
| `multipleEllipsis`               | Two or more consecutive `…`                                               |
| `walletSymbolBeforeValue`        | Currency symbol followed by digits (e.g. `$100`)                          |
| `walletSymbolAfterValue`         | Digits followed by currency symbol (e.g. `100$`)                          |
| `walletISOBeforeValue`           | ISO currency code followed by digits (e.g. `USD 100`)                     |
| `walletISOAfterValue`            | Digits followed by ISO currency code (e.g. `100 USD`)                     |
| `expressiveAposiopesis`          | Expressive punctuation (`!`, `?`, `‽`, etc.) followed by dots or ellipsis |
| `backwardsExpressiveAposiopesis` | Dots or ellipsis followed by expressive punctuation                       |
| `temperature`                    | Digit followed by a temperature unit symbol (℃, ℉, K, etc.)               |

#### Rules

| Label                                        | Pattern / Trigger                    | Replacement           | Description                                                                 |
| -------------------------------------------- | ------------------------------------ | --------------------- | --------------------------------------------------------------------------- |
| `/common/space/cleanup/multiple`             | Multiple identical special spaces    | Single space          | Collapses duplicate non-breaking, hair, and thin spaces via `clearSpaces`   |
| `/common/space/cleanup/trim`                 | Leading / trailing whitespace        | _(removed)_           | Trims surrounding whitespace from the processed text                        |
| `/common/number/negative`                    | Hyphen-minus before digit (`-123`)   | `−123`                | Replaces ASCII hyphen-minus with Unicode minus sign `−`                     |
| `/common/number/range/en-dash`               | Digit range with hyphen (`1-2`)      | `1–2`                 | Converts hyphen between two digit sequences into an en dash                 |
| `/common/number/range/ellipsis-on-negative`  | Range with en dash or minus          | `−2…3`                | Converts numeric ranges using en dash or minus into ellipsis notation       |
| `/common/number/dimension`                   | `NxN` or `NхN` (latin/cyrillic x)    | `N×N`                 | Replaces dimension separator with multiplication sign ×                     |
| `/common/number/multiply`                    | `N*N`                                | `N×N`                 | Replaces asterisk between numbers with multiplication sign ×                |
| `/common/number/fraction`                    | `N/N`                                | `N⁄N` 16⁄9 1000⁄7     | Replaces slash with fraction slash `⁄`                                      |
| `/common/symbol/copyright`                   | `(c)` or `(с)` (latin/cyrillic)      | `©`                   | Copyright symbol substitution                                               |
| `/common/symbol/trademark`                   | `(tm)` or `(тм)`                     | `™`                   | Trademark symbol substitution                                               |
| `/common/symbol/registered`                  | `(r)`                                | `®`                   | Registered trademark symbol substitution                                    |
| `/common/symbol/section`                     | `(s)`                                | `§`                   | Section sign substitution                                                   |
| `/common/symbol/math/plus-minus`             | `+-` or `+−`                         | `±`                   | Plus-minus sign substitution                                                |
| `/common/symbol/math/minus-plus`             | `-+` or `−+`                         | `∓`                   | Minus-plus sign substitution                                                |
| `/common/punctuation/dashes/em-dash`         | Double hyphen `--`                   | `—`                   | Replaces double hyphen-minus with a typographic em dash                     |
| `/common/punctuation/dots/overload`          | Four or more consecutive dots `....` | `...`                 | Normalizes over-long dot sequences before ellipsis conversion               |
| `/common/punctuation/dots/ellipsis`          | Three dots `...`                     | `…`                   | Converts ASCII triple-dot into the Unicode ellipsis character `…`           |
| `/common/punctuation/dots/ellipsis-overload` | Two or more consecutive `…`          | `…`                   | Deduplicates repeated ellipsis characters                                   |
| `/common/punctuation/apostrophe`             | Straight apostrophe `'`              | `’`                   | Replaces with Unicode right single quotation mark `’`, weight `200`         |
| `/common/symbol/section/value`               | `§` followed by numeral(s)           | `§ <numeral>`         | Adds narrow non-breaking space between section sign and numeral, weight `1` |
| `/common/typography/runt`                    | Short last word(s) in a paragraph    | Preceding space → ` ` | Prevents typographic runts. Weight: `Infinity` — always runs last           |

#### Markup Rules

| Label                       | Pattern / Trigger                     | Replacement        | Description                                                               |
| --------------------------- | ------------------------------------- | ------------------ | ------------------------------------------------------------------------- |
| `/common/wraps/chem`        | `[%…]` marker syntax                  | `<math>` node tree | Parses chemical notation into MathML `<mmultiscripts>` via `chemNotation` |
| `/common/wraps/ruby` (`?:`) | `[?:base\|…][?:annotation\|…]` syntax | `<ruby>` node tree | Alternate ruby style (`--alternate`), via `rubyText`                      |
| `/common/wraps/ruby` (`!:`) | `[!:base\|…][!:annotation\|…]` syntax | `<ruby>` node tree | Ruby annotation below the base (`--under`), via `rubyText`                |
| `/common/wraps/ruby` (`:`)  | `[:base\|…][:annotation\|…]` syntax   | `<ruby>` node tree | Ruby annotation above the base (`--over`), via `rubyText`                 |
| `/common/wraps/sup`         | `[^…]` marker syntax                  | `<sup>` node       | Wraps bracket-marker content in a superscript element via `wrapWithTag`   |
| `/common/wraps/sub`         | `[_…]` marker syntax                  | `<sub>` node       | Wraps bracket-marker content in a subscript element via `wrapWithTag`     |

> **Note on markup rule order:** rules are registered with weight `Infinity` and
> applied in the order shown — `chem` first, ruby variants from least-specific
> to most-specific marker (to avoid conflicts), then `sup`/`sub` last.

---

### Russian (`ru`)

#### Expressions

Russian-specific named expression patterns (`typography/expressions/ru.ts`),
extending common expressions:

| Name                        | Pattern description                                                           |
| --------------------------- | ----------------------------------------------------------------------------- |
| `numeroNumeral`             | Numero sign `№` followed by numeral(s)                                        |
| `invalidPunctuationSpacing` | Space after left punctuation or before right punctuation (locale-aware)       |
| `dialogEmDash`              | Em dash `—` at the start of a line (dialogue opener)                          |
| `attributionEmDash`         | Left punctuation, then `—`, then a word (attribution pattern)                 |
| `subjectPredicateEmDash`    | Word `—` word (subject–predicate dash pattern)                                |
| `siUnitMul`, `siUnitDiv`    | SI unit multiplication / division expressions (Cyrillic prefixes)             |
| `siUnitBase`                | Digit followed by a Russian SI unit                                           |
| `siUnitPowAfterNum`         | Digit, SI unit, then exponent digit                                           |
| `siUnitPow`                 | SI unit followed by exponent digit (not preceded by digit)                    |
| `date`                      | Numeral followed by a Russian date abbreviation (в, г, мес, нед, дн, д, etc.) |

#### Rules

| Label                                                   | Pattern / Trigger                                     | Replacement                                | Description                                                                                                             |
| ------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `/russian/currency/wallet/symbol-flip`                  | Currency symbol before value (`$100`)                 | `100$`                                     | Moves currency symbol after the value (Russian convention)                                                              |
| `/russian/currency/wallet/iso-flip`                     | ISO code before value (`USD 100`)                     | `100 USD`                                  | Moves ISO code after the value                                                                                          |
| `/russian/currency/wallet/symbol-value`                 | Value then currency symbol (`100$`)                   | `100 $`                                    | Adds non-breaking space between value and currency symbol                                                               |
| `/russian/currency/wallet/iso-value`                    | Value then ISO code (`100 USD`)                       | `100 USD`                                  | Adds non-breaking space between value and ISO code                                                                      |
| `/russian/currency/rub-to-symbol`                       | `рублей`, `руб.`, `р.` after digits                   | `N ₽`                                      | Replaces Russian rouble word forms with `₽` symbol                                                                      |
| `/russian/currency/eur-to-symbol`                       | `евро` after digits                                   | `N €`                                      | Replaces euro word with `€` symbol                                                                                      |
| `/russian/currency/usd-to-symbol`                       | `долларов`, `дол.` after digits                       | `N $`                                      | Replaces dollar word forms with `$` symbol                                                                              |
| `/russian/number/groups`                                | Large numbers (5+ digits)                             | `1 234 567`                                | Digit grouping via `smartNumberGrouping` with `locale: 'ru-RU'`                                                         |
| `/russian/number/normalize/dot->comma`                  | `N.N` decimal dot                                     | `N,N`                                      | Converts decimal dot to comma (Russian numeric standard)                                                                |
| `/russian/metric/si-unit/base`                          | Digit followed by SI unit                             | `N Unit`                                   | Narrow non-breaking space between value and unit                                                                        |
| `/russian/metric/si-unit/n*n-n`                         | SI unit multiplication (`м*с`)                        | `м·с` `Н·м/с`                              | Replaces `*` between SI units with middle dot `·`                                                                       |
| `/russian/metric/si-unit/n-n*n`                         | SI unit division                                      | `м·с` `Дж/Кл·с`                            | Same as above for division form                                                                                         |
| `/russian/metric/si-unit/pow-after-value`               | `N Unit<exp>`                                         | `N Unit<sup>exp</sup>`                     | Superscript exponent with narrow non-breaking space, weight `-1`                                                        |
| `/russian/metric/si-unit/pow`                           | `Unit<exp>` (no preceding number)                     | `Unit<sup>exp</sup>`<br/>`м³/(кг·с²)`      | Superscript exponent, weight `-1`                                                                                       |
| `/russian/scientific/temperature/value`                 | `N ℃` / `N ℉` etc.                                    | `N ℃`                                      | Non-breaking space between temperature value and unit<br/>`°C` `°F` `K` `°D` `°L` `°N` `°W` `°Da` `°H` `°R` `°Ré` `°Rø` |
| `/russian/symbol/percent-like/value`                    | `N%` / `N‰` / `N‱`                                    | `N<NBSP>%`                                 | Non-breaking space between value and percent-like symbol                                                                |
| `/russian/symbol/numero/value`                          | `№` followed by numeral(s)                            | `№ <numeral>`                              | Narrow non-breaking space between numero sign and numeral                                                               |
| `/russian/number/division`                              | `N/N`                                                 | `N÷N`                                      | Replaces slash between numbers with obelus `÷`                                                                          |
| `/russian/number/division-times`                        | `N/*N`                                                | `N⋇N`                                      | Division-times operator substitution                                                                                    |
| `/russian/punctuation/dashes/dialog-em-dash`            | `—` at line start                                     | `—<NBSP>`                                  | Non-breaking space after dialogue em dash                                                                               |
| `/russian/punctuation/dashes/attribution-em-dash`       | Right punctuation, `<SP>—<SP>`, word                  | Right punctuation, `<NBSP>—<NBSP>`, word   | Non-breaking spaces around attribution dash                                                                             |
| `/russian/punctuation/dashes/subject-predicate-em-dash` | word, `<SP>—<SP>`, word                               | word, `<NBSP>—<SP>`, word                  | Non-breaking spaces around subject–predicate dash                                                                       |
| `/russian/punctuation/quotes`                           | Straight quotes `"…"`                                 | `«…»` / `„…“`                              | Russian typographic quotes via `smartQuotes`, weight `100`                                                              |
| `/russian/punctuation/dot-after-quote`                  | `.»`                                                  | `».`                                       | Moves period outside closing guillemet, weight `1000`                                                                   |
| `/russian/punctuation/dot-after-expression`             | Expressive punctuation near dots<br/>`!...` `!…` etc. | Normalized form<br/>`!..` `?..` `‽..`      | Normalizes aposiopesis punctuation patterns                                                                             |
| `/russian/punctuation/invalid-spacing`                  | Space after `«` or before `»`                         | _(removed)_                                | Removes invalid spaces around guillemets, weight `1000`                                                                 |
| `/russian/compositions/initials`                        | Б. Ю. Александров etc.                                | Б. Ю. Александров<br/>Thin-space separated | Replaces regular spaces between initials and name with thin spaces ` `                                                  |
| `/russian/text/conjunctions`                            | Short particles: `бы`, `же`, `ли` etc.                | `<NBSP>particle`                           | Prevents particles from being orphaned at line start                                                                    |
| `/russian/text/conjunctions`                            | Prepositions: `за`, `из`, `на`, `не` etc.             | `preposition<NBSP>`                        | Prevents prepositions from being left alone at line end                                                                 |
| `/russian/text/adress`                                  | `мкр-н`, `дом`, `д.`, `ул.` etc.                      | With `<NBSP>`                              | Prevents address abbreviations from splitting across lines                                                              |
| `/russian/text/common-shorts`                           | `коп.`, `см.`, `рис.` etc.                            | With `<NBSP>`                              | Prevents common abbreviations from splitting                                                                            |
| `/russian/text/organizations`                           | `АО`, `ООО`, `ПАО`, `НИИ` etc.                        | `ООО<NBSP>`                                | Non-breaking space after legal entity abbreviations                                                                     |
| `/russian/text/dates`                                   | `N в.` / `N г.` / `N мес.` etc.                       | `N<NBSP>в.`                                | Non-breaking space between numeral and date abbreviation                                                                |
| `/russian/text/millions`                                | `N тыс.` / `N млн.` / `N млрд.`                       | `N<NBSP>тыс.`                              | Non-breaking space before large-number abbreviations                                                                    |
| `/russian/text/no-break-hyphen`                         | `кто-то`, `кое-что`, `ну-ка`, `всё-таки` etc.         | With non-breaking hyphen                   | Replaces hyphens in fixed compound words/particles with non-breaking hyphen                                             |
| `/russian/text/orphan-letters`                          | Single Cyrillic letter followed by space              | `letter<NBSP>`                             | Prevents single-letter words from being orphaned at line end                                                            |

#### Markup **Rules**

_No locale-specific markup rules for `ru` currently._

---

### English (`en`)

#### Expressions

English-specific named expression patterns (`typography/expressions/en.ts`),
extending common expressions:

| Name                        | Pattern description                                                  |
| --------------------------- | -------------------------------------------------------------------- |
| `numberNumeral`             | Number sign `#` followed by digits (e.g. `#42`)                      |
| `invalidPunctuationSpacing` | Space after left punctuation or before right punctuation (en-locale) |
| `siUnitMul`, `siUnitDiv`    | SI unit multiplication / division expressions                        |
| `siUnitBase`                | Digit followed by an SI unit                                         |
| `siUnitPowAfterNum`         | Digit, SI unit, then exponent digit                                  |
| `siUnitPow`                 | SI unit followed by exponent digit (not preceded by digit)           |

#### Rules

| Label                                        | Pattern / Trigger                     | Replacement            | Description                                                      |
| -------------------------------------------- | ------------------------------------- | ---------------------- | ---------------------------------------------------------------- |
| `/english/currency/wallet/symbol-flip`       | Value then currency symbol (`100$`)   | `$100`                 | Moves currency symbol before the value (English convention)      |
| `/english/currency/wallet/iso-flip`          | ISO code before value (`USD 100`)     | `100 USD`              | Moves ISO code after the value                                   |
| `/english/currency/wallet/symbol-value`      | Currency symbol before value (`$100`) | `$100`                 | Ensures no extra space between symbol and value                  |
| `/english/currency/wallet/iso-value`         | Value then ISO code (`100 USD`)       | `100 USD`              | Adds non-breaking space between value and ISO code               |
| `/english/number/groups`                     | Large numbers (5+ digits)             | `1,234,567`            | Digit grouping via `smartNumberGrouping` with `locale: 'en-US'`  |
| `/english/metric/si-unit/base`               | Digit followed by SI unit             | `N Unit`               | Narrow non-breaking space between value and unit                 |
| `/english/metric/si-unit/n*n-n`              | SI unit multiplication (`m*s`)        | `m·s` `N·m/s`          | Replaces `*` between SI units with middle dot `·`                |
| `/english/metric/si-unit/n-n*n`              | SI unit division                      | `m·s` `J/C·s`          | Same as above for division form                                  |
| `/english/metric/si-unit/pow-after-value`    | `N Unit<exp>`                         | `N Unit<sup>exp</sup>` | Superscript exponent with narrow non-breaking space, weight `-1` |
| `/english/metric/si-unit/pow`                | `Unit<exp>` (no preceding number)     | `Unit<sup>exp</sup>`   | Superscript exponent, weight `-1`                                |
| `/english/scientific/temperature/value`      | `N ℃` / `N ℉` etc.                    | `N℃`                   | Removes space between temperature value and unit                 |
| `/english/symbol/percent-like/value`         | `N%` / `N‰` / `N‱`                    | `N%`                   | Normalizes space between value and percent-like symbol           |
| `/english/symbol/hash/value`                 | `#` followed by digits (`#42`)        | `#42`                  | Normalizes space between number sign and numeral                 |
| `/english/number/division`                   | `N/N`                                 | `N÷N`                  | Replaces slash between numbers with obelus `÷`                   |
| `/english/number/division-times`             | `N/*N`                                | Division-times form    | Division-times operator substitution                             |
| `/english/punctuation/quotes`                | Straight quotes `"…"` / `'…'`         | `“…”` / `‘…’`          | US typographic quotes via `smartQuotes`, weight `100`            |
| `/english/punctuation/dot-before-expression` | Expressive punctuation near dots      | Normalized form        | Normalizes aposiopesis punctuation patterns                      |
| `/english/punctuation/invalid-spacing`       | Space after `“` or before `”` etc.    | _(removed)_            | Removes invalid spaces around punctuation, weight `1000`         |
| `/english/ligatures/fi`                      | `fi`                                  | `ﬁ`                    | Typographic fi ligature                                          |
| `/english/ligatures/fl`                      | `fl`                                  | `ﬂ`                    | Typographic fl ligature                                          |
| `/english/ligatures/ffi`                     | `ffi`                                 | `ﬃ`                    | Typographic ffi ligature                                         |
| `/english/ligatures/ffl`                     | `ffl`                                 | `ﬄ`                    | Typographic ffl ligature                                         |

#### Markup Rules

_No locale-specific markup rules for `en` currently._

---

### Old English / Ænglisċ (`ang`)

#### Rules

| Label                  | Pattern / Trigger           | Replacement | Description                                                            |
| ---------------------- | --------------------------- | ----------- | ---------------------------------------------------------------------- |
| `/ænglisċ/articles/þe` | `The` / `the` / `Þe` / `þe` | `Þͤ` / `þͤ`   | Replaces modern “the” with Old English thorn + combining letter e (`ͤ`) |

---

## Rule Weights

Rules are applied in ascending weight order. Rules with equal weight preserve
their registration order (stable sort).

| Weight        | Meaning                                                             |
| ------------- | ------------------------------------------------------------------- |
| `-Infinity`   | Always first, which must run before all text transforms             |
| `0` (default) | Standard priority                                                   |
| `< 0`         | Applied before standard rules                                       |
| `> 0`         | Applied after standard rules                                        |
| `100`         | Early-stage — e.g. quote normalization before apostrophe processing |
| `200`         | Late-stage — e.g. apostrophe normalization after quote processing   |
| `Infinity`    | Always last — e.g. `runt`, which must run after all text transforms |

---

### Node utilities

```typescript
import {
  htmlNode,
  renderNode,
  renderNodes,
  nodeToMdast,
} from '@yalla/typography-rules';
```

| Function      | Signature                                   | Description                                                         |
| ------------- | ------------------------------------------- | ------------------------------------------------------------------- |
| `htmlNode`    | `(text, settings?) => Node[]`               | Splits text into a mixed array of text and element nodes via RegExp |
| `renderNode`  | `(node: Node) => string`                    | Serializes a single `Node` to an HTML string                        |
| `renderNodes` | `(nodes: Node[]) => string`                 | Serializes an array of `Node` to an HTML string                     |
| `nodeToMdast` | `(node: Node) => Text \| MdxJsxTextElement` | Converts an internal `Node` to an mdast-compatible AST node         |

---

## TypeScript

The package is fully typed. Key exported types:

```typescript
import type {
  Rule,
  RegExpReplaceRule,
  RegExpTransformRule,
  FunctionRule,
  RuleFunction,
  Node,
  TextNode,
  ElementNode,
  QuoteSettings,
  NumberSpaceSettings,
  ClearSpacesSettings,
  RuntSettings,
  HtmlNodeSettings,
  WrapWithTagsSettings,
  RubyTextSettings,
  ChemNotationSettings,
  TagSettings,
} from '@yalla/typography-rules';
```
