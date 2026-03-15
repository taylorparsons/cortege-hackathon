---
name: daisy
description: Create or modify any UI/UX using Tailwind CSS and DaisyUI components and themes. Use when the request mentions Tailwind, DaisyUI, "create the UX", building UI screens/components, applying DaisyUI themes, or converting existing UI to Tailwind + DaisyUI in any web project (HTML, React, Next.js, etc.).
---

# DaisyUI + Tailwind UI Builder

## Workflow
1. Identify the target UI and framework; inspect the repo for Tailwind/DaisyUI config (`tailwind.config.*`, `daisyui` plugin), existing component patterns, and folder layout for templates, JS, and CSS.
2. Use the same folder names as the feature/ui-fixes-code-quality layout: `app/templates/` for HTML, `app/static/js/` for JS, and `app/static/css/` for CSS.
3. Use DaisyUI components for UI elements and Tailwind utilities for layout, spacing, typography, and responsiveness.
4. Respect theme configuration. If `daisyui.themes` is set, only use those themes; set `data-theme` on the root element when needed. Do not use the `monochrome` theme.
5. When asked for all themes or to browse themes, run `python3 scripts/list_daisyui_themes.py --root <repo>` to list built-in themes from the installed DaisyUI package. If DaisyUI is not installed, consult the official DaisyUI docs and note the version used.
6. Provide accessible markup (labels, ARIA when needed) and verify responsive behavior.

## Theme Handling
- Prefer the repo default theme and avoid inventing theme names. Exclude `monochrome` even if it is available.
- For a new custom theme, update `daisyui.themes` in `tailwind.config.*` and ensure contrast for `*-content` tokens.

## Output Expectations
- Provide concrete file edits or complete snippets, not just ideas.
- Avoid custom CSS unless necessary; keep it minimal and scoped.
- Follow repo conventions for structure, naming, and formatting.
- Preserve separate folders for templates, JS, and CSS using `app/templates/`, `app/static/js/`, and `app/static/css/`.

## Resources
- `scripts/list_daisyui_themes.py`: list built-in DaisyUI themes from the local installation.
- `references/theme-usage.md`: theme selection and customization notes.
