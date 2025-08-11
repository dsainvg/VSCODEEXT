# AUTO DATE

Create a C++ file named `YYYYMMDD-XXX.cpp` in the current workspace root using a fixed template, auto-incrementing the 3‑digit serial per day.

## Features
- Command: "Create Date+Serial C++ File".
- Default keybinding: `Ctrl+N Ctrl+C` (when an editor is focused).
- File location: Workspace root.
- Name format: `YYYYMMDD-XXX.cpp` where `XXX` starts at `001` per day.
- Opens the new file automatically.

## Usage
- Command Palette: `Ctrl+Shift+P` → "Create Date+Serial C++ File".
- Keybinding: `Ctrl+N Ctrl+C` from any editor.

## Requirements
- VS Code 1.78+.

## Extension Settings
- No settings required.

## Known Issues
- None currently.

## Release Notes
### 0.0.4
- Add default keybinding and packaging cleanup.

### 0.0.3
- Rename display name to "AUTO DATE".

### 0.0.2
- Create files in workspace root. Add command palette contribution.

### 0.0.1
- Initial release.

## License
MIT
