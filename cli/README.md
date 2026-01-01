# 🖥️ CodeHaven CLI

Command Line Interface untuk **CodeHaven - Modern Snippet Manager**.

Upload, cari, dan kelola snippet kode langsung dari terminal Anda.

---

## 📦 Instalasi

### Prasyarat
- Node.js versi 18 atau lebih baru
- Akun CodeHaven (daftar di https://codehaven.app)

### Install dari Source

```bash
# Clone repository
cd snippet-manager/cli

# Install dependencies
npm install

# Link secara global
npm link

# Sekarang bisa digunakan dari mana saja
codehaven --help
```

---

## 🚀 Panduan Penggunaan

### 1. Login ke Akun Anda

Sebelum menggunakan CLI, login terlebih dahulu:

```bash
codehaven login
```

Masukkan email dan password akun CodeHaven Anda. Kredensial akan disimpan secara lokal.

Cek status login:
```bash
codehaven whoami
```

### 2. Upload Snippet dari File

```bash
# Upload file dengan auto-detect title dan language
codehaven push myfile.js

# Upload dengan title custom
codehaven push script.py --title "Python Script"

# Upload sebagai public snippet
codehaven push helper.ts --public

# Upload dengan metadata lengkap
codehaven push api.go \
  --title "Go REST API" \
  --description "Simple REST endpoint" \
  --tags "go,rest,api" \
  --public
```

### 3. Lihat Daftar Snippet Anda

```bash
# List semua snippet
codehaven list

# Filter by language
codehaven list --language python

# Limit hasil
codehaven list --limit 5

# Output sebagai JSON
codehaven list --json
```

### 4. Ambil Snippet by ID

```bash
# Tampilkan snippet di terminal
codehaven get abc123

# Simpan ke file
codehaven get abc123 --output ./download/snippet.js

# Copy ke clipboard
codehaven get abc123 --copy
```

### 5. Cari Snippet

```bash
# Search dengan kata kunci
codehaven search "react hooks"

# Search hanya snippet milik sendiri
codehaven search "useEffect" --mine

# Search snippet public
codehaven search "authentication" --public

# Filter by language
codehaven search "api" --language python
```

### 6. Logout

```bash
codehaven logout
```

---

## 📋 Referensi Command

| Command | Deskripsi |
|---------|-----------|
| `codehaven login` | Login ke akun CodeHaven |
| `codehaven logout` | Logout dari akun |
| `codehaven whoami` | Tampilkan user yang sedang login |
| `codehaven push <file>` | Upload file sebagai snippet |
| `codehaven get <id>` | Ambil snippet berdasarkan ID |
| `codehaven list` | Daftar snippet milik Anda |
| `codehaven search <query>` | Cari snippet dengan full-text search |

---

## 🎯 Options

### `push` Options
| Option | Deskripsi |
|--------|-----------|
| `-t, --title <title>` | Judul snippet |
| `-l, --language <lang>` | Bahasa pemrograman |
| `-d, --description <desc>` | Deskripsi snippet |
| `--tags <tags>` | Tags (pisahkan dengan koma) |
| `--public` | Jadikan snippet public |

### `get` Options
| Option | Deskripsi |
|--------|-----------|
| `-o, --output <file>` | Simpan ke file |
| `-c, --copy` | Copy ke clipboard |

### `list` Options
| Option | Deskripsi |
|--------|-----------|
| `-l, --language <lang>` | Filter by language |
| `-n, --limit <num>` | Limit hasil (default: 10) |
| `--public` | Hanya snippet public |
| `--json` | Output sebagai JSON |

### `search` Options
| Option | Deskripsi |
|--------|-----------|
| `-l, --language <lang>` | Filter by language |
| `-n, --limit <num>` | Limit hasil (default: 10) |
| `--mine` | Hanya snippet milik sendiri |
| `--public` | Hanya snippet public |

---

## 🌐 Bahasa yang Didukung

CLI mendukung **semua bahasa pemrograman**. Auto-detect berdasarkan extension:

| Extension | Language |
|-----------|----------|
| `.js`, `.jsx` | JavaScript |
| `.ts`, `.tsx` | TypeScript |
| `.py` | Python |
| `.java` | Java |
| `.cpp`, `.c` | C/C++ |
| `.go` | Go |
| `.rs` | Rust |
| `.rb` | Ruby |
| `.php` | PHP |
| `.html` | HTML |
| `.css`, `.scss` | CSS |
| `.sql` | SQL |
| `.md` | Markdown |
| `.json` | JSON |
| `.yaml`, `.yml` | YAML |
| Dan lainnya... | Auto-detect |

---

## 💡 Contoh Penggunaan

### Workflow Harian

```bash
# Pagi: Login
codehaven login

# Simpan function baru yang dibuat
codehaven push ./src/utils/debounce.js --tags "utility,hooks"

# Cari snippet lama
codehaven search "validation"

# Ambil snippet dan gunakan
codehaven get xyz789 --output ./temp/snippet.js

# Sore: Check semua snippet hari ini
codehaven list --limit 20
```

### Scripting & Automation

```bash
# Export semua snippet sebagai JSON
codehaven list --json > my-snippets.json

# Batch upload
for file in ./src/**/*.js; do
  codehaven push "$file" --public
done
```

---

## ❓ Troubleshooting

### "Not logged in"
Jalankan `codehaven login` terlebih dahulu.

### "Snippet not found"
Pastikan ID snippet benar. Gunakan `codehaven list` untuk melihat ID snippet Anda.

### "Search failed"
Query minimal 3 karakter. Pastikan koneksi internet aktif.

### Credential issues
Hapus credential dan login ulang:
```bash
codehaven logout
codehaven login
```

---

## 📄 License

MIT License - CodeHaven Team
