# Initial validation

This document describes build-environment checks for version 1.0.0. The repository owner also reports successful manual import in CotEditor, but exact CotEditor/macOS versions were not supplied.

## Automated checks

- **Serialization:** JSON package fields and legacy YAML round-trip equality.
- **Regex compatibility:** all 61 exported highlight/outline regex occurrences compile against ICU 78 in the preparation environment.
- **Targeted cases:** 12 checks cover multiword command boundaries, false-positive boundaries, booleans, flags versus negative integers, variables/cell paths, ranges, raw-string hash pairing, quote configuration, binary literals, and outlines.
- **Fixture scanning:** native highlighting patterns run against three upstream fixtures and the repository's visual example.
- **Provenance:** SHA-256 hashes verify the pinned grammar, license, and upstream fixture snapshots.

The build is tested for byte-identical output on repeated runs. The install archive is checked for ZIP integrity, and its file ordering and timestamps are deterministic.

## Not verified

No automated macOS/CotEditor integration test was performed, and detailed results from the owner's manual check were not recorded. ICU library versions can differ from Apple's Foundation build, and regex-level tests do not exercise CotEditor's delimiter nesting, final highlight precedence, outline UI, or completion UI.

## Manual release checklist

1. Import `Nushell.cotsyntax` in CotEditor 7+ and confirm `.nu` detection and `nu` shebang detection.
2. Open `examples/highlighting.nu`; check raw strings, literal backslashes, interpolated strings, and comments inside/outside strings.
3. Confirm custom-command/module outlines, completion candidates, Comment Out behavior, and indentation.
4. Test the YAML fallback in an older CotEditor version if a release claims that compatibility.
5. Record the tested CotEditor and macOS versions and any observed limitations before publishing a release.
