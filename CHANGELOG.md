# Changelog

## 1.1.0-beta.13

- Fixed the configuration page failing with `Namespace "potts-modern" not found` when another theme is active.
- Ensured the Potts Modern settings view is registered before the administration page is rendered.

## 1.1.0-beta.12

- Fixed Historical Facts headings exposing the internal age marker.
- Made historical event title and age formatting independent of module script order.
- Kept one event heading and one age line in each historical fact card.

## 1.1.0-beta.11

- Added clear vertical space beneath the header search control.
- Aligned the Historical Facts region control with the other header menu items.
- Removed exact duplicate fact headings left behind when custom historical events are restyled.

## 1.1.0-beta.10

- Added dedicated compact chart silhouettes for male, female and unknown placeholders.
- Kept the decorative framed portrait placeholders on the main individual page.
- Replaced chart and tree silhouette placeholders with smaller transparent SVG artwork designed for ancestor and compact tree boxes.

## 1.1.0-beta.9

- Fixed the custom silhouette replacement affecting ancestor and tree/chart person boxes.
- Restricted portrait replacement to the main individual-page placeholder so compact tree and ancestor charts keep their layout.
- Removed the broad CSS silhouette content override that could enlarge chart nodes.

## 1.1.0-beta.8

- Added case-insensitive CSS selectors for webtrees silhouette classes.
- Made JavaScript replacement scan all silhouette class variants rather than exact lowercase `i.icon-silhouette-m/f` elements.
- Added delayed retry passes for silhouette replacement after AJAX or late DOM rendering.


## 1.1.0-beta.7

- Replaced webtrees silhouette `<i>` elements directly with the new portrait `<img>` elements at runtime.
- This avoids browser differences in overriding CSS `content: url(...)` on replaced elements.
- Kept the CSS fallback for chart and legacy views.

- Corrected the silhouette CSS selectors to match the actual webtrees classes (`icon-silhouette-m` and `icon-silhouette-f`).
- The previous selectors incorrectly required each element to also have a generic `icon-silhouette` class, so the replacement artwork was never applied.

# Changelog

## 1.1.0-beta.8

- Added case-insensitive CSS selectors for webtrees silhouette classes.
- Made JavaScript replacement scan all silhouette class variants rather than exact lowercase `i.icon-silhouette-m/f` elements.
- Added delayed retry passes for silhouette replacement after AJAX or late DOM rendering.


## 1.1.0-beta.5 - 2026-06-19

- Replaced the actual webtrees CSS silhouette icons (`icon-silhouette-m` and `icon-silhouette-f`) with the Potts Modern portrait artwork.
- Removed reliance on finding `<img>` elements, because webtrees renders missing portraits as CSS content on `<i>` elements.

## 1.1.0-beta.4 - 2026-06-19

- Fixed a fatal startup error caused by generating module asset URLs during `boot()` before the PSR-7 request was available.
- Embedded the male and female placeholder portraits as data URLs in the theme configuration.
- Corrected the JavaScript configuration so the placeholder image map is actually exposed to the browser.


## 1.1.0-beta.3 - 2026-06-18

- Added original Potts Modern male and female placeholder portraits.
- Replaced webtrees default individual silhouettes while preserving real media photographs.
- Added the GitHub Issues support address.

All notable changes to Potts Modern are documented here.

## [1.1.0-beta.2] - 2026-06-18

### Added

- Modern styling for the interactive-tree canvas, controls and person cards.
- Interactive-tree styling now works inside individual-page tabs as well as on dedicated chart pages.

### Changed

- Updated interactive-tree male and female panels to use softer theme-compatible colours.

## [1.1.0-beta.1] - 2026-06-18

### Added

- Public beta packaging and installation documentation.
- GPL-3.0-or-later licence file.
- Documentation for compatibility, optional integrations, rollback and issue reporting.

### Changed

- Generalised the module description for use on any webtrees site.
- Listed Jason Potts as the module author.
- Disabled automatic activation for safer public installation.
- Removed the site-specific support URL pending creation of the GitHub repository.
- Retained all visual and functional improvements from private release 1.0.40.

### Removed

- Development backup file `resources/js/theme.js.bak`.
- Site-specific branding and private support link.

## [1.0.40] - 2026-06-18

- Aligned the optional history-region selector with other utility navigation items.
- Preserved the unboxed event-title styling introduced in 1.0.39.

## [1.0.39] - 2026-06-18

- Removed the event-title border, background and shadow at the JavaScript source.
- Kept the event icon and title directly on the fact card.

## Earlier development releases

Versions 0.9.x through 1.0.38 were private development releases used while refining responsive layouts, menus, event cards, icons, settings and modal compatibility.
