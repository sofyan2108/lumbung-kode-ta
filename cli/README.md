# 🖥️ lumbung CLI

Command Line Interface untuk **lumbung - Modern Snippet Manager**.

Upload, cari, dan kelola snippet kode langsung dari terminal Anda.

---

## 📦 Instalasi

### Prasyarat
- Node.js versi 18 atau lebih baru
- Akun lumbung (daftar di https://lumbung.app)

### Install dari Source

```bash
# Clone repository
cd snippet-manager/cli

# Install dependencies
npm install

# Link secara global
npm link

# Sekarang bisa digunakan dari mana saja
lumbung --help
```

---

## 🚀 Panduan Penggunaan

### 1. Login ke Akun Anda

Sebelum menggunakan CLI, login terlebih dahulu:

```bash
lumbung login
```

Masukkan email dan password akun lumbung Anda. Kredensial akan disimpan secara lokal.

Cek status login:
```bash
lumbung whoami
```

### 2. Upload Snippet dari File

```bash
# Upload file dengan auto-detect title dan language
lumbung push myfile.js

# Upload dengan title custom
lumbung push script.py --title "Python Script"

# Upload sebagai public snippet
lumbung push helper.ts --public

# Upload dengan metadata lengkap
lumbung push api.go \
  --title "Go REST API" \
  --description "Simple REST endpoint" \
  --tags "go,rest,api" \
  --public
```

### 3. Lihat Daftar Snippet Anda

```bash
# List semua snippet
lumbung list

# Filter by language
lumbung list --language python

# Limit hasil
lumbung list --limit 5

# Output sebagai JSON
lumbung list --json
```

### 4. Ambil Snippet by ID

```bash
# Tampilkan snippet di terminal
lumbung get abc123

# Simpan ke file
lumbung get abc123 --output ./download/snippet.js

# Copy ke clipboard
lumbung get abc123 --copy
```

### 5. Cari Snippet

```bash
# Search dengan kata kunci
lumbung search "react hooks"

# Search hanya snippet milik sendiri
lumbung search "useEffect" --mine

# Search snippet public
lumbung search "authentication" --public

# Filter by language
lumbung search "api" --language python
```

### 6. Logout

```bash
lumbung logout
```

---

## 📋 Referensi Command

| Command | Deskripsi |
|---------|-----------|
| `lumbung login` | Login ke akun lumbung |
| `lumbung logout` | Logout dari akun |
| `lumbung whoami` | Tampilkan user yang sedang login |
| `lumbung push <file>` | Upload file sebagai snippet |
| `lumbung get <id>` | Ambil snippet berdasarkan ID |
| `lumbung list` | Daftar snippet milik Anda |
| `lumbung search <query>` | Cari snippet dengan full-text search |

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
lumbung login

# Simpan function baru yang dibuat
lumbung push ./src/utils/debounce.js --tags "utility,hooks"

# Cari snippet lama
lumbung search "validation"

# Ambil snippet dan gunakan
lumbung get xyz789 --output ./temp/snippet.js

# Sore: Check semua snippet hari ini
lumbung list --limit 20
```

### Scripting & Automation

```bash
# Export semua snippet sebagai JSON
lumbung list --json > my-snippets.json

# Batch upload
for file in ./src/**/*.js; do
  lumbung push "$file" --public
done
```

---

## ❓ Troubleshooting

### "Not logged in"
Jalankan `lumbung login` terlebih dahulu.

### "Snippet not found"
Pastikan ID snippet benar. Gunakan `lumbung list` untuk melihat ID snippet Anda.

### "Search failed"
Query minimal 3 karakter. Pastikan koneksi internet aktif.

### Credential issues
Hapus credential dan login ulang:
```bash
lumbung logout
lumbung login
```

---

## 📄 License

MIT License - lumbung Team

