import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

process.chdir(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'));
const config = JSON.parse(fs.readFileSync('syntax.config.json', 'utf8'));
const sources = JSON.parse(fs.readFileSync('vendor/SOURCES.json', 'utf8'));

const sourceFiles = [
  'vendor/nu-grammar/tmLanguage.json',
  'vendor/vscode-nushell-lang/nushell.tmLanguage.json',
];
const grammars = sourceFiles.map(f => JSON.parse(fs.readFileSync(f, 'utf8')));
if (JSON.stringify(grammars[0]) !== JSON.stringify(grammars[1])) {
  throw new Error('Upstream grammars differ; review before rebuilding.');
}
const r = grammars[1].repository;
const license = fs.readFileSync('vendor/vscode-nushell-lang/LICENSE', 'utf8');
const output = '.';
fs.mkdirSync('.build', {recursive: true});
const bundle = path.join(output, 'Nushell.cotsyntax');
fs.mkdirSync(path.join(bundle, 'Regex'), {recursive: true});
const json = (name, value) => fs.writeFileSync(path.join(bundle, name), JSON.stringify(value, null, 2) + '\n');
const rx = (begin, description, extra = {}) => ({begin, regularExpression: true, description, ...extra});
const boundary = String.raw`[\w.\-/:\\$^]`;
const bounded = body => `(?<!${boundary})(?:${body})(?!${boundary})`;
const keywordWords = [
  'alias', 'break', 'const', 'continue', 'def', 'def-env', 'do', 'else', 'export',
  'export-env', 'extern', 'for', 'hide', 'hide-env', 'if', 'let', 'let-env', 'loop',
  'match', 'module', 'mut', 'overlay', 'return', 'source', 'source-env', 'try',
  'use', 'while', 'with-env',
];
const typeWords = [
  'any', 'binary', 'bool', 'cell-path', 'closure', 'date', 'datetime', 'duration',
  'error', 'filesize', 'float', 'glob', 'int', 'list', 'nothing', 'number', 'oneof',
  'path', 'range', 'record', 'signature', 'string', 'table',
];
const builtinNode = r.command.beginCaptures['2'].patterns.find(
  p => p.comment?.includes('list-to-tree') && p.match.endsWith('( (.*))?'));
if (!builtinNode) throw new Error('Built-in command pattern not found');
const builtinBody = builtinNode.match.slice(0, -'(?![\\w-])( (.*))?'.length);

// Expand only the finite prefix-tree language in the upstream command regex.
// This avoids maintaining a second, potentially stale command-name list.
function expandTree(pattern) {
  let i = 0;
  const product = (a, b) => a.flatMap(x => b.map(y => x + y));
  function alternatives() {
    let all = [];
    let seq = [''];
    while (i < pattern.length && pattern[i] !== ')') {
      if (pattern[i] === '|') { all.push(...seq); seq = ['']; i++; continue; }
      let atom;
      if (pattern[i] === '(') {
        i++;
        if (pattern.slice(i, i + 2) === '?:') i += 2;
        atom = alternatives();
        if (pattern[i++] !== ')') throw new Error('Unclosed finite regex group');
      } else if (pattern[i] === '\\') {
        i++;
        atom = [pattern[i++]];
      } else {
        const c = pattern[i++];
        if ('[]*+{}^$'.includes(c)) throw new Error(`Non-finite regex token ${c}`);
        atom = [c];
      }
      if (pattern[i] === '?') { i++; atom = ['', ...atom]; }
      seq = product(seq, atom);
    }
    return [...all, ...seq];
  }
  const words = alternatives();
  if (i !== pattern.length) throw new Error('Unconsumed finite command regex');
  return [...new Set(words)].sort();
}
const commandWords = expandTree(builtinBody);

const highlights = {
  keywords: [
    rx(r['control-keywords'].match, 'Upstream control keywords'),
    rx(bounded(keywordWords.join('|')), 'Declarations, imports, and control flow'),
    ...['operators-word', 'operators-symbols', 'operators-redirection', 'spread', 'ranges']
      .map(k => rx(r[k].match, `Upstream ${k}`)),
    rx(String.raw`\||;|->|(?<!\S)\^(?=\S)`, 'Pipeline, statement, signature, and external-command operators'),
  ],
  commands: [
    rx(`(?<!${boundary})${builtinBody}(?!${boundary})`, 'Upstream built-in, keyword, and plugin command names; arguments excluded'),
    rx(String.raw`(?<=\^)[\w.!][\w.\-!]*`, 'Explicit external commands'),
    rx(String.raw`(?<=\|)[\t ]*[\w.!][\w.\-!]*`, 'Custom/external command immediately after a pipe'),
    rx(String.raw`^[\t ]*[\w.!][\w.\-!]*(?=[\t ]|$)`, 'Custom/external command at the beginning of a line'),
    rx(String.raw`(?<=\bdef[\t ])[^\s\[\]{}"'` + '`' + String.raw`]+`, 'Unquoted custom command declaration after def'),
  ],
  types: [
    rx(`(?<![\\w.\\-/$^])(?:${typeWords.join('|')})(?![\\w.\\-/:\\\\])`,
      'Common signature types; flat regex matching is not signature-scoped'),
  ],
  attributes: [
    rx(r.parameters.match, 'Long and short command flags'),
    rx(String.raw`(?<![\w-])@[A-Za-z_][\w-]*(?:[\t ]+[\w-]+)?`, 'Attributes'),
  ],
  variables: [
    rx(r.variables.match, 'Variables and cell paths'),
    rx(r['variable-fields'].match, 'Cell paths after expressions'),
    rx(String.raw`(?<=\b(?:let|mut)[\t ])[A-Za-z_][\w-]*`, 'Unquoted let/mut declaration names'),
    rx(String.raw`(?<=\bconst[\t ])[A-Za-z_][\w-]*`, 'Unquoted const declaration names'),
  ],
  values: [rx(bounded('true|false|null'), 'Boolean and null literals')],
  numbers: [
    ...['datetime', 'numbers-hexa', 'numbers-octal', 'numbers-binary', 'numbers']
      .map(k => rx(r[k].match, `Upstream ${k}`)),
    rx(String.raw`\b0[xbo]\[[0-9a-fA-F_\s]*\]`, 'Binary literals, including multiline values', {isMultiline: true}),
  ],
  strings: [],
  characters: [],
  comments: [],
};
const name = String.raw`([\w\-!]+|"[^"\r\n]+"|'[^'\r\n]+'|` + '`[^`\\r\\n]+`' + ')';
const outlines = [
  {pattern: String.raw`^[\t ]*((?:export[\t ]+)?def(?:-env)?)(?:[\t ]+--[\w-]+)*[\t ]+` + name,
    template: '$1 $2', kind: 'function', description: 'Custom commands, including quoted multiword names'},
  {pattern: String.raw`^[\t ]*((?:export[\t ]+)?extern)[\t ]+` + name,
    template: '$1 $2', kind: 'function', description: 'External command signatures'},
  {pattern: String.raw`^[\t ]*((?:export[\t ]+)?module)[\t ]+` + name,
    template: '$1 $2', kind: 'container', description: 'Modules'},
  {pattern: String.raw`^[\t ]*((?:export[\t ]+)?alias)[\t ]+` + name,
    template: '$1 $2', kind: 'value', description: 'Aliases'},
  {pattern: String.raw`^[\t ]*((?:export[\t ]+)?const)[\t ]+([\w-]+)`,
    template: '$1 $2', kind: 'value', description: 'Constants'},
  {pattern: String.raw`^[\t ]*#[\t ]*(?:MARK:|region:)[\t ]*(.+)$`,
    template: '$1', kind: 'mark', description: 'Named comment sections'},
];
const revisions = Object.fromEntries(sources.grammars.map(s => [s.repository, s.revision]));
const metadata = {
  version: config.version,
  lastModified: config.lastModified,
  distributionURL: config.repositoryURL,
  author: 'The Nushell Project Developers; CotEditor syntax contributors',
  license,
  description: `Regex-based Nushell syntax adapted from https://github.com/hustcer/nu-grammar (${revisions['hustcer/nu-grammar']}) and https://github.com/nushell/vscode-nushell-lang (${revisions['nushell/vscode-nushell-lang']}). Both source grammars are identical at these revisions. Does not reproduce TextMate nesting or semantic language-server features.`,
};
const fileMap = {extensions: ['nu'], interpreters: ['nu']};
const stringDelimiters = [
  ...Array.from({length: 16}, (_, i) => {
    const hashes = '#'.repeat(i + 1);
    return {begin: `r${hashes}'`, end: `'${hashes}`, isMultiline: true,
      description: `Raw string (${i + 1} hashes)`};
  }),
  {begin: '$"', end: '"', isMultiline: true, escapeCharacter: '\\', description: 'Interpolated double-quoted strings (opaque contents)'},
  {begin: "$'", end: "'", isMultiline: true, description: 'Interpolated single-quoted strings (opaque contents)'},
  {begin: '"', end: '"', isMultiline: true, escapeCharacter: '\\', description: 'Double-quoted strings'},
  {begin: "'", end: "'", isMultiline: true, description: 'Single-quoted strings; backslash is literal'},
  {begin: '`', end: '`', isMultiline: true, description: 'Backtick strings; backslash is literal'},
];
json('Info.json', {kind: 'code', fileMap, metadata});
json('Edit.json', {
  comment: {inlines: [{begin: '#'}], blocks: []},
  stringDelimiters,
  indentation: {blockDelimiters: ['{}', '[]', '()'].map(p => ({begin: p[0], end: p[1]}))},
});
json('Regex/Highlights.json', highlights);
json('Regex/Outlines.json', outlines);
const completions = [...new Set([...commandWords, ...keywordWords, ...typeWords, 'true', 'false', 'null'])]
  .sort().map(text => ({text}));
json('Completion.json', completions);
fs.writeFileSync(path.join(bundle, 'LICENSE.txt'), license);

// Legacy YAML uses complete ICU regexes for strings. In particular, the raw
// opener and closer must live in ONE pattern because CotEditor compiles
// begin/end regexes independently and cannot propagate captures between them.
const legacyStrings = [
  rx(String.raw`\br(#+)'[\s\S]*?'\1(?!#)`, 'Raw strings with a matching hash count', {isMultiline: true}),
  {begin: '"', end: '"', description: 'Double-quoted strings; legacy delimiter handling'},
  {begin: "'", end: "'", description: 'Single-quoted strings; legacy implicit backslash escaping is approximate'},
  {begin: '`', end: '`', description: 'Backtick strings; legacy implicit backslash escaping is approximate'},
];
const legacy = {kind: 'code'};
for (const [category, rules] of Object.entries(highlights)) {
  legacy[category] = (category === 'strings' ? legacyStrings : rules).map(({begin, end, ...rest}) =>
    ({beginString: begin, ...(end === undefined ? {} : {endString: end}), ...rest}));
}
legacy.comments = [{beginString: '#', endString: '', description: 'Line comments; native package has more accurate raw-string handling'}];
legacy.commentDelimiters = {inlineDelimiter: '#'};
legacy.outlineMenu = outlines.map(({pattern, template, kind, ...rest}) =>
  ({beginString: pattern, keyString: template, ...rest}));
for (const [key, values] of Object.entries(fileMap)) legacy[key] = values.map(keyString => ({keyString}));
legacy.completions = completions.map(({text}) => ({keyString: text}));
legacy.metadata = metadata;
fs.writeFileSync('.build/nushell-legacy-build.json', JSON.stringify(legacy, null, 2));
fs.writeFileSync(path.join(output, 'build-manifest.json'), JSON.stringify({
  revisions, identicalGrammars: true, upstreamCommandCount: commandWords.length,
  completionCount: completions.length,
  nativeRegexRules: Object.values(highlights).reduce((n, a) => n + a.length, 0),
  outlineCount: outlines.length,
}, null, 2) + '\n');
console.log(`Built native package; ${commandWords.length} upstream command names, ${completions.length} completions.`);
execFileSync(process.env.PYTHON || 'python3', ['scripts/write-yaml.py'], {stdio: 'inherit'});
