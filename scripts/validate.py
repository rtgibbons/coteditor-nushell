"""Validate serialization and ICU regexes, the regex family used by CotEditor.

This is not a macOS/CotEditor UI integration test.
"""
import ctypes as C
import ctypes.util
import json
import pathlib
import re
import yaml

root = pathlib.Path(__file__).resolve().parent.parent
legacy = json.loads((root / ".build/nushell-legacy-build.json").read_text(encoding="utf-8"))
assert yaml.safe_load((root / "Nushell.yml").read_text(encoding="utf-8")) == legacy

libname = ctypes.util.find_library("icui18n")
if not libname:
    raise RuntimeError("ICU library is required for regex validation")
lib = C.CDLL(libname)
suffix_match = re.search(r"(?:\.so\.|\.)(\d+)(?:\.dylib)?$", libname)
suffix = suffix_match.group(1) if suffix_match else None
if suffix is None:
    # Some platforms resolve an unversioned library. Discover its exported ICU
    # symbol suffix instead of assuming the build machine's version.
    suffix = next((str(n) for n in range(120, 49, -1)
                   if hasattr(lib, f"uregex_open_{n}")), "")
def fn(name, result, args):
    symbol = f"{name}_{suffix}" if suffix else name
    f = getattr(lib, symbol)
    f.restype, f.argtypes = result, args
    return f

class ParseError(C.Structure):
    _fields_ = [("line", C.c_int32), ("offset", C.c_int32),
                ("pre", C.c_uint16 * 16), ("post", C.c_uint16 * 16)]
openrx = fn("uregex_open", C.c_void_p,
            [C.POINTER(C.c_uint16), C.c_int32, C.c_uint32, C.POINTER(ParseError), C.POINTER(C.c_int32)])
