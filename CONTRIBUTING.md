# Contributing

Report syntax problems with a minimal `.nu` example, your CotEditor version, your macOS version, and whether you imported the native package or legacy YAML. Screenshots of expected and actual coloring are helpful; remove secrets and personal data before sharing.

## Changes

1. Edit `scripts/build.mjs`, not the generated `Nushell.cotsyntax` or `Nushell.yml` files directly.
2. Add regression cases to `scripts/validate.py` and, where useful, to `examples/highlighting.nu`.
3. Run `npm run package` and review the generated diff.
4. Update `CHANGELOG.md` and `syntax.config.json` when appropriate. Keep `package.json`'s version aligned.

Do not remove upstream license notices. Changes to vendored sources must include updated provenance, hashes, and a reviewed explanation; see [development notes](docs/DEVELOPMENT.md).

By submitting an original contribution, you agree to license it under this repository's MIT license. Disclose any third-party material and preserve its required notices.
