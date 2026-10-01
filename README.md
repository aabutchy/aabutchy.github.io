# adambutchy.me

Personal website of Adam A. Butchy, hosted on GitHub Pages from this repository
(`aabutchy.github.io`) at [adambutchy.me](https://adambutchy.me).

Plain HTML and CSS, no build step. Push to `main` and GitHub Pages deploys it.

## Layout

```
index.html                     Home
about.html                     Bio, education, recognition and press
news.html                      HEARTio milestone timeline + publications and patents
projects.html                  Project index
projects/diagnostic-accuracy.html Confusion-matrix explainer (MathJax) + chest-pain triage Sankey simulator (d3-sankey)
projects/confusion-matrix.html Redirect stub for the old explainer URL
projects/macrophage-model.html Interactive Cytoscape.js network from the Ph.D. work
404.html                       GitHub Pages not-found page
css/style.css                  Single shared stylesheet (light + dark mode)
js/macrophage-model.js         Viewer logic for the macrophage model
js/triage-simulator.js         Model + rendering for the triage simulator
js/load-mathjax.js             MathJax 3 loader
data/macrophage-model/         model.json + per-scenario simulation trace PNGs
img/                           Headshot, figures, favicons, img/news/ timeline photos, img/triage/ icons
CNAME                          Custom domain for GitHub Pages
```

`sources/` and `ZZZ_to_add/` are git-ignored: original photos, PDFs, drafts, and
unpublished work-in-progress (including anything containing patient data).

## Working locally

Any static server works. The macrophage model fetches JSON, so open the site
over HTTP rather than `file://`:

```bash
python3 -m http.server 8000
```

Then visit <http://localhost:8000/>.

## Adding a milestone or publication

Edit `news.html` directly. Timeline entries are `<li>` items in the
`ol.timeline` list (newest first); publications are `<li>` items in the
`ul.pubs` lists. Put resized photos (about 1200 px on the long edge) in
`img/news/`.

## Credits

- Icons: hand-drawn inline SVG in the footer, based on the
  [Feather](https://feathericons.com/) style.
- Favicons generated with [RealFaviconGenerator](https://realfavicongenerator.net/).
- Sankey rendering: [D3](https://d3js.org/) and [d3-sankey](https://github.com/d3/d3-sankey).
- Network rendering: [Cytoscape.js](https://js.cytoscape.org/),
  [cytoscape-popper](https://github.com/cytoscape/cytoscape.js-popper), and
  [Tippy.js](https://atomiks.github.io/tippyjs/).
