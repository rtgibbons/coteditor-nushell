#!/usr/bin/env nu

# MARK: Values
const LIMIT = 10
let size = 10pb + 2pib
let when = 2024-01-01T00:00:00-05:00
let bytes = 0x[AA FF]
let window = 0..<5
let enabled = true
let missing = null

# MARK: Strings and comments
let plain = "A # inside a string is not a comment"
let literal = 'C:\' # Single-quoted backslashes are literal in the native package
let backtick = `a path with spaces`
let raw = r##'Contains '# and # without ending the string'##
let message = $"Limit: ($LIMIT)"

# MARK: Definitions
export def --env "say hello" [name: string, --loud (-l)] {
  print $"Hello, ($name)"
}

module tools {
  export def greet [] { print "hello" }
}

alias ll = ls --all
extern "git status" [--short (-s)]

# MARK: Pipelines
ls --all | where size > 1kb | sort-by name | select name size
http get https://example.com | from json
^git status --short
