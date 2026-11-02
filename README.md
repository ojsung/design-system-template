# Design System Template

A small, dependency-free design system built from plain CSS custom properties, plus a single-page style guide that documents it. Fork or duplicate it, swap the colors and fonts, and you have a design system for a new brand.

## What's inside

| File | Purpose |
| --- | --- |
| `main.css` | Shared tokens (type, spacing, shape, motion, layering) and the default light and dark color tokens. |
| `main-alt.css` | An alternate palette. Overrides only the light and dark color tokens. Load it after `main.css`. |
| `components.css` | Base element styles and components built on the tokens (buttons, forms, cards, badges, carousel, image and text link lists, dividers, grid). |
| `index.html` | The style guide. Shows every token and component, with light/dark/system and main/alt switches. |
| `src/main.js` | Wires up the style guide's mode, palette and desktop/mobile view buttons. Not needed by sites that use the CSS. |
| `src/item-links.js` | Demo for the "Image link lists" section (layouts and ways to open an item). Sites that use the pattern write their own. |
| `src/entry-groups.js` | Show more / show fewer buttons for the "Text link lists" section. Small enough to copy into a site. |

## Preview the style guide

It's static, so any file server works:

```sh
npx serve .
```

Or open `index.html` directly in a browser.

## Use it in a site

```html
<link rel="stylesheet" href="main.css">
<link rel="stylesheet" href="components.css">
<!-- optional second palette -->
<link rel="stylesheet" href="main-alt.css" id="alt-theme" disabled>
```

Set `data-theme="light"` or `data-theme="dark"` on `<html>` to force a mode. Without it, the stylesheet follows the visitor's system setting. See `src/main.js` for a small example of saving the choice and toggling the alternate palette.

## Make it yours

1. **Colors.** Edit the `--color-*` tokens in the light and dark blocks of `main.css`. Keep both modes in sync, and check text contrast.
2. **Alternate palette.** Edit `main-alt.css`, or duplicate it as `main-brand-b.css` for a third pitch. A palette file must declare every `--color-*` token that `main.css` does, and nothing else.
3. **Fonts.** Change `--font-family-title` and `--font-family-body` in `main.css`, and update the Google Fonts `<link>` in `index.html` to match.
4. **Scale.** Spacing, radius, control sizes and type sizes are tokens in the shared `:root` block. Adjust them once and every component follows.
5. **Names and copy.** Replace "Brand Name" and the lorem ipsum in `index.html`.

### Tokens at a glance

- Typography: `--font-family-*`, `--font-size-*`, `--font-weight-*`, `--line-height-*`
- Spacing: `--space-*`
- Shape and sizing: `--radius-*`, `--control-height-*`, `--container-width`
- Motion and layering: `--duration-*`, `--easing-standard`, `--z-*`
- Color: `--color-primary*`, `--color-secondary*`, `--color-accent`, backgrounds and surfaces, text, borders, status colors, and `--color-hero-bg` / `--color-hero-text` for banner art that stays dark in every mode

## License

[MIT](LICENSE)
