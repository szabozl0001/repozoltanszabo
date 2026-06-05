# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A dependency-free, single-file AI news aggregator (`index.html`) that fetches RSS feeds from 6 tech publications and displays them in a dark-themed, filterable grid. No build step, no package manager, no framework.

## Running the App

Open `index.html` directly in a browser, or serve it with any static file server:

```bash
python -m http.server 8080
# then open http://localhost:8080
```

There are no build, test, or lint commands — the project has no tooling configuration.

## Architecture

Everything lives in `index.html` in three inline sections:

- **CSS** (lines ~7–245): Custom properties for the dark theme (`--bg`, `--surface`, `--accent` `#6c63ff`, etc.), CSS Grid card layout (`auto-fill, minmax(340px, 1fr)`), shimmer skeleton animation, and a 600px mobile breakpoint.
- **HTML** (lines ~250–272): Header, category filter buttons (All / Research / Industry / Policy / Tools), search input, and the `#grid` container.
- **JavaScript** (lines ~274–485): Pure vanilla JS, no imports.

### Key JS concepts

| Symbol | Role |
|---|---|
| `SOURCES` array | Hardcoded list of 6 RSS feeds, each with `name`, `url`, `category`, and `keywords` |
| `fetchSource(src)` | Fetches a feed through the `allorigins.win` CORS proxy with a 12-second timeout |
| `parseRSS(xml)` | Uses `DOMParser` to turn XML into article objects `{ title, link, pubDate, desc, source, category }` |
| `isAiRelated(article)` | Keyword filter — drops articles that aren't AI-relevant |
| `renderCards()` | Applies active category + search filter, deduplicates by normalized title, renders up to 15 cards per source |
| `renderSkeletons()` | Shows placeholder cards during fetch |
| `escHtml(str)` | All user-visible strings must pass through this before being set as `innerHTML` |

`Promise.allSettled` is used so that a failing feed never blocks the others.

### Adding or modifying RSS sources

Edit the `SOURCES` array. Each entry requires:
```js
{ name: "Display Name", url: "https://…/feed", category: "Research|Industry|Policy|Tools", keywords: ["kw1", …] }
```
The `keywords` array is used by `isAiRelated()` to decide whether an article is shown.

## Conventions

- **Security**: Any string inserted into the DOM via `innerHTML` must be escaped with `escHtml()`. External links always get `rel="noopener noreferrer"`.
- **CSS naming**: kebab-case class names (`.filter-btn`, `.card-meta`). Theme values go in CSS custom properties on `:root`, not inline.
- **JS naming**: camelCase functions and variables. Pure utility functions (`stripHtml`, `formatDate`, `escHtml`) have no side effects.
- **Branch model**: feature work goes on `claude/*` branches; `main` is stable.
