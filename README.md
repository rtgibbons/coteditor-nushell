# Nushell syntax for CotEditor

An independently distributed Nushell syntax definition for CotEditor. Includes a native `Nushell.cotsyntax` package for CotEditor 7+ and a legacy `Nushell.yml` fallback for older versions ([CotEditor format guidance](https://coteditor.com/news/2026/CotEditor_7.0.0)).

This is not an official CotEditor or Nushell project. It is a regex-based adaptation of [hustcer/nu-grammar](https://github.com/hustcer/nu-grammar) and [nushell/vscode-nushell-lang](https://github.com/nushell/vscode-nushell-lang), not a language server or a full TextMate parser.

The adaptation was built with AI assistance under the repository owner's direction. See [AI assistance](#ai-assistance) for scope and validation disclosures.

## Install

**[Download Nushell for CotEditor 7+](https://github.com/rtgibbons/coteditor-nushell/releases/latest/download/Nushell.cotsyntax.zip)**

For older CotEditor versions, download the [legacy YAML definition](https://github.com/rtgibbons/coteditor-nushell/releases/latest/download/Nushell.yml). Both files are available on the [Releases page](https://github.com/rtgibbons/coteditor-nushell/releases).

1. Download `Nushell.cotsyntax.zip` above and extract it. You do not need to download the repository or install build tools.
2. In CotEditor, open Settings > Format.
3. Open the More menu below the available syntaxes list, choose Import, and select the extracted `Nushell.cotsyntax` package. Keep the package intact; do not select one of its internal JSON files.
4. For CotEditor versions before 7, import `Nushell.yml` instead. CotEditor 7 can also convert legacy YAML, but the native package provides more accurate delimiter definitions ([CotEditor migration guidance](https://coteditor.com/news/2026/CotEditor_7.0.0)).
5. Open a `.nu` file. If an already-open file keeps another syntax, select Nushell from Format > Syntax.

Import only one version. If a Nushell syntax already exists, review CotEditor's replacement prompt before proceeding. `examples/highlighting.nu` provides a visual smoke-test document.

## Features

- **Detection:** `.nu` extension and `nu` shebang interpreter.
- **Highlighting:** command vocabulary, declarations, control flow, operators, flags, attributes, variables and cell paths, booleans, null, dates, numbers, durations, file sizes, and binary literals.
- **Native delimiters:** multiline quoted strings, opaque interpolated strings, raw strings with 1–16 hashes, and `#` line comments protected inside recognized strings.
- **Navigation:** outlines for custom commands, extern signatures, modules, aliases, constants, and `# MARK:` / `# region:` sections.
- **Editing:** 796 unique completion candidates, comment-out configuration, and native indentation delimiters for braces, brackets, and parentheses.

The initial build extracts 774 command names directly from the pinned upstream regex. That vocabulary includes keywords and optional/plugin commands; highlighting does not mean a command is installed in your Nushell environment.

## Limitations

This definition matches patterns rather than parsing a syntax tree. Custom CotEditor syntax definitions use regex-based parsing; custom tree-sitter support is not available through a syntax definition ([CotEditor parsing guidance](https://coteditor.com/news/2026/CotEditor_7.0.0)).

Interpolated strings are colored as whole strings without recursively highlighting embedded expressions. Built-in and common type names are not fully context-scoped, so bare arguments, record fields, or declaration names can receive command/type colors. Bare strings are intentionally not colored globally, to avoid swallowing keywords. Raw strings using more than 16 hashes are not guaranteed.

The legacy YAML fallback inherits implicit backslash escaping in single-quoted and backtick strings, and raw-string highlighting can conflict with comment detection. Prefer the native package for more accurate quote/comment boundaries. The legacy format does not preserve the native indentation settings.

There are no diagnostics, semantic completion, go-to-definition, or runtime validation. Completion candidates are plain text, not VS Code snippets.

## Build and validate

Installation does not require any build tools. To regenerate the definitions, use Node.js 20+, Python 3, and PyYAML; the ICU validation path is exercised on Linux.

```sh
python3 -m venv .venv
. .venv/bin/activate
python3 -m pip install --requirement requirements.txt
npm run build
npm test
npm run package
```

Validation additionally requires a discoverable ICU shared library. On Ubuntu, install it with `sudo apt-get install libicu-dev`; on other systems, provide ICU in the platform's shared-library search path. The workflow uses Ubuntu 24.04 and does not verify CotEditor's macOS UI.

`npm run package` writes the native-only `dist/Nushell.cotsyntax.zip`, the standalone `dist/Nushell.yml`, and an optional combined `dist/Nushell-CotEditor.zip`. Build and validation run locally against vendored snapshots without fetching upstream repositories; dependency installation and GitHub Actions require network access. The `private` field in `package.json` prevents accidental npm publication and does not determine GitHub repository visibility.

See [development notes](docs/DEVELOPMENT.md) for source updates and [initial validation](docs/VALIDATION.md) for the tested scope.

## AI assistance

The CotEditor adaptation, build and validation tooling, and documentation were prepared with AI assistance from Perplexity Computer under `rtgibbons`' direction. The original Nushell grammar and vendored fixtures remain attributed to their upstream authors; AI assistance does not replace those notices.

Automated build, provenance, and regex checks were performed, and the repository owner reports successful manual import in CotEditor. The CotEditor/macOS versions and detailed visual-check results were not recorded, and CI does not run the macOS application. Treat the generated definition as a maintained software artifact requiring review and testing, not as a guarantee of correctness.

The initial commit includes `Co-authored-by: Perplexity Computer <perplexity-computer@ai.invalid>` to make the AI assistance visible in Git history. This synthetic, non-deliverable address is a disclosure label only; it does not represent a human contributor or a verified GitHub account.

## License and attribution

MIT. See [LICENSE](LICENSE) and [third-party notices](THIRD_PARTY_NOTICES.md); upstream copyright and permission notices are preserved in the generated definitions as well as the vendored sources.

Pinned source revisions and SHA-256 checksums are recorded in `vendor/SOURCES.json`. Both upstream grammars are structurally identical at the pinned revisions. No CotEditor source code is included.

This repository is an additional syntax, not a built-in submission. Any future built-in proposal must first follow [CotEditor's contribution process](https://raw.githubusercontent.com/coteditor/CotEditor/main/CONTRIBUTING.md), including maintainer agreement on inclusion and license/notice packaging.
