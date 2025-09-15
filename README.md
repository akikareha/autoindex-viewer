# Autoindex Image Gallery (Single‑File)

A zero‑backend, client‑side image gallery that reads an Nginx **autoindex** directory and renders a lightweight, browsable grid - folders included. Drop one file (**`view.html`**) at your site root, and link to it with **`?p=/your/path/`**.

> **Provenance:** This README and the accompanying `view.html` were generated with **ChatGPT 5**.

---

## Why this exists

When you already host images behind Nginx and keep directory listing (`autoindex`) on, you don’t want a database or a thumbnailer - you just want to *see what’s there* and click around like a file manager. This tool:

- fetches the autoindex HTML of any path on the same origin,
- parses it in the browser (no server needed),
- shows **folders** and **image files** (PNG/JPG/JPEG/GIF/WEBP/SVG),
- lets you browse **without page reloads** (History API), and
- opens originals in a new tab when you click a thumbnail.

---

## Quick start

1. **Enable autoindex** for your image directories (see Nginx sample below).
2. Put `view.html` ** at the web root** of the same site (e.g. `https://icon.example.org/view.html`).
3. Open one of these:
   - `https://icon.example.org/view.html` (root)
   - `https://icon.example.org/view.html?p=/birds/` (start in a subdirectory)

You can link to `view.html?p=...` from anywhere (e.g. your wiki or homepage).

> **Important:** Do **not** place an `index.html` inside directories you want listed. Nginx will serve that index file instead of the autoindex page.

---

## Nginx sample

```nginx
server {
    server_name  icon.example.org;
    root   /srv/www/icon.example.org;

    # Directory listing for all image folders
    location / {
        autoindex on;
        autoindex_exact_size off;   # optional: human readable sizes
        autoindex_localtime  on;    # optional: show local time
        # Leave `index` as default or remove index files from image dirs
    }
}
```

**Note:** You usually don’t need a dedicated `location = /view.html` block... Only add it if rewrites/auth would intercept it.

No CORS configuration is required because the viewer fetches the same origin it’s served from.

---

## Usage

- **Browse:** Click 📁 folders to navigate. The URL updates (History API), so browser **Back/Forward** works.
- **Open image:** Click a thumbnail to open the original in a new tab.
- **Deep‑link:** Link others to a specific folder like `.../view.html?p=/art/flamingos/`.

---

## Customization

All tweaks are in plain HTML/CSS/JS inside `view.html`.

- **File types:** Extend `IMG_RE` (default: `png|jpe?g|gif|webp|svg`). For AVIF, add `avif`.
- **Grid size / spacing:** Edit CSS custom properties at the top:
  ```css
  :root { --gap: 12px; --tile: 180px; }
  ```
- **Start path default:** At the bottom, change how `start` is derived if you want a fixed default instead of `/`.
- **Branding / title:** Edit `<title>` and the header `<h1>`.
- **Dark mode:** Add a `prefers-color-scheme: dark` block if desired.

---

## How it works

- The viewer calls `fetch(<currentPath>/)` and receives the **autoindex HTML**.
- It parses anchors via `DOMParser`, filters out `../`, classifies entries by suffix and trailing `/`.
- It renders **folders first**, then images.
- Navigation is handled with `history.pushState` / `popstate`.

No server code, database, build step, or thumbnailer.

---

## Accessibility

- Each tile includes the filename as visible text (also useful as an implicit label).
- Thumbnails use `object-fit: contain` to avoid cropping.

---

## Browser support

Modern evergreen browsers (Chromium, Firefox, Safari). It relies on `fetch`, `URL`, `DOMParser`, and the History API.

---

## Limitations

- **Large folders:** All images are loaded at their source size (displayed smaller via CSS). For extremely large or heavy folders, consider adding lazy‑loading or server‑side thumbnails later.
- **Autoindex required:** If a directory is protected or returns a custom page instead of the standard listing, the parser won’t find files.
- **CSP:** If your site enforces a strict Content Security Policy that disallows inline scripts, move the `<script>` into a separate file and allow it via a hash or nonce.

---

## Troubleshooting

- **Nothing shows:**
  - Check that `autoindex on;` is active for the path in question.
  - Verify the `?p=/some/path/` actually exists and ends with a trailing `/`.
  - Ensure there’s no `index.html` in the target folder.
- **403/404 shown in status:** The directory might be restricted or missing. Adjust permissions or the path.
- **Thumbnails broken:** Open DevTools -> Network to see if image URLs resolve; confirm the anchors in your autoindex are plain relative links.

---

## Security notes

- The viewer only fetches the **same origin**. It doesn’t make cross‑origin requests.
- It never executes third‑party scripts; it merely displays images you already serve.

---

## License

MIT.

---

## Credits

- Concept & hosting: Aki Kareha <aki@kareha.org>.
- Implementation assistance: **ChatGPT 5** (OpenAI).
