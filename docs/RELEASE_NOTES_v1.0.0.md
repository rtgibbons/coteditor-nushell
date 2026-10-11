# Nushell syntax for CotEditor 1.0.0

Initial independent release of the Nushell syntax definition for CotEditor. Download the definition you need below; the full source repository is not required for installation.

## Downloads

- **Nushell.cotsyntax.zip:** native CotEditor 7+ package. Extract the ZIP, then import the intact `Nushell.cotsyntax` package through CotEditor > Settings > Format > Import.
- **Nushell.yml:** standalone legacy definition for older CotEditor versions. Import the YAML through the same settings pane.

Import only one definition. If an existing Nushell definition is installed, review the replacement prompt before proceeding.

## Included

Command highlighting, declarations and control flow, variables and cell paths, flags, operators, numeric and date literals, strings and comments, declaration outlines, and completion candidates. The native package also includes explicit quote/comment delimiters and indentation definitions.

The pinned upstream vocabulary contains 774 command names, including optional/plugin commands, and the definitions provide 796 unique completion candidates. Highlighting a command does not imply it is installed.

## Validation and limitations

Automated checks cover serialization, ICU regex compilation, 12 targeted regression checks, upstream fixture scanning, provenance hashes, and reproducible generation. The repository owner reports successful manual import in CotEditor; exact CotEditor/macOS versions and detailed visual-check results were not supplied.

This is a regex-based syntax definition, not a full parser or language server. Interpolated strings are colored as whole strings, bare command/type matching can produce context-related false positives, and native raw strings support 1–16 hashes. The legacy YAML has less accurate escape and raw-string handling.

## Attribution

Built with AI assistance from Perplexity Computer under `rtgibbons`' direction. Adapted from [hustcer/nu-grammar](https://github.com/hustcer/nu-grammar) and [nushell/vscode-nushell-lang](https://github.com/nushell/vscode-nushell-lang), with upstream MIT notices preserved in both downloads.

This is an independent additional syntax, not an official CotEditor or Nushell release. Full source, limitations, and development instructions are available in the repository.
