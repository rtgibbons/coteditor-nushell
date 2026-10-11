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

For a GitHub release, build and validate, review available manual-test evidence, create an annotated matching version tag, and attach `dist/Nushell.cotsyntax.zip` and `dist/Nushell.yml`. Keep these asset names stable so the README's latest-release download links continue to work.

Use `gh release create` with `--verify-tag`, the exact tag, and the version's release-notes file. Verify downloaded asset hashes against the local files after publication. Manual testing was reported for the initial release, but version details were not supplied; do not describe it as automated or version-specific macOS validation.

Alternatively, dispatch the `Publish release` workflow with an existing version tag. It checks out that exact tag, verifies the configured version and notes, builds and tests the assets, and publishes using a repository-scoped GitHub Actions token. It can finish a draft release but refuses to modify an already published one; uploaded downloads are compared byte-for-byte with the build output.
