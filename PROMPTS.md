# PROMPTS.md - Autoindex Image Gallery

> **Provenance:** This program and docs were generated with **ChatGPT 5**.

This file summarizes, at a high level, the prompts/instructions that guided the creation of the single‑file gallery (`view.html`) and its README. It is not a verbatim chat log; it captures the intent and constraints that were repeatedly reinforced during the conversation.

---

## High‑level goal (core prompt)
- Treat an external site (same origin) **like a file manager**: show **images inline as a gallery**, show **folders** with an icon and allow drilling down.
- **Zero backend**: no server code, no database, no thumbnail generation; **client‑only** HTML/CSS/JS.
- Use **Nginx autoindex** output as the source of truth; fetch and parse directory listings in the browser.
- Provide a **single viewer file** `view.html` at the site root; **do not** require placing an index file in each folder.
- Allow HimeWiki (or any site) to link to the viewer with a query parameter (e.g., `?p=/birds/`).

## Architecture & navigation prompts
- Implement a **single‑page** viewer that **does not reload**: clicking a folder should update the displayed path only.
- Use the **History API** (`pushState` / `popstate`) so **Back/Forward** works; show a breadcrumb.
- Determine the start path from `?p=/...` (and support `#` fallback), defaulting to `/`.

## Parsing & rendering prompts
- Fetch the autoindex HTML for the current path (same origin) and parse it with **`DOMParser`**.
- Extract all anchors and:
  - **Skip** `../` (parent directory) entries.
  - Classify an entry as a **folder** if the `href` ends with `/`.
  - Classify an entry as an **image** if the extension matches **`png|jpg|jpeg|gif|webp|svg`** (case‑insensitive).  
    (Note: AVIF can be added later.)
- Render **folders first**, then images, in a simple grid. Image tiles open the original in a new tab.
- Keep the UI minimal: CSS Grid/Flexbox, emoji 📁 for folders, filename as a caption.

## Constraints & non‑goals
- **CORS‑free** by design: the viewer fetches only **same‑origin** paths.
- **No thumbnails** and **no lazy loading** initially (small images, few files per folder assumed).
- **No page transitions**; everything happens within `view.html`.

## Iteration notes (key corrective prompts)
1. **Unify folders + images**: Merge the "gallery for images" with "clickable folders".
2. **Single script at root**: Ensure one `view.html` can browse any path; do not duplicate scripts across folders.
3. **Bug fix-absolute base URL**: Nothing rendered due to `new URL(href, path)` using a non‑absolute base. Prompted a fix to build URLs with an **absolute base** (`new URL(href, dirURL)` / `location.origin`) so image and folder links resolve correctly.
4. **History & deep‑linking**: Add `?p=` handling and `pushState` so links like `/view.html?p=/birds/` work and browser navigation is preserved.
5. **Quality‑of‑life**: Breadcrumbs, basic error/status messages, simple sorting (folders first, then names).

## Acceptance criteria captured in prompts
- Opening `https://example.org/view.html` shows the root as a grid with **folders** and any **images**.
- Opening `.../view.html?p=/some/subdir/` directly shows that folder.
- Clicking a **folder** updates the view **without page reload**; Back/Forward returns to previous folders.
- Clicking an **image** opens the original file in a new tab.

## Future‑work prompts (not implemented by default)
- Add **AVIF** to the image regex; consider **lazy loading** for very large folders.
- Support **dark mode** via `prefers-color-scheme`.
- Add **natural sort** with `localeCompare(..., { numeric: true, sensitivity: 'base' })`.
- Friendlier messages for **403/404**; minor **CSP** adjustments if inline scripts are disallowed.

---

## Example “regeneration” prompt (concise)
> *"Build a single‑file HTML/JS viewer (`view.html`) that fetches Nginx autoindex listings for the **same origin** and renders a **folder+image** grid. Requirements: zero backend, no thumbnails, no page reloads; folders are clickable and update the view using the History API (Back/Forward works). Start path comes from `?p=/...` (fallback to hash), default `/`. Parse anchors from autoindex HTML with `DOMParser`; skip `../`; treat `href` ending with `/` as folders; treat files with extensions `png|jpg|jpeg|gif|webp|svg` as images. Render folders first, then images; show a minimal breadcrumb; clicking an image opens the original in a new tab. Avoid CORS by keeping all fetches same‑origin. Use absolute bases when building URLs."*

---

**Authored by ChatGPT 5 (OpenAI).**

