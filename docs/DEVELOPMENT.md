# Development

The committed native package and YAML are generated artifacts. Their source of truth is `scripts/build.mjs`, `syntax.config.json`, and the vendored grammar snapshots.

## Repository layout

```text
Nushell.cotsyntax/          Native CotEditor 7 syntax package
Nushell.yml                Legacy fallback
scripts/                   Generator, serializer, ICU validator, packager
vendor/                    Pinned grammars, upstream licenses, and fixtures
examples/highlighting.nu   Visual smoke-test script
docs/                      Development and validation notes
.github/workflows/         Build/test workflow with read-only permissions
```

## Source updates

1. Review changes in [nu-grammar](https://github.com/hustcer/nu-grammar) and [vscode-nushell-lang](https://github.com/nushell/vscode-nushell-lang) and select exact commit IDs.
2. Replace the corresponding vendored grammar files and, if needed, fixture files and upstream licenses. Record the exact commits and file SHA-256 hashes in `vendor/SOURCES.json`.
3. Compare both grammars. The generator deliberately fails if they differ; do not silently merge incompatible grammar versions. If divergence is intentional, update that policy with an explanation.
4. Update the generator as necessary, then run `npm run package`.
5. Review the generated diff, update the changelog, and perform an actual CotEditor import/visual check before publishing a release.

The command prefix-tree regex is expanded into completion candidates and retained for command coloring. Its argument capture is removed to avoid coloring the rest of the line as part of a command. Patterns relying on TextMate captures, nested scopes, or independently compiled begin/end backreferences are not copied wholesale.

## Reproducibility

Version and modification date come from `syntax.config.json`, not the current clock. Generated validation reports are kept in ignored `.build/` because ICU versions vary by machine. Packaging uses stable file paths and timestamps. CI checks that regeneration does not change the committed native package, YAML, or manifest.

Node has no third-party runtime dependencies for this project. Python uses pinned PyYAML for serialization and directly calls the installed ICU library for regex checks.

## Publishing

The personal repository is `rtgibbons/coteditor-nushell`. Pushing the source repository does not publish a versioned release or certify macOS compatibility.

For a future GitHub release, build and validate, test import in CotEditor on macOS, create a matching version tag, and attach `dist/Nushell-CotEditor.zip`. Do not claim macOS validation until it has actually been performed.
