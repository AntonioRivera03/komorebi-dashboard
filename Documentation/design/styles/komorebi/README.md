# Komorebi styles

Two complete, commented stylesheets extracted from the approved dashboard concepts:

- `komorebi-light.css` — warm paper, olive, and soft green surfaces.
- `komorebi-dark.css` — warm charcoal, moss, and soft ivory.

Each includes the base dashboard components, Komorebi typography and layout,
interactive states, responsive rules, and reduced-motion support. They have no
external font or asset dependencies. Comments explain the major sections;
`.komorebi` defines the palette variables and the native control color scheme.

## Use

From a page in the project root, load **one** stylesheet:

```html
<link id="komorebi-theme" rel="stylesheet" href="styles/komorebi/komorebi-light.css">
```

For dark mode, change the filename to `komorebi-dark.css`. Both use:

```html
<body class="komorebi">
```

Use the element structure and class names from `concepts/02-komorebi.html` or
`concepts/11-komorebi-dark.html`. When adopting the external stylesheet, remove
that page's existing inline `<style>` block so it does not override the theme.
A page inside `concepts/` needs `../styles/komorebi/` as the link path.

To switch an existing page between themes:

```js
function setKomorebiTheme(dark) {
  document.querySelector('#komorebi-theme').href =
    `styles/komorebi/komorebi-${dark ? 'dark' : 'light'}.css`;
}
```

The CSS styles controls and their states; retain the concept's JavaScript for
light switches, scenes, the thermostat, timer, flashcard, and task counters.
These are full-page stylesheets with global element rules, rather than scoped
components intended to be dropped into an unrelated app without adaptation.

The original standalone concepts remain available for comparison.
