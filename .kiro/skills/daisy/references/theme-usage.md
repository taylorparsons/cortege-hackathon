# DaisyUI Theme Usage

## Select a theme
- Prefer the repo's configured theme(s) in `tailwind.config.*`.
- If no config exists, set `data-theme="<theme>"` on the root element and document the choice.

## Customize a theme
- Add a custom theme object inside `daisyui.themes` in `tailwind.config.*`.
- Define semantic tokens: `primary`, `secondary`, `accent`, `neutral`, `base-100`, `base-200`, `base-300`, `info`, `success`, `warning`, `error`, and their `*-content` pairs.
- Check contrast between base and content tokens.

## Discover themes
- Run `python3 scripts/list_daisyui_themes.py --root <repo>` to list built-in themes from the installed DaisyUI package.
- If DaisyUI is not installed, consult the official DaisyUI docs and note the DaisyUI version used.
