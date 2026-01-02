# 📦 Lumbung Kode CLI Releases

This folder is for packaged releases of Lumbung Kode CLI tool.

## Generate Release Package

To create a distributable package:

```bash
cd cli
npm pack
```

This will generate `lumbung-cli-1.0.0.tgz` file (~8 KB).

## Installation from Package

**Option 1: Install from .tgz file**
```bash
npm install -g lumbung-cli-1.0.0.tgz
```

**Option 2: Install from NPM (after publishing)**
```bash
npm install -g lumbung-cli
```

**Option 3: Install from source**
```bash
cd cli
npm install
npm link
```

## Features

- Login/Logout authentication
- Push snippets from files
- Get snippets by ID
- List user snippets
- Full-text search

**Requirements:**
- Node.js 18+
- NPM

For complete documentation, see `cli/README.md`.

