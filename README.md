# @yalla/typography-rules

A modular, locale-aware typography rules engine for transforming plain text into
typographically correct output. Ships with a glyph registry, smart text
functions, and a composable rule pipeline.

Used as a rules provider for typography plugins such as
[@yalla/remark-typography](https://github.com/DemerNkardaz/remark-typography).

---

## Installation

```bash
npm i @yalla/typography-rules
```

> **Requires Node.js ≥ 24.0.0**

---

## Package Exports

| Export path                       | Description                                                               |
| --------------------------------- | ------------------------------------------------------------------------- |
| `@yalla/typography-rules`         | Main entry — rules, store, types, functions                               |
| `@yalla/typography-rules/glyphs`  | Glyph registries (DASHES, SPACES, PUNCTUATION, …)                         |
| `@yalla/typography-rules/helpers` | Text pipeline helpers (protect/unprotect, node markers, pattern registry) |

---

## Quick Start

### Using default rules

```typescript
import { applyDefaultRules, getWeightedRules } from '@yalla/typography-rules';

// Register all built-in rule groups (common, ru, en, …)
applyDefaultRules();

// Or apply only a specific locale group
applyDefaultRules('ru');

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
registerRule('common', newRule(/\s+/g, ' '));
registerRule('de', newRule(/--/g, '—'), newRule(/"/g, '„'));
```

---

### `applyDefaultRules(from?)`

Populates the global rule registry with the built-in default ruleset.

```typescript
applyDefaultRules(); // All locales
applyDefaultRules('en'); // English rules only
applyDefaultRules('ru'); // Russian rules only
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
| Third segment  | `/common/math/negative-number`            | Specific rule          |

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

Inserts non-breaking spaces (or another character, e.g. `,`) as thousands
separators into large numeric sequences.

```typescript
import { smartNumberGrouping } from '@yalla/typography-rules/functions';

smartNumberGrouping('Price: 1234567');
// "Price: 1 234 567"

smartNumberGrouping('Value: 1234567.891011', { separateFloat: true });
// "Value: 1 234 567.891 011"
```

**Settings:**

| Option          | Type               | Default                     | Description                                            |
| --------------- | ------------------ | --------------------------- | ------------------------------------------------------ |
| `minLength`     | `number`           | `5`                         | Minimum digit count before spacing is applied          |
| `separateFloat` | `boolean`          | `false`                     | Whether to group digits in the fractional part as well |
| `separator`     | `Spaces \| string` | `SPACES.noBreak` (`\u00A0`) | Character inserted as a thousands separator            |

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
longer last words, also protects the penultimate word.

**Settings:**

| Option      | Type               | Default          | Description                                                          |
| ----------- | ------------------ | ---------------- | -------------------------------------------------------------------- |
| `threshold` | `number`           | `10`             | Maximum character length of the last word to trigger runt protection |
| `space`     | `Spaces \| string` | `SPACES.noBreak` | Replacement space character                                          |

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

## Helpers

The `@yalla/typography-rules/helpers` export provides utilities for safe text
pipeline construction.

### Protection system

Temporarily wraps structured content (URLs, emails, code, identifiers) in
protection markers before typography transformations, then restores originals
afterward.

```typescript
import { protect, unprotect } from '@yalla/typography-rules/helpers';

const [protected, captured] = protect(text);
// ... apply typography rules to `protected` ...
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

| Label                                       | Pattern / Trigger                                                    | Replacement                | Description                                                                            |
| ------------------------------------------- | -------------------------------------------------------------------- | -------------------------- | -------------------------------------------------------------------------------------- |
| `/common/space/cleanup/default`             | Multiple identical spaces (`\u00A0{2,}`, `\u200A{2,}`, `\u2009{2,}`) | Single space               | Collapses duplicate non-breaking, hair, and thin spaces via `clearSpaces`              |
| `/common/space/cleanup/trim`                | Leading / trailing whitespace (`^\s` or `\s$`)                       | _(removed)_                | Trims surrounding whitespace from the processed text                                   |
| `/common/math/negative-number`              | Hyphen-minus before digit (`-123`)                                   | `−123`                     | Replaces ASCII hyphen-minus with Unicode minus sign `−` (`\u2212`) in negative numbers |
| `/common/math/number-range/default`         | Digit range with hyphen (`1-2`)                                      | `1–2`                      | Converts hyphen between two integer sequences into an en dash                          |
| `/common/math/number-range/ellipsis`        | Number range with en dash or minus (`−2–3`)                          | `−2…3`                     | Converts numeric ranges using en dash or minus into ellipsis notation                  |
| `/common/typography/dashes`                 | Double hyphen (`--`)                                                 | `—`                        | Replaces double hyphen-minus with a typographic em dash                                |
| `/common/typography/dots/dots-overload`     | Four or more consecutive dots (`....`)                               | `...`                      | Normalizes over-long dot sequences before ellipsis conversion                          |
| `/common/typography/dots/ellipsis`          | Three dots (`...`)                                                   | `…`                        | Converts ASCII triple-dot into the Unicode ellipsis character `…` (`\u2026`)           |
| `/common/typography/dots/ellipsis-overload` | Two or more consecutive ellipses (`……`)                              | `…`                        | Deduplicates repeated ellipsis characters                                              |
| `/common/typography/apostrophe`             | Straight apostrophe (`'`)                                            | `'`                        | Replaces with Unicode right single quotation mark `'` (`\u2019`), weight `200`         |
| `/common/typography/runt`                   | Short last word(s) in a paragraph                                    | Preceding space → `\u00A0` | Prevents                                                                               |

---

### Russian (`ru`)

_Rules coming soon._

| Pattern / Trigger | Replacement | Description |
| ----------------- | ----------- | ----------- |
| —                 | —           | —           |

---

### English (`en`)

_Rules coming soon._

| Pattern / Trigger | Replacement | Description |
| ----------------- | ----------- | ----------- |
| —                 | —           | —           |

---

## Rule Weights

Rules are applied in ascending weight order. Rules with equal weight preserve
their registration order (stable sort).

| Weight        | Meaning                                                           |
| ------------- | ----------------------------------------------------------------- |
| `0` (default) | Standard priority                                                 |
| `< 0`         | Applied before standard rules                                     |
| `> 0`         | Applied after standard rules                                      |
| `200`         | Late-stage — e.g. apostrophe normalization after quote processing |

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
  QuoteSettings,
  NumberSpaceSettings,
  ClearSpacesSettings,
  runtSettings,
} from '@yalla/typography-rules';
```
