# 🚀 Lumbung CLI - Command Line Interface

Lumbung CLI adalah **terminal tool** untuk mengelola snippet kode Anda langsung dari command line. Upload, download, dan cari snippet tanpa perlu buka browser!

---

## 📋 **Daftar Isi**

1. [Instalasi](#instalasi)
2. [Quick Start](#quick-start)
3. [Semua Command](#semua-command)
4. [Contoh Penggunaan](#contoh-penggunaan)
5. [Tips & Tricks](#tips--tricks)
6. [Troubleshooting](#troubleshooting)

---

## 📦 **Instalasi**

### **Opsi 1: Install dari NPM (Recommended)**
```bash
npm install -g lumbung-cli
```

### **Opsi 2: Install dari Source**
```bash
git clone https://github.com/sofyan2108/lumbung-kode-ta.git
cd lumbung-kode-ta/cli
npm install
npm link
```

### **Verifikasi Instalasi:**
```bash
lumbung --version
```

---

## ⚡ **Quick Start**

### **1. Login ke Akun Anda**
```bash
lumbung login
```
Masukkan email & password yang sama dengan akun web app.

### **2. Upload Snippet Pertama**
```bash
lumbung push myfile.js --public
```

### **3. Lihat Semua Snippet Anda**
```bash
lumbung list
```

### **4. Download Snippet**
```bash
lumbung get <snippet-id> --output downloaded.js
```

**Selesai!** 🎉

---

## 📖 **Semua Command**

### **🔐 Authentication**

#### `lumbung login`
Login ke akun Lumbung Kode Anda.

```bash
lumbung login
```

**Interactive prompt:**
- Email: `user@example.com`
- Password: `******`

---

#### `lumbung logout`
Keluar dari akun.

```bash
lumbung logout
```

---

#### `lumbung whoami`
Cek status login saat ini.

```bash
lumbung whoami
```

---

### **📤 Upload Snippet**

#### `lumbung push <file>`
Upload file sebagai snippet.

**Basic Usage:**
```bash
lumbung push myfile.js
```

**Dengan Metadata Lengkap:**
```bash
lumbung push component.jsx \
  --title "React Hook: useAuth" \
  --description "Custom authentication hook untuk login" \
  --tags "react,hooks,auth,custom" \
  --public \
  --dependencies '["react","zustand"]' \
  --usage "const { user, login } = useAuth()" \
  --docs "https://docs.example.com/hooks"
```

**Options:**

| Option | Alias | Deskripsi | Contoh |
|--------|-------|-----------|---------|
| `--title <text>` | `-t` | Judul snippet | `--title "My Component"` |
| `--description <text>` | `-d` | Deskripsi snippet | `--description "Does XYZ"` |
| `--language <lang>` | `-l` | Bahasa pemrograman | `--language javascript` |
| `--tags <tags>` | - | Tags (pisah koma) | `--tags "react,hooks"` |
| `--public` | - | Buat public | `--public` |
| `--dependencies <json>` | - | Dependencies (JSON array) | `--dependencies '["react"]'` |
| `--usage <example>` | - | Contoh penggunaan | `--usage "import ..."` |
| `--docs <url>` | - | URL dokumentasi | `--docs "https://..."` |

**Auto-Detect Language:**
CLI otomatis detect bahasa dari file extension:
- `.js`, `.jsx` → JavaScript
- `.ts`, `.tsx` → TypeScript
- `.py` → Python
- `.java` → Java
- dll.

---

### **📥 Download Snippet**

#### `lumbung get <id>`
Ambil snippet berdasarkan ID.

**Tampilkan di Terminal:**
```bash
lumbung get 8ad61948-9251-49be-887e-c215ec3839c5
```

**Save ke File:**
```bash
lumbung get 8ad61948-9251-49be-887e-c215ec3839c5 --output myfile.jsx
```

**Copy ke Clipboard:**
```bash
lumbung get 8ad61948-9251-49be-887e-c215ec3839c5 --copy
```

**Options:**

| Option | Alias | Deskripsi |
|--------|-------|-----------|
| `--output <file>` | `-o` | Simpan ke file |
| `--copy` | `-c` | Copy ke clipboard |

---

### **📋 List Snippets**

#### `lumbung list`
Tampilkan daftar snippet Anda.

**Basic:**
```bash
lumbung list
```

**Filter By Language:**
```bash
lumbung list --language javascript
```

**Limit Results:**
```bash
lumbung list --limit 20
```

**Public Snippets Only:**
```bash
lumbung list --public
```

**Output as JSON:**
```bash
lumbung list --json
```

**Options:**

| Option | Alias | Deskripsi |
|--------|-------|-----------|
| `--language <lang>` | `-l` | Filter by bahasa |
| `--limit <number>` | `-n` | Max results (default: 10) |
| `--public` | - | Hanya public snippets |
| `--json` | - | Output format JSON |

---

### **🔍 Search Snippets**

#### `lumbung search <query>`
Cari snippet dengan full-text search.

**Basic Search:**
```bash
lumbung search "react hooks"
```

**Search My Snippets:**
```bash
lumbung search "authentication" --mine
```

**Search Public Snippets:**
```bash
lumbung search "api client" --public
```

**Filter + Limit:**
```bash
lumbung search "useState" --language javascript --limit 5
```

**Options:**

| Option | Alias | Deskripsi |
|--------|-------|-----------|
| `--language <lang>` | `-l` | Filter by bahasa |
| `--limit <number>` | `-n` | Max results (default: 10) |
| `--mine` | - | Hanya snippet saya |
| `--public` | - | Hanya public snippets |

---

## 💡 **Contoh Penggunaan**

### **Skenario 1: Upload Project File**
```bash
# Navigasi ke folder project
cd D:/Projects/MyApp

# Upload dengan metadata lengkap
lumbung push src/components/Header.jsx \
  --title "Responsive Header Component" \
  --description "Header dengan dark mode support" \
  --tags "react,component,responsive,darkmode" \
  --dependencies '["react","lucide-react"]' \
  --public
```

---

### **Skenario 2: Cari & Download Snippet**
```bash
# Cari snippet authentication
lumbung search "authentication" --public

# Download snippet yang ditemukan
lumbung get abc123...xyz --output auth-helper.js
```

---

### **Skenario 3: Backup Semua Snippet**
```bash
# List semua snippet dalam JSON
lumbung list --json > my-snippets.json

# Loop & download satu per satu (Bash/PowerShell)
# ... (user bisa bikin script sendiri)
```

---

## 🎯 **Tips & Tricks**

### **1. Absolute vs Relative Path**
```bash
# Relative path (dari current directory)
lumbung push ./src/utils.js

# Absolute path (dari mana saja)
lumbung push D:/Projects/app/helper.js
```

---

### **2. Escape JSON String di Windows**
Jika pakai PowerShell, escape quotes dengan backslash:
```powershell
lumbung push file.js --dependencies '[\"react\",\"zustand\"]'
```

Atau gunakan single quotes:
```powershell
lumbung push file.js --dependencies '["react","zustand"]'
```

---

### **3. Kombinasi dengan Pipe**
```bash
# Search & save IDs to file
lumbung search "react" --json | jq '.[] | .id' > snippet-ids.txt
```

---

### **4. Alias/Shortcut**
Tambahkan ke `.bashrc` atau `.zshrc`:
```bash
alias lp='lumbung push'
alias ll='lumbung list'
alias lg='lumbung get'
```

---

## 🐛 **Troubleshooting**

### **Error: "Not logged in"**
**Solution:**
```bash
lumbung login
```

---

### **Error: "Invalid API key"**
Credentials expired. Login ulang:
```bash
lumbung logout
lumbung login
```

---

### **Error: "File not found"**
Pastikan path ke file benar:
```bash
# Cek file exists
ls myfile.js

# Gunakan absolute path
lumbung push D:/full/path/to/file.js
```

---

### **JSON Parse Error (--dependencies)**
Pastikan JSON valid:
```bash
# ❌ Salah
--dependencies ["react"]

# ✅ Benar
--dependencies '["react","zustand"]'
```

---

## 📚 **Resources**

- **Web App:** https://lumbungkode.netlify.app
- **GitHub:** https://github.com/sofyan2108/lumbung-kode-ta
- **NPM Package:** https://npmjs.com/package/lumbung-cli

---

## 🆘 **Butuh Bantuan?**

```bash
# Help untuk semua command
lumbung --help

# Help untuk command tertentu
lumbung push --help
lumbung get --help
```

---

**Made with ❤️ for Developers | Tugas Akhir Informatika 2026**
