"""Create an install archive with deterministic paths and timestamps."""
from pathlib import Path
import shutil
import zipfile

root = Path(__file__).resolve().parent.parent
destination = root / "dist"
destination.mkdir(exist_ok=True)
native_files = sorted((root / "Nushell.cotsyntax").rglob("*"))
combined_files = native_files + [root / name for name in (
    "Nushell.yml", "README.md", "LICENSE", "THIRD_PARTY_NOTICES.md",
    "examples/highlighting.nu", "build-manifest.json",
)]
def archive_files(name, files):
    archive = destination / name
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
    return archive

native_archive = archive_files("Nushell.cotsyntax.zip", native_files)
with zipfile.ZipFile(native_archive) as z:
    assert all(n.startswith("Nushell.cotsyntax/") for n in z.namelist())
    assert "Nushell.cotsyntax/Info.json" in z.namelist()
    assert "Nushell.cotsyntax/LICENSE.txt" in z.namelist()
archive_files("Nushell-CotEditor.zip", combined_files)
shutil.copyfile(root / "Nushell.yml", destination / "Nushell.yml")
assert (root / "Nushell.yml").read_bytes() == (destination / "Nushell.yml").read_bytes()
print("dist/Nushell.yml")