close = fn("uregex_close", None, [C.c_void_p])
settext = fn("uregex_setText", None, [C.c_void_p, C.POINTER(C.c_uint16), C.c_int32, C.POINTER(C.c_int32)])
find = fn("uregex_findNext", C.c_int8, [C.c_void_p, C.POINTER(C.c_int32)])
start = fn("uregex_start", C.c_int32, [C.c_void_p, C.c_int32, C.POINTER(C.c_int32)])
end = fn("uregex_end", C.c_int32, [C.c_void_p, C.c_int32, C.POINTER(C.c_int32)])
errorname = fn("u_errorName", C.c_char_p, [C.c_int32])
def utf16(s):
    data = s.encode("utf-16-le")
    return (C.c_uint16 * (len(data) // 2)).from_buffer_copy(data)
def compile_rx(pattern, flags=8):
    buf = utf16(pattern)
    status, pe = C.c_int32(0), ParseError()
    handle = openrx(buf, len(buf), flags, C.byref(pe), C.byref(status))
    if status.value > 0:
        raise AssertionError(f"ICU {errorname(status.value).decode()} at {pe.offset}: {pattern}")
    return handle
def matches(pattern, text):
    h = compile_rx(pattern)
    buf, status = utf16(text), C.c_int32(0)
    try:
        settext(h, buf, len(buf), C.byref(status))
        found = []
        while find(h, C.byref(status)):
            a, b = start(h, 0, C.byref(status)), end(h, 0, C.byref(status))
            found.append(text.encode("utf-16-le")[a*2:b*2].decode("utf-16-le"))
        assert status.value <= 0
        return found
    finally:
        close(h)

bundle = root / "Nushell.cotsyntax"
info = json.loads((bundle / "Info.json").read_text(encoding="utf-8"))
edit = json.loads((bundle / "Edit.json").read_text(encoding="utf-8"))
highlights = json.loads((bundle / "Regex/Highlights.json").read_text(encoding="utf-8"))
outlines = json.loads((bundle / "Regex/Outlines.json").read_text(encoding="utf-8"))
completions = json.loads((bundle / "Completion.json").read_text(encoding="utf-8"))
categories = set("keywords commands types attributes variables values numbers strings characters comments".split())
assert info["kind"] == "code"
assert info["fileMap"] == {"extensions": ["nu"], "interpreters": ["nu"]}
assert set(highlights) == categories
assert len({x["text"] for x in completions}) == len(completions)
assert len(edit["stringDelimiters"]) == 21
assert all(len(d.get("escapeCharacter", "\\")) == 1 for d in edit["stringDelimiters"])
assert edit["comment"] == {"inlines": [{"begin": "#"}], "blocks": []}
source_metadata = json.loads((root / "vendor/SOURCES.json").read_text(encoding="utf-8"))
import hashlib
for source in source_metadata["files"]:
    actual = hashlib.sha256((root / source["path"]).read_bytes()).hexdigest()
    assert actual == source["sha256"], f"Vendored source changed: {source['path']}"

count = 0
for rules in [*highlights.values(), *(legacy[k] for k in categories)]:
    for rule in rules:
        if rule.get("regularExpression"):
            flags = 8 | (2 if rule.get("ignoreCase") else 0) | (32 if rule.get("isMultiline") else 0)
            for field in ("begin", "end", "beginString", "endString"):
                if rule.get(field):
                    close(compile_rx(rule[field], flags))
                    count += 1
for rule in outlines:
    close(compile_rx(rule["pattern"]))
    count += 1

cases = []
def expect(label, pattern, text, expected):
    actual = matches(pattern, text)
    assert actual == expected, f"{label}: {actual!r} != {expected!r}"
    cases.append(label)
builtin = highlights["commands"][0]["begin"]
expect("multiword built-ins exclude arguments", builtin, "ls | to txt; polars math abs; matrix identity 3; http get $url",
       ["ls", "to txt", "polars math abs", "matrix identity", "http get"])
expect("command boundaries", builtin, "my-ls ./open /path/to/ls $ls ^ls foobar", [])
expect("boolean boundaries", highlights["values"][0]["begin"], "true false null true-value $true", ["true", "false", "null"])
expect("flags and negative integers", highlights["attributes"][0]["begin"], "ls --all -a -1 --long-name", ["--all", "-a", "--long-name"])
expect("cell paths", highlights["variables"][0]["begin"], '$env.PATH $record."first name" $row.some-field', ['$env.PATH', '$record."first name"', '$row.some-field'])
expect("ranges", highlights["keywords"][-2]["begin"], "1..10 0..<5", ["..", "..<"])
expect("raw-string hash pairing", legacy["strings"][0]["beginString"], "r##'one '# inner\n# still raw '##", ["r##'one '# inner\n# still raw '##"])
assert legacy["strings"][1]["beginString"] == legacy["strings"][1]["endString"] == '"'
assert legacy["strings"][2]["beginString"] == legacy["strings"][2]["endString"] == "'"
assert next(d for d in edit["stringDelimiters"] if d["begin"] == '"')["escapeCharacter"] == "\\"
assert "escapeCharacter" not in next(d for d in edit["stringDelimiters"] if d["begin"] == "'")
cases.extend(["legacy quote delimiter migration", "native quote escape semantics"])
expect("multiline binary", highlights["numbers"][-1]["begin"], "0x[AA\nFF] 0b[1010]", ["0x[AA\nFF]", "0b[1010]"])
expect("function outlines with flags and quotes", outlines[0]["pattern"], 'export def --env "say hello" [name: string] { }\ndef greet [] {}',
       ['export def --env "say hello"', 'def greet'])
expect("module outlines", outlines[2]["pattern"], "export module tools { }", ["export module tools"])

# Run each pattern against all upstream fixture files as a smoke/performance check.
fixtures = sorted((root / "vendor/fixtures").glob("*.nu")) + [root / "examples/highlighting.nu"]
for fixture in fixtures:
    text = fixture.read_text(encoding="utf-8")
    for rules in highlights.values():
        for rule in rules:
            if rule.get("regularExpression"):
                matches(rule["begin"], text)
report = {
    "yamlRoundTrip": "passed", "nativeStructure": "passed",
    "icuVersion": suffix, "compiledRegexCount": count,
    "targetedCases": cases, "fixturesScanned": [str(f.relative_to(root)) for f in fixtures],
    "vendoredSourceHashes": "passed",
    "macOSCotEditorImportTest": "not performed",
}
(root / ".build/validation-report.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
print(json.dumps(report, indent=2))
