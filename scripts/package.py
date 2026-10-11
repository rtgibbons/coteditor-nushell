"""Create an install archive with deterministic paths and timestamps."""
from pathlib import Path
import zipfile

root = Path(__file__).resolve().parent.parent
destination = root / "dist"
destination.mkdir(exist_ok=True)
files = sorted((root / "Nushell.cotsyntax").rglob("*"))
files += [root / name for name in (
    "Nushell.yml", "README.md", "LICENSE", "THIRD_PARTY_NOTICES.md",
    "examples/highlighting.nu", "build-manifest.json",
)]
archive = destination / "Nushell-CotEditor.zip"
with zipfile.ZipFile(archive, "w", compression=zipfile.ZIP_DEFLATED) as z:
    for file in files:
        if not file.is_file():
            continue
        entry = zipfile.ZipInfo(file.relative_to(root).as_posix(), (2026, 1, 1, 0, 0, 0))
        entry.compress_type = zipfile.ZIP_DEFLATED
        entry.external_attr = 0o100644 << 16
        z.writestr(entry, file.read_bytes())
with zipfile.ZipFile(archive) as z:
    assert z.testzip() is None
print(archive.relative_to(root))
