(function () {
  'use strict';

  if (window.__pottsModernThemeInitialised) {
    return;
  }

  window.__pottsModernThemeInitialised = true;

  const icons = window.PottsModernThemeIcons || {};
  const settings = window.PottsModernThemeSettings || {};
  const labels = {
    'family tree': 'family-tree',
    'charts': 'charts',
    'lists': 'lists',
    'calendar': 'calendar',
    'reports': 'reports',
    'clippings cart': 'cart',
    'search': 'search',
    'stories': 'stories',
    'more charts': 'more-charts',
    'books': 'books',
    'your book': 'your-book'
  };

  function normalise(value) {
    return String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();
  }

  function labelFor(anchor) {
    const text = normalise(anchor.innerText || anchor.textContent);

    for (const label of Object.keys(labels)) {
      if (text === label || text.startsWith(label + ' ')) {
        return label;
      }
    }

    const image = anchor.querySelector('img');
    const alt = image ? normalise(image.getAttribute('alt') || image.getAttribute('title')) : '';
    return Object.prototype.hasOwnProperty.call(labels, alt) ? alt : '';
  }

  const relationshipLabels = [
    'adoptive father', 'adoptive mother',
    'adopted son', 'adopted daughter',
    'younger brother', 'younger sister',
    'elder brother', 'elder sister',
    'half-brother', 'half-sister',
    'step-brother', 'step-sister',
    'stepfather', 'stepmother',
    'father', 'mother', 'parent', 'parents',
    'husband', 'wife', 'spouse', 'partner',
    'son', 'daughter', 'child',
    'brother', 'sister', 'sibling',
    'himself', 'herself', 'self'
  ];

  function cleanRelationshipLabel(value) {
    return normalise(value)
      .replace(/[▾▼⌄⌃✓✔]+/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function relationshipLabelFor(cell) {
    const values = [
      cleanRelationshipLabel(cell.innerText || ''),
      cleanRelationshipLabel(cell.textContent || ''),
      cleanRelationshipLabel((cell.innerText || '').split(/\r?\n/)[0] || '')
    ];

    for (const value of values) {
      for (const label of relationshipLabels) {
        if (value === label || value.startsWith(label + ' ')) {
          return label;
        }
      }
    }

    return '';
  }

  function isIndividualPage() {
    const path = window.location.pathname.toLowerCase();
    const query = new URLSearchParams(window.location.search);

    // Prefer the route itself. This works before AJAX-loaded sidebar content
    // such as the Family navigator has finished rendering.
    if (/\/individual(?:\/|$)/.test(path) || /individual\.php$/.test(path)) {
      return true;
    }

    // Older/non-pretty webtrees URLs use individual.php?pid=...
    if (query.has('pid') && path.includes('individual')) {
      return true;
    }

    const main = document.querySelector('main');

    if (!main) {
      return false;
    }

    const text = normalise(main.textContent || '');
    return text.includes('family navigator') && text.includes('facts and events');
  }

  function getFactsRoot() {
    const selectors = [
      'main .wt-tab-facts',
      'main #facts_content',
      'main [id*="facts_content"]',
      'main [id*="personal_facts"]',
      'main [data-tab="facts"]',
      'main .wt-facts-table'
    ];

    for (const selector of selectors) {
      const match = document.querySelector(selector);

      if (!match) {
        continue;
      }

      if (match.matches('.wt-facts-table')) {
        return match.closest('[id*="facts"], .tab-pane, .card, section, div') || match.parentElement || match;
      }

      return match;
    }

    return null;
  }

  function isInsideFactsRoot(element) {
    const root = getFactsRoot();
    return Boolean(root && element && (root === element || root.contains(element)));
  }

  function nearbyText(element, levels) {
    let node = element;
    let text = '';

    for (let i = 0; node && i < levels; i += 1) {
      text += ' ' + (node.textContent || '');
      node = node.parentElement;
    }

    return normalise(text);
  }

  function findVisualCell(element) {
    let node = element;

    for (let i = 0; node && i < 6; i += 1) {
      if (node.matches && node.matches('td, th')) {
        return node;
      }

      const parent = node.parentElement;

      if (!parent) {
        return null;
      }

      const siblings = Array.from(parent.children || []);
      const rowText = normalise(parent.textContent || '');
      const hasPersonReference = Boolean(
        parent.querySelector('a[href*="individual"], a[href*="individual.php"]') ||
        /\b\d{4}[–-]\d{0,4}\b/.test(rowText)
      );

      if (siblings.length >= 2 && siblings.length <= 5 && hasPersonReference) {
        return node;
      }

      node = parent;
    }

    return null;
  }

  function clearLegacyCellColours(cell, preserveTitleClass) {
    cell.style.setProperty('background-image', 'none', 'important');

    cell.querySelectorAll('*').forEach(function (child) {
      if (preserveTitleClass && child.classList.contains(preserveTitleClass)) {
        return;
      }

      child.style.setProperty('background-color', 'transparent', 'important');
      child.style.setProperty('background-image', 'none', 'important');
    });
  }

  function enhanceFamilyNavigator() {
    if (!isIndividualPage()) {
      return;
    }

    document.querySelectorAll('main td, main th, main div, main span, main button, main a').forEach(function (element) {
      const label = relationshipLabelFor(element);

      if (!label) {
        return;
      }

      const cleaned = cleanRelationshipLabel(element.innerText || element.textContent || '');

      // Only use the compact relationship label itself, not an entire row
      // beginning with words such as "father" or "mother".
      if (cleaned.length > label.length + 4) {
        return;
      }

      const cell = findVisualCell(element);

      if (!cell) {
        return;
      }

      const context = nearbyText(cell, 7);
      const parent = cell.parentElement;
      const hasPersonReference = Boolean(
        parent && (
          parent.querySelector('a[href*="individual"], a[href*="individual.php"]') ||
          /\b\d{4}[–-]\d{0,4}\b/.test(parent.textContent || '')
        )
      );

      if (!context.includes('family navigator') && !context.includes('family with') && !hasPersonReference) {
        return;
      }

      cell.classList.add('potts-family-role-cell');

      const isSelf = label === 'himself' || label === 'herself' || label === 'self';

      if (isSelf) {
        cell.classList.add('potts-family-self-cell');
      }

      cell.style.setProperty('background-color', isSelf ? '#efe3cb' : '#e3eadf', 'important');
      clearLegacyCellColours(cell, '');
    });
  }

  const factLabels = [
    'e-mail address', 'email address', 'military service', 'naturalisation',
    'physical description', 'social security number', 'national id number',
    'adoption', 'annulment', 'baptism', 'bar mitzvah', 'bat mitzvah',
    'birth', 'blessing', 'burial', 'caste', 'census', 'christening',
    'confirmation', 'cremation', 'death', 'divorce', 'education',
    'emigration', 'engagement', 'fax', 'immigration', 'marriage',
    'occupation', 'ordination', 'phone', 'probate', 'property', 'religion',
    'residence', 'retirement', 'telephone', 'title', 'website', 'will',
    'religious marriage', 'family photo', 'photo', 'sporting', 'sports', 'sport',
    'letter', 'address'
  ];

  const factIconKeys = {
    'adoption': 'fact-adoption',
    'annulment': 'fact-divorce',
    'baptism': 'fact-baptism',
    'bar mitzvah': 'fact-faith',
    'bat mitzvah': 'fact-faith',
    'birth': 'fact-birth',
    'blessing': 'fact-faith',
    'burial': 'fact-burial',
    'caste': 'fact-generic',
    'census': 'fact-census',
    'christening': 'fact-baptism',
    'confirmation': 'fact-faith',
    'cremation': 'fact-burial',
    'death': 'fact-death',
    'divorce': 'fact-divorce',
    'education': 'fact-education',
    'emigration': 'fact-immigration',
    'engagement': 'fact-marriage',
    'immigration': 'fact-immigration',
    'marriage': 'fact-marriage',
    'religious marriage': 'fact-marriage',
    'military service': 'fact-military',
    'naturalisation': 'fact-citizenship',
    'occupation': 'fact-occupation',
    'ordination': 'fact-faith',
    'probate': 'fact-will',
    'property': 'fact-property',
    'religion': 'fact-faith',
    'residence': 'fact-residence',
    'retirement': 'fact-retirement',
    'will': 'fact-will',
    'address': 'fact-address',
    'e-mail address': 'fact-email',
    'email address': 'fact-email',
    'phone': 'fact-phone',
    'telephone': 'fact-phone',
    'fax': 'fact-phone',
    'website': 'fact-generic',
    'title': 'fact-generic',
    'physical description': 'fact-generic',
    'social security number': 'fact-generic',
    'national id number': 'fact-citizenship',
    'family photo': 'fact-photo',
    'photo': 'fact-photo',
    'sporting': 'fact-sport',
    'sports': 'fact-sport',
    'sport': 'fact-sport',
    'letter': 'fact-letter'
  };

  function ensureFactTitleElement(cell, label) {
    const existing = cell.querySelector(':scope > .potts-event-title-panel, .potts-fact-title');

    if (existing) {
      return existing;
    }

    // webtrees may render an event name as a bare text node rather than an
    // element.  Create a real title panel so its background and border can be
    // styled reliably and independently from the rest of the summary cell.
    const candidates = Array.from(cell.querySelectorAll('div, span, strong, b'));
    const exactElement = candidates.find(function (candidate) {
      if (candidate.closest('a, button, .potts-fact-actions')) {
        return false;
      }

      const value = cleanRelationshipLabel(candidate.innerText || candidate.textContent || '');
      return value === label && candidate.children.length === 0;
    });

    if (exactElement) {
      exactElement.classList.add('potts-fact-title');
      return exactElement;
    }

    const walker = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        const parent = node.parentElement;
        const value = cleanRelationshipLabel(node.nodeValue || '');

        if (!parent || value !== label) {
          return NodeFilter.FILTER_REJECT;
        }

        if (parent.closest('a, button, input, select, textarea, .potts-fact-actions, .wt-fact-age, [class*="fact-age"]')) {
          return NodeFilter.FILTER_REJECT;
        }

        return NodeFilter.FILTER_ACCEPT;
      }
    });

    const textNode = walker.nextNode();

    if (textNode && textNode.parentNode) {
      const title = document.createElement('span');
      title.className = 'potts-fact-title';
      title.textContent = label;
      textNode.parentNode.replaceChild(title, textNode);
      return title;
    }

    // Last-resort fallback.  This guarantees every top-level fact has a
    // dedicated visual heading even when a third-party module supplies
    // unconventional markup.
    const title = document.createElement('span');
    title.className = 'potts-fact-title';
    title.textContent = label;
    cell.insertBefore(title, cell.firstChild);
    return title;
  }

  function compactFactHeading(cell) {
    const selectors = [
      '.wt-fact-label', '.descriptionbox', '.potts-fact-title',
      'strong', 'b', 'th > div:first-child', 'td > div:first-child'
    ];

    for (const selector of selectors) {
      const candidate = cell.querySelector(selector);

      if (!candidate) {
        continue;
      }

      const values = String(candidate.innerText || candidate.textContent || '')
        .split(/\r?\n/)
        .map(cleanRelationshipLabel)
        .filter(Boolean);

      for (const rawValue of values) {
        const value = rawValue.replace(/\s+age\s*:\s*.*$/i, '').trim();

        if (value && value !== 'fact or event' && value.length <= 60 && !value.startsWith('age:')) {
          return value;
        }
      }
    }

    const firstLine = String(cell.innerText || cell.textContent || '')
      .split(/\r?\n/)
      .map(cleanRelationshipLabel)
      .find(function (value) {
        return value && value !== 'fact or event' && !value.startsWith('age:') && value.length <= 60;
      });

    return firstLine || '';
  }

  function factLabelFor(element) {
    const raw = String(element.innerText || element.textContent || '');
    const lines = raw.split(/\r?\n/).map(cleanRelationshipLabel).filter(Boolean);
    const values = [cleanRelationshipLabel(raw)].concat(lines.slice(0, 2));

    for (const value of values) {
      for (const label of factLabels) {
        if (value === label || value.startsWith(label + ' ')) {
          return label;
        }
      }
    }

    return '';
  }

  function hideLegacyFactSymbols(cell) {
    cell.querySelectorAll('img, svg, i, [class*="icon"], [class*="fa-"], [style*="background-image"]').forEach(function (candidate) {
      if (candidate.classList.contains('potts-modern-fact-icon')) {
        return;
      }

      if (candidate.closest('a, button, input, select, textarea, .potts-fact-title')) {
        return;
      }

      const text = normalise(candidate.textContent || '');
      const rect = candidate.getBoundingClientRect();
      const compactGraphic = rect.width <= 84 && rect.height <= 84 && text.length <= 4;

      if (candidate.matches('img, svg, i') || compactGraphic) {
        candidate.classList.add('potts-legacy-fact-symbol');
        candidate.setAttribute('aria-hidden', 'true');
      }
    });

    const walker = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    let node = walker.nextNode();

    while (node) {
      textNodes.push(node);
      node = walker.nextNode();
    }

    textNodes.forEach(function (textNode) {
      const parent = textNode.parentElement;
      const value = String(textNode.nodeValue || '').trim();

      if (!parent || parent.closest('a, button, .potts-fact-title, .potts-modern-fact-icon')) {
        return;
      }

      if (value.length <= 4 && /[\u2600-\u27BF\u{1F300}-\u{1FAFF}]/u.test(value)) {
        textNode.nodeValue = '';
      }
    });
  }

  function normaliseEventTitlePanel(panel) {
    if (!panel || !panel.classList || !panel.classList.contains('potts-event-title-panel')) {
      return;
    }

    // The title panel must contain exactly one modern icon and one text span.
    // Earlier enhancement passes could leave a second icon behind, which is
    // why two symbols appeared beside Birth, Residence and Baptism.
    const iconsInPanel = Array.from(panel.querySelectorAll('.potts-modern-fact-icon'));
    const primaryIcon = iconsInPanel.shift() || null;
    iconsInPanel.forEach(function (duplicate) {
      duplicate.remove();
    });

    // Remove every other icon source from inside the title panel.  Some
    // webtrees fact labels retain an original SVG/icon wrapper as well as the
    // Potts Modern icon, which produced two matching symbols for Birth,
    // Residence, Occupation, Letter and similar events.
    panel.querySelectorAll('img, svg, i, [role="img"], [class*="wt-icon"], [class*="fa-"], [class*="icon-"]').forEach(function (candidate) {
      if (candidate === primaryIcon || candidate.closest('.potts-modern-fact-icon') === primaryIcon) {
        return;
      }
      candidate.remove();
    });

    const label = panel.querySelector(':scope > .potts-event-title-text');
    Array.from(panel.children).forEach(function (child) {
      if (child === label || child.classList.contains('potts-modern-fact-icon')) {
        return;
      }

      // Remove copied legacy icon wrappers and any stale title fragments.
      child.remove();
    });
  }

  function addModernFactIcon(cell, titleElement, label) {
    const iconKey = factIconKeys[label] || 'fact-generic';
    cell.setAttribute('data-potts-fact-type', label.replace(/[^a-z0-9]+/g, '-'));

    hideLegacyFactSymbols(cell);

    if (settings.SHOW_EVENT_ICONS === '0') {
      return;
    }

    const host = titleElement || cell;
    let icon = host.querySelector('.potts-modern-fact-icon');

    if (!icon) {
      icon = document.createElement('span');
      icon.className = 'potts-modern-fact-icon';
      icon.setAttribute('aria-hidden', 'true');
      host.insertBefore(icon, host.firstChild);
    }

    icon.setAttribute('data-potts-icon', iconKey);
    icon.style.setProperty('--potts-fact-icon', 'var(--potts-icon-' + iconKey + ')');

    if (titleElement) {
      titleElement.classList.add('potts-fact-title-with-icon');
      normaliseEventTitlePanel(titleElement);
    }
  }


  function buildDefinitiveFactTitlePanel(cell, label, sourceElement) {
    let panel = null;

    try {
      panel = cell.querySelector(':scope > .potts-event-title-panel');
    } catch (error) {
      panel = Array.from(cell.children || []).find(function (child) {
        return child.classList && child.classList.contains('potts-event-title-panel');
      }) || null;
    }

    // Remove duplicate or nested title panels left by earlier releases.
    Array.from(cell.querySelectorAll('.potts-event-title-panel')).forEach(function (candidate) {
      if (candidate !== panel) {
        const text = candidate.querySelector('.potts-event-title-text');
        if (panel && text && !panel.querySelector('.potts-event-title-text')) {
          panel.appendChild(text);
        }
        candidate.remove();
      }
    });

    if (!panel) {
      panel = document.createElement('div');
      panel.className = 'potts-event-title-panel';
      cell.insertBefore(panel, cell.firstChild);
    }

    // Always rebuild the visible title text. Earlier versions could leave the
    // panel and icon in place while the copied label span was hidden or
    // removed during a second enhancement pass.
    const visibleLabel = label.replace(/(^|\s)\S/g, function (character) {
      return character.toUpperCase();
    });
    panel.setAttribute('data-potts-event-title', visibleLabel);

    let labelText = panel.querySelector(':scope > .potts-event-title-text');
    if (!labelText) {
      labelText = document.createElement('span');
      labelText.className = 'potts-event-title-text';
      panel.appendChild(labelText);
    }
    labelText.classList.remove('potts-original-fact-title', 'potts-legacy-fact-symbol');
    labelText.removeAttribute('aria-hidden');
    labelText.textContent = visibleLabel;
    labelText.style.setProperty('display', 'inline', 'important');
    labelText.style.setProperty('visibility', 'visible', 'important');
    labelText.style.setProperty('opacity', '1', 'important');
    labelText.style.setProperty('color', 'var(--potts-ink)', 'important');

    // Apply these few structural styles inline with !important.  The title
    // panel must remain defined even when webtrees or a cached stylesheet
    // applies more specific table-cell rules.
    const styles = {
      display: 'inline-flex',
      'align-items': 'center',
      'justify-content': 'center',
      gap: '.4rem',
      width: 'auto',
      'max-width': 'calc(100% - 1rem)',
      'min-height': '2.25rem',
      margin: '.55rem auto .8rem',
      padding: '.42rem .85rem',
      'box-sizing': 'border-box',
      background: 'transparent',
      'background-image': 'none',
      border: '0',
      'border-radius': '0',
      'box-shadow': 'none',
      color: 'var(--potts-ink)',
      'font-weight': '800',
      'line-height': '1.2',
      'text-align': 'center',
      position: 'relative',
      float: 'none'
    };

    Object.entries(styles).forEach(function (entry) {
      panel.style.setProperty(entry[0], entry[1], 'important');
    });

    if (sourceElement && sourceElement !== panel && !panel.contains(sourceElement)) {
      sourceElement.classList.add('potts-original-fact-title');
      sourceElement.setAttribute('aria-hidden', 'true');
      sourceElement.style.setProperty('display', 'none', 'important');
    }

    normaliseEventTitlePanel(panel);

    // Rebuild the panel as one clean flex row. Earlier releases could leave
    // an empty line box or stale node in the title panel, which made the icon
    // appear centred between the visible title and a blank second line.
    const cleanIcon = panel.querySelector(':scope > .potts-modern-fact-icon');
    const cleanLabel = panel.querySelector(':scope > .potts-event-title-text');
    if (cleanIcon && cleanLabel) {
      panel.replaceChildren(cleanIcon, cleanLabel);
    } else if (cleanLabel) {
      panel.replaceChildren(cleanLabel);
    }

    panel.style.setProperty('display', 'inline-flex', 'important');
    panel.style.setProperty('flex-direction', 'row', 'important');
    panel.style.setProperty('flex-wrap', 'nowrap', 'important');
    panel.style.setProperty('align-items', 'center', 'important');
    panel.style.setProperty('justify-content', 'center', 'important');
    panel.style.setProperty('height', 'auto', 'important');
    panel.style.setProperty('min-height', '0', 'important');
    panel.style.setProperty('max-height', 'none', 'important');
    panel.style.setProperty('line-height', '1', 'important');

    cleanLabel?.style.setProperty('display', 'inline-flex', 'important');
    cleanLabel?.style.setProperty('align-items', 'center', 'important');
    cleanLabel?.style.setProperty('height', 'auto', 'important');
    cleanLabel?.style.setProperty('min-height', '0', 'important');
    cleanLabel?.style.setProperty('line-height', '1.1', 'important');
    cleanLabel?.style.setProperty('white-space', 'normal', 'important');

    return panel;
  }

  function markFactRow(first, detailCells, titleElement, label) {
    const visualRow = first.parentElement;

    if (visualRow) {
      visualRow.classList.add('potts-top-level-fact-row');
    }

    first.classList.add('potts-fact-summary-cell');
    first.setAttribute('data-potts-fact-title', label.replace(/(^|\s)\S/g, function (character) {
      return character.toUpperCase();
    }));
    first.style.setProperty('background-color', '#f2eadb', 'important');
    clearLegacyCellColours(first, 'potts-fact-title');

    const definitiveTitle = buildDefinitiveFactTitlePanel(first, label, titleElement);
    definitiveTitle.classList.remove('potts-fact-title', 'potts-fact-title-with-icon');

    addModernFactIcon(first, definitiveTitle, label);

    detailCells.forEach(function (cell) {
      cell.classList.add('potts-fact-detail-cell');
      cell.style.setProperty('background-color', 'rgba(255,255,255,0.94)', 'important');
      cell.style.setProperty('background-image', 'none', 'important');
    });
  }

  function enhanceFactCells() {
    if (!isIndividualPage()) {
      return;
    }

    const factRoot = getFactsRoot();

    if (!factRoot) {
      return;
    }

    // First handle conventional table rows inside the Facts and events tab.
    factRoot.querySelectorAll('tr').forEach(function (row) {
      // Related-person and associate events can contain their own tables
      // inside the detail cell of a primary fact. They are supporting
      // information, not separate top-level facts, so leave them untouched.
      if (row.closest('.potts-fact-detail-cell, .potts-related-facts-table')) {
        return;
      }

      const cells = Array.from(row.children).filter(function (element) {
        return element.matches && element.matches('td, th');
      });

      if (cells.length < 2) {
        return;
      }

      const label = factLabelFor(cells[0]) || compactFactHeading(cells[0]);
      const rowText = normalise(row.innerText || row.textContent || '');

      if (!label || rowText.includes('associated events') || rowText.includes('historic events')) {
        return;
      }

      let titleElement = null;

      cells[0].querySelectorAll('div, span, strong, b').forEach(function (candidate) {
        if (!titleElement && factLabelFor(candidate) === label) {
          const text = cleanRelationshipLabel(candidate.innerText || candidate.textContent || '');
          if (text.length <= label.length + 4) {
            titleElement = candidate;
          }
        }
      });

      titleElement = titleElement || ensureFactTitleElement(cells[0], label);
      markFactRow(cells[0], cells.slice(1), titleElement, label);
    });

    // Xenea sometimes renders the same layout with nested divs rather than a
    // recognisable facts table. Find the compact event title and work outwards.
    factRoot.querySelectorAll('.descriptionbox, .wt-fact-label, div, span, strong').forEach(function (element) {
      if (element.closest('.potts-fact-detail-cell, .potts-related-facts-table')) {
        return;
      }

      // Conventional facts tables have already been handled above. Running
      // the broad DIV fallback inside the same table can mistake the filter
      // controls for a fact and place the first Birth heading above them.
      if (element.closest('table.wt-facts-table, table.facts_table')) {
        return;
      }

      const cell = findVisualCell(element);

      if (!cell || cell.classList.contains('potts-fact-summary-cell')) {
        return;
      }

      if (cell.hasAttribute('colspan') || cell.querySelector('input[type="checkbox"]')) {
        return;
      }

      const parent = cell.parentElement;
      const siblings = parent ? Array.from(parent.children || []) : [];
      const index = siblings.indexOf(cell);

      // A real fact summary is the first visual cell in a row/container and
      // has one or more detail cells beside it. This prevents dates,
      // associates and linked people inside the detail area from becoming
      // miniature fact cards.
      if (index !== 0) {
        return;
      }

      const detailCells = siblings.slice(1);

      if (detailCells.length === 0) {
        return;
      }

      const label = factLabelFor(element) || compactFactHeading(cell);

      if (!label || label === 'fact or event' || label.length > 60) {
        return;
      }

      const cleaned = cleanRelationshipLabel(element.innerText || element.textContent || '');

      if (cleaned.length > label.length + 4) {
        return;
      }

      const titleElement = ensureFactTitleElement(cell, label) || element;
      markFactRow(cell, detailCells, titleElement, label);
    });
  }


  /*
   * v0.9.5: keep related and associate events inside a fact detail area
   * compact. These nested tables are supporting information and must not be
   * enhanced as standalone fact cards.
   */
  function resetNestedFactEnhancements() {
    const main = getFactsRoot();

    if (!main) {
      return;
    }

    main.querySelectorAll('.potts-fact-detail-cell').forEach(function (detailCell) {
      detailCell.querySelectorAll('table').forEach(function (table) {
        table.classList.add('potts-related-facts-table');
      });

      detailCell.querySelectorAll('.potts-fact-summary-cell, .potts-fact-detail-cell').forEach(function (nestedCell) {
        nestedCell.classList.remove('potts-fact-summary-cell', 'potts-fact-detail-cell');
        nestedCell.removeAttribute('data-potts-fact-type');
        ['background-color', 'background-image', 'border', 'border-color', 'border-radius', 'box-shadow'].forEach(function (property) {
          nestedCell.style.removeProperty(property);
        });
      });

      detailCell.querySelectorAll('.potts-fact-title, .potts-fact-title-with-icon').forEach(function (title) {
        title.classList.remove('potts-fact-title', 'potts-fact-title-with-icon');
        ['background-color', 'background-image', 'border', 'border-radius', 'box-shadow'].forEach(function (property) {
          title.style.removeProperty(property);
        });
      });

      detailCell.querySelectorAll('.potts-modern-fact-icon').forEach(function (icon) {
        icon.remove();
      });

      detailCell.querySelectorAll('.potts-legacy-fact-symbol').forEach(function (symbol) {
        symbol.classList.remove('potts-legacy-fact-symbol');
        symbol.removeAttribute('aria-hidden');
        ['display', 'visibility', 'width', 'height', 'overflow'].forEach(function (property) {
          symbol.style.removeProperty(property);
        });
      });
    });
  }


  /*
   * v0.9.3: reliable fact icon rendering.
   *
   * Some Xenea fact rows are assembled from a mixture of table cells, nested
   * divs and legacy icon markup.  Earlier versions relied on a CSS custom
   * property for the mask image.  On Jason's site the event cells were found
   * and restyled, but the mask was not painted.  Apply the SVG data URI
   * directly to each icon and remove the old decorative symbol more firmly.
   */
  function factIconColour(label) {
    if ([
      'marriage', 'engagement', 'property', 'will', 'probate',
      'sporting', 'sports', 'sport'
    ].includes(label)) {
      return 'var(--potts-gold)';
    }

    if ([
      'death', 'burial', 'cremation', 'religion', 'ordination',
      'confirmation', 'blessing'
    ].includes(label)) {
      return 'var(--potts-green)';
    }

    if ([
      'occupation', 'residence', 'address', 'e-mail address',
      'email address', 'phone', 'telephone', 'military service',
      'photo', 'family photo'
    ].includes(label)) {
      return 'var(--potts-blue-dark)';
    }

    return 'var(--potts-blue)';
  }

  function hardHideLegacyFactSymbols(cell, titleElement) {
    const protectedSelector = 'a, button, input, select, textarea, .potts-modern-fact-icon';

    cell.querySelectorAll('.wt-fact-icon').forEach(function (symbol) {
      symbol.classList.add('potts-legacy-fact-symbol');
      symbol.setAttribute('aria-hidden', 'true');
      symbol.style.setProperty('display', 'none', 'important');
    });

    cell.querySelectorAll('img, svg, i, [class*="icon"], [class*="fa-"]').forEach(function (candidate) {
      if (candidate.classList.contains('potts-modern-fact-icon')) {
        return;
      }

      if (titleElement && titleElement.contains(candidate)) {
        return;
      }

      if (candidate.closest(protectedSelector)) {
        return;
      }

      const rect = candidate.getBoundingClientRect();
      const compact = (rect.width === 0 || rect.width <= 96) && (rect.height === 0 || rect.height <= 96);

      if (compact) {
        candidate.classList.add('potts-legacy-fact-symbol');
        candidate.setAttribute('aria-hidden', 'true');
        candidate.style.setProperty('display', 'none', 'important');
      }
    });

    const walker = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let node = walker.nextNode();

    while (node) {
      nodes.push(node);
      node = walker.nextNode();
    }

    nodes.forEach(function (textNode) {
      const parent = textNode.parentElement;
      const value = String(textNode.nodeValue || '').trim();

      if (!value || !parent || parent.closest(protectedSelector)) {
        return;
      }

      if (titleElement && titleElement.contains(parent)) {
        return;
      }

      // Remove standalone emoji/ornament glyphs while retaining ages, labels
      // and punctuation that form part of genuine fact information.
      if (value === '&' || value === '&amp;' || (value.length <= 8 && !/[A-Za-z0-9]/.test(value) && /[^\u0000-\u007F]/.test(value))) {
        textNode.nodeValue = '';
      }
    });
  }

  function isFactActionControl(element) {
    const control = element instanceof Element ? element.closest('a, button') : null;

    if (!control) {
      return false;
    }

    if (control.querySelector('.wt-icon-edit, .wt-icon-copy, .wt-icon-delete')) {
      return true;
    }

    const hint = normalise([
      control.getAttribute('href') || '',
      control.getAttribute('title') || '',
      control.getAttribute('aria-label') || '',
      control.textContent || ''
    ].join(' '));

    return /(?:^|\b)(?:edit|copy|delete|remove|unlink)(?:\b|$)/.test(hint);
  }

  /*
   * v0.9.7: Xenea sometimes wraps the old decorative event artwork in a
   * harmless link. Earlier cleanup treated every link as protected, which
   * allowed flowers, waves and other legacy symbols to remain. Protect only
   * genuine edit/copy/delete controls and remove every other compact artwork
   * item from the summary cell.
   */
  function stripRemainingLegacyFactArtwork(cell, titleElement) {
    const candidates = cell.querySelectorAll(
      'img, svg, i, [role="img"], [class*="icon"], [class*="fa-"], [style*="background-image"], a'
    );

    candidates.forEach(function (candidate) {
      if (candidate.classList && candidate.classList.contains('potts-modern-fact-icon')) {
        return;
      }

      if (titleElement && (candidate === titleElement || titleElement.contains(candidate))) {
        return;
      }

      if (isFactActionControl(candidate)) {
        return;
      }

      if (candidate.closest('input, select, textarea')) {
        return;
      }

      const text = String(candidate.textContent || '').trim();
      const rect = candidate.getBoundingClientRect();
      const compact = (rect.width === 0 || rect.width <= 110) && (rect.height === 0 || rect.height <= 110);
      const graphicElement = candidate.matches('img, svg, i, [role="img"], [style*="background-image"], [class*="icon"], [class*="fa-"]');
      const symbolOnlyLink = candidate.matches('a') && compact && text.length <= 6 && !/[A-Za-z0-9]/.test(text);
      const imageOnlyLink = candidate.matches('a') && compact && candidate.querySelector('img, svg, i, [role="img"], [class*="icon"]') && text.length <= 6;

      if (compact && (graphicElement || symbolOnlyLink || imageOnlyLink)) {
        candidate.classList.add('potts-legacy-fact-symbol');
        candidate.setAttribute('aria-hidden', 'true');
        candidate.style.setProperty('display', 'none', 'important');
        candidate.style.setProperty('visibility', 'hidden', 'important');
      }
    });

    const walker = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    let node = walker.nextNode();

    while (node) {
      textNodes.push(node);
      node = walker.nextNode();
    }

    textNodes.forEach(function (textNode) {
      const parent = textNode.parentElement;
      const value = String(textNode.nodeValue || '').trim();

      if (!value || !parent || (titleElement && titleElement.contains(parent)) || isFactActionControl(parent)) {
        return;
      }

      if (value === '&' || value === '&amp;' || (value.length <= 8 && !/[A-Za-z0-9]/.test(value) && /[^\u0000-\u007F]/.test(value))) {
        textNode.nodeValue = '';
      }
    });
  }

  function reliableFactTitle(cell, label) {
    const existing = cell.querySelector(':scope > .potts-event-title-panel, .potts-fact-title');

    if (existing) {
      return existing;
    }

    const candidates = Array.from(cell.querySelectorAll('div, span, strong, b, th, td'));

    const candidate = candidates.find(function (candidate) {
      const text = cleanRelationshipLabel(candidate.innerText || candidate.textContent || '');
      return text === label && text.length <= label.length + 2;
    }) || null;

    if (candidate) {
      candidate.classList.add('potts-fact-title');
      return candidate;
    }

    return ensureFactTitleElement(cell, label);
  }

  function renderReliableFactIcons() {
    const main = getFactsRoot();

    if (!main) {
      return;
    }

    main.querySelectorAll('.potts-fact-summary-cell').forEach(function (cell) {
      let label = factLabelFor(cell) || compactFactHeading(cell);
      const type = String(cell.getAttribute('data-potts-fact-type') || '').replace(/-/g, ' ');

      if (!label && type) {
        label = type;
      }

      if (!label) {
        return;
      }

      const titleElement = reliableFactTitle(cell, label);

      if (titleElement && titleElement.classList.contains('potts-event-title-panel')) {
        const visibleLabel = label.replace(/(^|\s)\S/g, function (character) {
          return character.toUpperCase();
        });
        let labelText = titleElement.querySelector(':scope > .potts-event-title-text');
        if (!labelText) {
          labelText = document.createElement('span');
          labelText.className = 'potts-event-title-text';
          titleElement.appendChild(labelText);
        }
        labelText.classList.remove('potts-original-fact-title', 'potts-legacy-fact-symbol');
        labelText.removeAttribute('aria-hidden');
        labelText.textContent = visibleLabel;
        labelText.style.setProperty('display', 'inline', 'important');
        labelText.style.setProperty('visibility', 'visible', 'important');
        labelText.style.setProperty('opacity', '1', 'important');
        labelText.style.setProperty('color', 'var(--potts-ink)', 'important');
      }

      hardHideLegacyFactSymbols(cell, titleElement);
      stripRemainingLegacyFactArtwork(cell, titleElement);

      if (settings.SHOW_EVENT_ICONS === '0' || !titleElement) {
        return;
      }

      const iconKey = factIconKeys[label] || 'fact-generic';
      const iconUri = icons[iconKey] || icons['fact-generic'] || '';
      const existingIcons = Array.from(titleElement.querySelectorAll(':scope > .potts-modern-fact-icon'));
      let icon = existingIcons.shift() || null;
      existingIcons.forEach(function (duplicate) { duplicate.remove(); });

      if (!icon) {
        icon = document.createElement('span');
        icon.className = 'potts-modern-fact-icon';
        icon.setAttribute('aria-hidden', 'true');
        titleElement.insertBefore(icon, titleElement.firstChild);
      }

      cell.setAttribute('data-potts-fact-type', label.replace(/[^a-z0-9]+/g, '-'));
      if (titleElement.classList.contains('potts-event-title-panel')) {
        titleElement.classList.remove('potts-fact-title', 'potts-fact-title-with-icon');
      } else {
        titleElement.classList.add('potts-fact-title', 'potts-fact-title-with-icon');
      }

      icon.setAttribute('data-potts-icon', iconKey);
      icon.style.setProperty('display', 'inline-block', 'important');
      icon.style.setProperty('visibility', 'visible', 'important');
      icon.style.setProperty('opacity', '1', 'important');
      icon.style.setProperty('background-color', factIconColour(label), 'important');
      icon.style.setProperty('background-image', 'none', 'important');

      if (iconUri) {
        const value = 'url("' + iconUri + '")';
        icon.style.setProperty('-webkit-mask-image', value, 'important');
        icon.style.setProperty('mask-image', value, 'important');
        icon.style.setProperty('-webkit-mask-repeat', 'no-repeat', 'important');
        icon.style.setProperty('mask-repeat', 'no-repeat', 'important');
        icon.style.setProperty('-webkit-mask-position', 'center', 'important');
        icon.style.setProperty('mask-position', 'center', 'important');
        icon.style.setProperty('-webkit-mask-size', 'contain', 'important');
        icon.style.setProperty('mask-size', 'contain', 'important');
      }

      normaliseEventTitlePanel(titleElement);
    });
  }

  function labelFromText(value) {
    const text = normalise(value);
    const knownLabels = Object.keys(labels).sort(function (a, b) {
      return b.length - a.length;
    });

    for (const label of knownLabels) {
      if (text === label || text.startsWith(label + ' ') || text.endsWith(' ' + label)) {
        return label;
      }
    }

    return '';
  }

  function menuCandidateForImage(image) {
    let node = image.parentElement;

    for (let i = 0; node && i < 7; i += 1) {
      const text = normalise(node.innerText || node.textContent || '');
      const label = labelFromText(text);
      const imageCount = node.querySelectorAll ? node.querySelectorAll('img').length : 0;
      const linkCount = node.querySelectorAll ? node.querySelectorAll('a[href]').length : 0;

      // Xenea often places the image and its text in separate links inside a
      // compact TD/DIV. Select the smallest such wrapper, not the whole menu.
      if (label && imageCount >= 1 && imageCount <= 2 && linkCount >= 1 && text.length <= label.length + 12) {
        return { item: node, label: label };
      }

      node = node.parentElement;
    }

    // Some installations keep the wording in the image alt/title attribute.
    const fallback = labelFromText(image.getAttribute('alt') || image.getAttribute('title') || '');
    if (fallback) {
      return { item: image.closest('li, td, .nav-item, .menu-item, div') || image.parentElement, label: fallback };
    }

    return null;
  }

  function lowestCommonAncestor(elements) {
    if (elements.length === 0) {
      return null;
    }

    let node = elements[0].parentElement;

    while (node && !elements.every(function (element) { return node.contains(element); })) {
      node = node.parentElement;
    }

    return node;
  }

  function comparableUrl(value) {
    try {
      const url = new URL(value, window.location.href);
      url.hash = '';
      return url.pathname.replace(/\/+$/, '') + url.search;
    } catch (error) {
      return '';
    }
  }

  function enhanceMenu() {
    const enhancedItems = [];
    const currentUrl = comparableUrl(window.location.href);

    document.querySelectorAll('img').forEach(function (image) {
      const candidate = menuCandidateForImage(image);

      if (!candidate) {
        return;
      }

      const item = candidate.item;
      const label = candidate.label;
      const iconKey = labels[label];
      const icon = icons[iconKey];

      if (!item || !icon || item.classList.contains('potts-modern-menu-item')) {
        return;
      }

      item.classList.add('potts-modern-menu-item');
      item.setAttribute('data-potts-menu-label', label);

      image.classList.add('potts-modern-menu-icon');
      image.setAttribute('src', icon);
      image.setAttribute('alt', '');
      image.setAttribute('aria-hidden', 'true');
      image.removeAttribute('width');
      image.removeAttribute('height');

      const links = Array.from(item.querySelectorAll('a[href]'));
      links.forEach(function (anchor) {
        anchor.classList.add('potts-modern-menu-link');
        anchor.setAttribute('data-potts-menu-label', label);

        const isCurrent = anchor.getAttribute('aria-current') === 'page' ||
          comparableUrl(anchor.href) === currentUrl;
        anchor.classList.toggle('potts-modern-menu-active', Boolean(isCurrent));
      });

      if (links.some(function (anchor) { return anchor.classList.contains('potts-modern-menu-active'); })) {
        item.classList.add('potts-modern-menu-active');
      }

      enhancedItems.push(item);
    });

    if (enhancedItems.length >= 4) {
      const menuRoot = lowestCommonAncestor(enhancedItems);

      if (menuRoot && menuRoot !== document.body && menuRoot !== document.documentElement) {
        menuRoot.classList.add('potts-modern-icon-menu');
      }
    }
  }



  function enhanceHistoryRegionMenuLink() {
    const headerSelectors = [
      'body > header',
      'header[role="banner"]',
      '.wt-header-wrapper',
      '.wt-header',
      '#header',
      '#top-header',
      '.navbar'
    ].join(', ');

    document.querySelectorAll(headerSelectors + ' a, ' + headerSelectors + ' button, ' + headerSelectors + ' .dropdown-toggle').forEach(function (element) {
      const text = normalise(element.textContent || '');

      if (/^History\s*:/i.test(text)) {
        element.classList.add('potts-modern-history-region-link');

        const parent = element.closest('li, .nav-item, .dropdown, .menu-item, td, div');
        if (parent && parent !== document.body) {
          parent.classList.add('potts-modern-history-region-item');
        }
      }
    });
  }

  /*
   * v0.9.6: protect the individual identity area from fact-card styling.
   * Earlier broad selectors could mistake the portrait/name row for a fact.
   */
  function cleanIncorrectFactEnhancements() {
    if (!isIndividualPage()) {
      return;
    }

    document.querySelectorAll('main .potts-fact-summary-cell, main .potts-fact-detail-cell').forEach(function (cell) {
      if (isInsideFactsRoot(cell)) {
        return;
      }

      cell.classList.remove('potts-fact-summary-cell', 'potts-fact-detail-cell');
      cell.removeAttribute('data-potts-fact-type');
      ['background-color', 'background-image', 'border', 'border-color', 'border-radius', 'box-shadow', 'width', 'min-width'].forEach(function (property) {
        cell.style.removeProperty(property);
      });

      cell.querySelectorAll('.potts-modern-fact-icon').forEach(function (icon) {
        icon.remove();
      });

      cell.querySelectorAll('.potts-fact-title, .potts-fact-title-with-icon').forEach(function (title) {
        title.classList.remove('potts-fact-title', 'potts-fact-title-with-icon');
        ['background-color', 'background-image', 'border', 'border-radius', 'box-shadow'].forEach(function (property) {
          title.style.removeProperty(property);
        });
      });
    });

    document.querySelectorAll('main .potts-top-level-fact-row').forEach(function (row) {
      if (!isInsideFactsRoot(row)) {
        row.classList.remove('potts-top-level-fact-row');
      }
    });
  }

  function enhanceIndividualIdentityCard() {
    if (!isIndividualPage()) {
      return;
    }

    const main = document.querySelector('main');
    const names = main ? main.querySelector('#individual-names') : null;

    if (!names) {
      return;
    }

    const identity = names.closest('.row.mb-4') || names.closest('.row');

    if (!identity) {
      return;
    }

    identity.classList.add('potts-individual-identity');
    names.classList.add('potts-individual-names');

    Array.from(identity.children).forEach(function (child) {
      if (child === names) {
        return;
      }

      if (child.querySelector('.img-thumbnail, .carousel, .wt-individual-silhouette')) {
        child.classList.add('potts-individual-media');
      }
    });
  }


  function elementHasSeveralTabLabels(element) {
    if (!element || !element.querySelectorAll) {
      return false;
    }

    const expected = [
      'facts and events', 'families', 'stories', 'sources', 'notes',
      'album', 'interactive tree', 'places', 'family books'
    ];
    const text = normalise(element.textContent || '');
    let count = 0;

    expected.forEach(function (label) {
      if (text.includes(label)) {
        count += 1;
      }
    });

    return count >= 4;
  }

  function findIndividualTabs(main) {
    const candidates = Array.from(main.querySelectorAll('a, button')).filter(function (element) {
      return normalise(element.textContent || '').startsWith('facts and events');
    });

    for (const candidate of candidates) {
      let node = candidate.parentElement;

      for (let i = 0; node && node !== main && i < 7; i += 1) {
        if (elementHasSeveralTabLabels(node)) {
          const rect = node.getBoundingClientRect();

          if (rect.width > 260 && rect.height < 220) {
            return node;
          }
        }

        node = node.parentElement;
      }
    }

    return null;
  }

  function findCheckboxFilter(main) {
    const checkbox = main.querySelector('input[type="checkbox"]');

    if (!checkbox) {
      return null;
    }

    let node = checkbox.parentElement;
    let fallback = null;

    for (let i = 0; node && node !== main && i < 8; i += 1) {
      const checkboxCount = node.querySelectorAll('input[type="checkbox"]').length;
      const text = normalise(node.textContent || '');

      if (checkboxCount >= 2 && text.length < 250) {
        fallback = node;
        const style = window.getComputedStyle(node);
        const backgroundVisible = style.backgroundColor !== 'rgba(0, 0, 0, 0)' &&
          style.backgroundColor !== 'transparent';

        if (backgroundVisible || parseFloat(style.paddingTop || '0') > 4) {
          return node;
        }
      }

      node = node.parentElement;
    }

    return fallback;
  }

  function findIndividualContentPanel(main, filter) {
    if (!filter) {
      return null;
    }

    const fact = main.querySelector('.wt-facts-table, table.facts_table, .potts-fact-summary-cell');
    let node = filter.parentElement;
    let fallback = null;

    for (let i = 0; node && node !== main && i < 10; i += 1) {
      if (!fact || node.contains(fact)) {
        fallback = node;
        const style = window.getComputedStyle(node);
        const hasBorder = [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth]
          .some(function (value) { return parseFloat(value || '0') > 0; });
        const rect = node.getBoundingClientRect();

        if (hasBorder && rect.width > 350) {
          return node;
        }
      }

      node = node.parentElement;
    }

    return fallback;
  }

  function enhanceIndividualLayout() {
    if (!isIndividualPage()) {
      return;
    }

    const main = document.querySelector('main');

    if (!main) {
      return;
    }

    const tabs = findIndividualTabs(main);
    const filter = findCheckboxFilter(main);
    const panel = findIndividualContentPanel(main, filter);

    if (tabs) {
      tabs.classList.add('potts-individual-tabs');
    }

    if (filter) {
      filter.classList.add('potts-events-filter');
    }

    if (panel) {
      panel.classList.add('potts-individual-tab-panel');
    }
  }

  function applyFamilyPopoverClass(menu) {
    if (!menu || !menu.classList) {
      return;
    }

    menu.classList.add('potts-family-popover');

    // Bootstrap 5 uses CSS custom properties for popovers. Set them directly
    // as well as using the stylesheet so the actual floating panel is opaque.
    menu.style.setProperty('--bs-popover-bg', '#fffdf8', 'important');
    menu.style.setProperty('--bs-popover-header-bg', '#e3eadf', 'important');
    menu.style.setProperty('--bs-popover-body-color', '#26343c', 'important');
    menu.style.setProperty('--bs-popover-border-color', 'rgba(61, 83, 64, 0.24)', 'important');
    menu.style.setProperty('--bs-popover-max-width', '340px', 'important');
    menu.style.setProperty('background-color', '#fffdf8', 'important');
    menu.style.setProperty('opacity', '1', 'important');
  }

  function popupCandidates() {
    return Array.from(document.querySelectorAll(
      '.popover.show, .popover[role="tooltip"], .dropdown-menu.show, ' +
      '[role="tooltip"], [role="menu"], [data-popper-placement]'
    ));
  }

  function markPopupForFamilyTrigger(trigger) {
    if (!trigger) {
      return;
    }

    const ids = [
      trigger.getAttribute('aria-describedby'),
      trigger.getAttribute('aria-controls')
    ].filter(Boolean);

    ids.forEach(function (id) {
      const popup = document.getElementById(id);
      if (popup) {
        applyFamilyPopoverClass(popup);
      }
    });

    const cell = trigger.closest('.wt-family-navigator-label, .potts-family-role-cell');
    const triggerRect = (cell || trigger).getBoundingClientRect();

    popupCandidates().forEach(function (popup) {
      if (popup.closest('.wt-family-navigator-label, .potts-family-role-cell')) {
        applyFamilyPopoverClass(popup);
        return;
      }

      const popupRect = popup.getBoundingClientRect();
      const nearby = popupRect.right >= triggerRect.left - 80 &&
        popupRect.left <= triggerRect.right + 140 &&
        popupRect.bottom >= triggerRect.top - 180 &&
        popupRect.top <= triggerRect.bottom + 300;
      const popupText = normalise(popup.textContent || '');
      const looksLikeFamilyPopup = popupText.includes('family') ||
        popupText.includes('parents') || popupText.includes('children') ||
        popupText.includes('siblings');

      if (nearby && looksLikeFamilyPopup) {
        applyFamilyPopoverClass(popup);
      }
    });
  }

  function enhanceFamilyPopovers() {
    popupCandidates().forEach(function (menu) {
      const text = normalise(menu.textContent || '');
      const linkedFromFamilyCell = Boolean(
        document.querySelector(
          '.wt-family-navigator-label[aria-describedby="' + menu.id + '"], ' +
          '.wt-family-navigator-label [aria-describedby="' + menu.id + '"], ' +
          '.potts-family-role-cell[aria-describedby="' + menu.id + '"], ' +
          '.potts-family-role-cell [aria-describedby="' + menu.id + '"]'
        )
      );
      const looksLikeFamilyMenu = linkedFromFamilyCell ||
        text.includes('family') || text.includes('parents') ||
        text.includes('children') || text.includes('siblings');

      if (looksLikeFamilyMenu) {
        applyFamilyPopoverClass(menu);
      }
    });
  }

  function enhanceRelationshipLinks() {
    if (!isIndividualPage()) {
      return;
    }

    const main = document.querySelector('main');

    if (!main) {
      return;
    }

    main.querySelectorAll('a[href*="relationship"]').forEach(function (link) {
      const text = normalise(link.textContent || '');

      if (!text || text.length > 60 || link.closest('.wt-family-navigator')) {
        return;
      }

      link.classList.add('potts-relationship-link', 'potts-relationship-term');

      const summary = link.closest('p') || link.parentElement;
      if (summary) {
        summary.classList.add('potts-relationship-summary');

        summary.querySelectorAll('a').forEach(function (summaryLink) {
          if (summaryLink !== link) {
            summaryLink.classList.add('potts-common-ancestor-link');
          }
        });
      }
    });
  }


  function closestShellContainer(element) {
    if (!element) {
      return null;
    }

    return element.closest('nav, header, .navbar, .wt-header-wrapper, .wt-primary-navigation, .wt-secondary-navigation') || element;
  }

  function enhanceSiteShell() {
    const header = document.querySelector('.wt-header-wrapper, body > header, header[role="banner"], #header');

    if (header) {
      header.classList.add('potts-site-shell');

      const brand = header.querySelector('.wt-site-title, .wt-tree-title, .navbar-brand, h1, .title');
      if (brand) {
        brand.classList.add('potts-site-brand');
      }

      const searchInput = header.querySelector('input[type="search"], input[name="query"], input[name="q"]');
      if (searchInput) {
        const searchForm = searchInput.closest('form') || searchInput.parentElement;
        if (searchForm) {
          searchForm.classList.add('potts-header-search');
        }
      }
    }

    const userMenu = document.querySelector('.wt-user-menu');
    if (userMenu) {
      const container = closestShellContainer(userMenu);
      container.classList.add('potts-utility-nav');
      userMenu.classList.add('potts-utility-menu');
    }

    const genealogyMenu = document.querySelector('.wt-genealogy-menu');
    if (genealogyMenu) {
      const container = closestShellContainer(genealogyMenu);
      container.classList.add('potts-genealogy-nav');
      genealogyMenu.classList.add('potts-genealogy-menu');
    }
  }

  function findPhotoRibbon() {
    const explicit = document.querySelector(
      '.wt-photo-strip, .wt-random-media, .wt-media-strip, #random-media, #random_media, ' +
      '#random-media-block, #random_media_block, #media-strip, #photo-strip, ' +
      '.random-media, .random_media, .media-strip, .photo-strip'
    );

    if (explicit) {
      return explicit;
    }

    const mediaImages = Array.from(document.querySelectorAll(
      'img[src*="mediafirewall"], img[src*="media/"], a[href*="mediafirewall"] img, a[href*="mediaviewer"] img'
    ));

    if (mediaImages.length < 5) {
      return null;
    }

    for (const image of mediaImages) {
      let node = image.parentElement;

      for (let depth = 0; node && depth < 5; depth += 1) {
        const count = node.querySelectorAll(
          'img[src*="mediafirewall"], img[src*="media/"], a[href*="mediafirewall"] img, a[href*="mediaviewer"] img'
        ).length;

        if (count >= 5 && count <= 80) {
          return node;
        }

        node = node.parentElement;
      }
    }

    return null;
  }

  function blockHeading(block) {
    if (!block) {
      return '';
    }

    const heading = block.querySelector(
      '.wt-block-header, .wt-side-block-header, .card-header, .blockheader, .block-header, ' +
      '.panel-heading, .box-header, h1, h2, h3'
    );

    return normalise(heading ? heading.textContent : '');
  }

  function classifyHomeBlock(block) {
    const heading = blockHeading(block);

    if (!heading) {
      return;
    }

    const classes = [
      ['welcome', 'potts-home-welcome'],
      ['historical facts', 'potts-home-history'],
      ['slide show', 'potts-home-slideshow'],
      ['slideshow', 'potts-home-slideshow'],
      ['on this day', 'potts-home-on-this-day'],
      ['family history books', 'potts-home-books'],
      ['family books', 'potts-home-books']
    ];

    for (const pair of classes) {
      if (heading.includes(pair[0])) {
        block.classList.add(pair[1]);
        break;
      }
    }
  }

  function enhanceHomePage() {
    const blocks = Array.from(document.querySelectorAll(
      '.wt-block, .wt-side-block, main .block, main .card, main .panel, main .box'
    ));

    blocks.forEach(classifyHomeBlock);

    const hasHomeMarkers = blocks.some(function (block) {
      return block.classList.contains('potts-home-welcome') ||
        block.classList.contains('potts-home-history') ||
        block.classList.contains('potts-home-slideshow') ||
        block.classList.contains('potts-home-on-this-day');
    });

    if (!hasHomeMarkers) {
      return;
    }

    document.body.classList.add('potts-home-page');

    const main = document.querySelector('main, #content, #main, #main-content, #page');
    if (main) {
      main.classList.add('potts-home-content');
    }

    const ribbon = findPhotoRibbon();
    if (ribbon) {
      ribbon.classList.add('potts-photo-ribbon');
    }
  }


  function dashboardBlockHeading(block) {
    const heading = block.querySelector(
      '.wt-block-header, .wt-side-block-header, .card-header, .blockheader, .block-header, ' +
      '.panel-heading, .box-header, h1, h2, h3'
    );

    return normalise(heading ? heading.textContent : '');
  }

  function enhanceDashboardPage() {
    const main = document.querySelector('main, #content, #main, #main-content, #page');

    if (!main) {
      return;
    }

    const locationText = (window.location.pathname + ' ' + window.location.search).toLowerCase();
    const blocks = Array.from(main.querySelectorAll(
      '.wt-block, .wt-side-block, main .block, main .card, main .panel, main .box'
    ));
    const headings = blocks.map(dashboardBlockHeading).join(' | ');
    const dashboardByUrl = /(?:my-page|mypage|user-page|my_pages)/.test(locationText);
    const dashboardByBlocks = /(?:welcome |who is online|messages|daily email|my account|default chart)/.test(headings);

    if (!dashboardByUrl && !dashboardByBlocks) {
      document.body.classList.remove('potts-dashboard-page');
      main.classList.remove('potts-dashboard-content');
      return;
    }

    document.body.classList.add('potts-dashboard-page');
    main.classList.add('potts-dashboard-content');

    blocks.forEach(function (block) {
      block.classList.add('potts-dashboard-block');
      const heading = dashboardBlockHeading(block);

      if (/welcome /.test(heading)) {
        block.classList.add('potts-dashboard-account-links');
      }
    });
  }


  function enhanceRecordAndNarrativePages() {
    const main = document.querySelector('main, #content, #main, #main-content, #page');

    if (!main) {
      return;
    }

    const locationText = (window.location.pathname + ' ' + window.location.search).toLowerCase();
    const headingNode = main.querySelector('h1, h2.wt-page-title, .wt-page-title, .page-title');
    const headingText = normalise(headingNode ? headingNode.textContent : document.title);

    const familyPage = Boolean(main.querySelector('.wt-family-members')) ||
      /(?:family\.php|\/family\/|family-page)/.test(locationText);

    const mediaPage = /(?:media\.php|mediaviewer|media-page|\/media\/)/.test(locationText) &&
      !/medialist|media-list/.test(locationText);

    const notePage = /(?:note\.php|shared-note|note-page|\/note\/)/.test(locationText) &&
      !/notelist|note-list/.test(locationText);

    const sourcePage = /(?:source\.php|source-page|\/source\/)/.test(locationText) &&
      !/sourcelist|source-list/.test(locationText);

    const storyPage = Boolean(main.querySelector('.wt-tab-stories')) ||
      /(?:module[^#]*stories|\/stories\/|stories-list)/.test(locationText) ||
      /^stories\b/.test(headingText);

    const recordPage = mediaPage || notePage || sourcePage || Boolean(
      main.querySelector('.wt-page-content > .nav-tabs + .tab-content') &&
      /(?:repository|location|submitter|shared note|media object|source)/.test(headingText)
    );

    document.body.classList.toggle('potts-family-page', familyPage);
    document.body.classList.toggle('potts-media-page', mediaPage);
    document.body.classList.toggle('potts-note-page', notePage);
    document.body.classList.toggle('potts-source-page', sourcePage);
    document.body.classList.toggle('potts-story-page', storyPage);
    document.body.classList.toggle('potts-record-page', recordPage);

    main.classList.toggle('potts-family-content', familyPage);
    main.classList.toggle('potts-record-content', recordPage);

    if (recordPage) {
      const tabs = main.querySelector('.wt-page-content > .nav-tabs');
      const tabContent = main.querySelector('.wt-page-content > .tab-content');

      if (tabs) {
        tabs.classList.add('potts-record-tabs');
      }

      if (tabContent) {
        tabContent.classList.add('potts-record-tab-content');
      }
    }

    if (mediaPage) {
      main.querySelectorAll(
        'img[src*="mediafirewall"], img[src*="mediaviewer"], ' +
        'a[href*="mediafirewall"] img, a[href*="mediaviewer"] img, ' +
        '.wt-media-object img, figure img'
      ).forEach(function (image) {
        image.classList.add('potts-media-image');
      });
    }
  }


  function actionText(element) {
    return normalise(element ? (element.textContent || element.value || element.getAttribute('aria-label') || '') : '');
  }

  function looksLikeEditForm(form, pageByUrl, pageByHeading) {
    if (!(form instanceof HTMLFormElement)) {
      return false;
    }

    if (form.closest('.potts-header-search, .potts-genealogy-nav, .potts-utility-nav')) {
      return false;
    }

    const controls = form.querySelectorAll('input:not([type="hidden"]), select, textarea').length;
    const actions = Array.from(form.querySelectorAll('button, input[type="submit"], input[type="button"], a.btn'));
    const hasEditAction = actions.some(function (element) {
      return /^(?:save|create|add|update|upload|link|unlink|delete|remove|continue|submit|change|copy)\b/.test(actionText(element));
    });
    const formHint = normalise((form.getAttribute('action') || '') + ' ' + (form.id || '') + ' ' + form.className);
    const hinted = /(?:edit|add|create|upload|link|record|fact|media|source|note|family|individual)/.test(formHint);

    return Boolean(form.closest('.modal')) ||
      ((pageByUrl || pageByHeading || hinted) && controls >= 1 && hasEditAction) ||
      (controls >= 4 && hasEditAction && hinted);
  }

  function markRequiredLabels(form) {
    form.querySelectorAll('input[required], select[required], textarea[required], [aria-required="true"]').forEach(function (control) {
      const id = control.getAttribute('id');
      let label = id ? form.querySelector('label[for="' + CSS.escape(id) + '"]') : null;

      if (!label) {
        label = control.closest('.form-group, .mb-3, .row, .potts-form-row')?.querySelector('label, .form-label, .col-form-label') || null;
      }

      if (label) {
        label.classList.add('potts-required-label');
      }
    });
  }

  function markFormActions(form) {
    const actionElements = Array.from(form.querySelectorAll('button, input[type="submit"], input[type="button"], a.btn'));

    actionElements.forEach(function (element) {
      const text = actionText(element);

      if (/^(?:save|create|add|update|upload|link|continue|submit|change|copy)\b/.test(text)) {
        element.classList.add('potts-action-primary');
      } else if (/^(?:delete|remove|unlink|discard)\b/.test(text)) {
        element.classList.add('potts-action-danger');
      } else if (/^(?:cancel|close|back|reset)\b/.test(text)) {
        element.classList.add('potts-action-secondary');
      }
    });

    const groups = new Set();
    actionElements.forEach(function (element) {
      const group = element.closest('.modal-footer, .card-footer, .d-flex, .btn-group, .button-row, .form-actions, .row, .mb-3');
      if (group && group.querySelectorAll('button, input[type="submit"], input[type="button"], a.btn').length >= 2) {
        groups.add(group);
      }
    });

    groups.forEach(function (group) {
      group.classList.add('potts-form-actions');
    });
  }

  function enhanceEditingExperience() {
    const main = document.querySelector('main, #content, #main, #main-content, #page');
    const locationText = (window.location.pathname + ' ' + window.location.search).toLowerCase();
    const headingNode = main ? main.querySelector('h1, .wt-page-title, .page-title, header h1') : null;
    const headingText = normalise(headingNode ? headingNode.textContent : document.title);
    const pageByUrl = /(?:action=edit|action=add|\/edit(?:\/|$)|\/add(?:\/|$)|edit-|add-|create-|upload|link-|change-family|reorder|copy-fact|delete-fact)/.test(locationText);
    const pageByHeading = /^(?:edit|add|create|upload|link|change|copy|delete|remove)\b/.test(headingText);
    const editForms = [];

    document.querySelectorAll('form').forEach(function (form) {
      if (!looksLikeEditForm(form, pageByUrl, pageByHeading)) {
        return;
      }

      form.classList.add('potts-edit-form');
      editForms.push(form);

      form.querySelectorAll('fieldset, .card, .accordion-item').forEach(function (section) {
        if (section.querySelector('input, select, textarea')) {
          section.classList.add('potts-edit-section');
        }
      });

      form.querySelectorAll('.row, .mb-3, .form-group').forEach(function (row) {
        if (row.querySelector('label, .form-label, .col-form-label') && row.querySelector('input, select, textarea, .select2-container, .choices, .ts-wrapper')) {
          row.classList.add('potts-form-row');
        }
      });

      markRequiredLabels(form);
      markFormActions(form);

    });


    const dashboard = document.body.classList.contains('potts-dashboard-page');
    const recordPage = isIndividualPage() || document.body.classList.contains('potts-record-page');

    // An individual page contains a small inline "Fact or event" form for
    // editors. It should be styled as a form, but it must not turn the whole
    // individual record into a narrow edit page. Only dedicated edit routes,
    // edit headings or standalone edit forms should constrain the main page.
    const hasStandaloneEditForm = Boolean(main && editForms.some(function (form) {
      if (!main.contains(form)) {
        return false;
      }

      return !form.closest(
        '.wt-tab-content, .tab-content, #facts_content, [id*="facts_content"], ' +
        '.wt-facts-table, table.facts_table, .wt-individual-page'
      );
    }));

    const editPage = Boolean(
      main &&
      !dashboard &&
      (pageByUrl || pageByHeading || (!recordPage && hasStandaloneEditForm))
    );

    document.body.classList.toggle('potts-edit-page', editPage);

    if (main) {
      main.classList.toggle('potts-edit-content', editPage);
    }
  }

  function enhanceStructuredPages() {
    const main = document.querySelector('main, #content, #main, #main-content, #page');

    if (!main) {
      return;
    }

    const locationText = (window.location.pathname + ' ' + window.location.search).toLowerCase();
    const headingNode = main.querySelector('h1, .wt-page-title, .page-title, header h1');
    const headingText = normalise(headingNode ? headingNode.textContent : document.title);

    const chartByUrl = /(?:chart|pedigree|ancestor|descendant|hourglass|fan-chart|relationship)/.test(locationText);
    const chartByHeading = /(?:ancestors|descendants|pedigree|hourglass|relationship chart|family tree)/.test(headingText);
    const chartByMarkup = Boolean(main.querySelector(
      '.wt-chart, .wt-pedigree-chart, .wt-descendants-chart, .wt-hourglass-chart, ' +
      '.wt-ancestors-chart, .wt-relationship-chart, [id*="pedigree"], [id*="descendant"], ' +
      '[id*="ancestor-chart"], [class*="pedigree-chart"], [class*="descendant-chart"]'
    ));

    const listByUrl = /(?:indilist|famlist|sourcelist|medialist|repolist|notelist|placelist|surname|individual-list|family-list|list-page)/.test(locationText);
    const listByHeading = /^(?:individuals|families|surnames|sources|repositories|media objects|shared notes|places|place hierarchy)\b/.test(headingText);
    const listByMarkup = Boolean(main.querySelector(
      '.wt-table-individual, .wt-table-family, .wt-table-source, .wt-table-media, ' +
      '.wt-table-repository, .wt-table-note, .wt-table-location, .dataTables_wrapper, .dt-container'
    ));

    const reportByUrl = /(?:report|reports)/.test(locationText);
    const reportByHeading = /(?:^reports?\b|report options|print\/export)/.test(headingText);
    const reportByMarkup = Boolean(main.querySelector('.wt-report-list, .wt-report-options, [class*="report-list"]'));

    const calendarByUrl = /(?:calendar|anniversary|on-this-day)/.test(locationText);
    const calendarByHeading = /(?:on this day|calendar|anniversaries)/.test(headingText);

    const chartPage = chartByUrl || chartByHeading || chartByMarkup;
    const listPage = !chartPage && (listByUrl || listByHeading || listByMarkup);
    const reportPage = !chartPage && (reportByUrl || reportByHeading || reportByMarkup);
    const calendarPage = calendarByUrl || calendarByHeading;

    document.body.classList.toggle('potts-chart-page', chartPage);
    document.body.classList.toggle('potts-list-page', listPage);
    document.body.classList.toggle('potts-report-page', reportPage);
    document.body.classList.toggle('potts-calendar-page', calendarPage);

    const structured = chartPage || listPage || reportPage || calendarPage;
    document.body.classList.toggle('potts-structured-page', structured);
    main.classList.toggle('potts-structured-content', structured);
  }


  function closestThemeBlock(element) {
    return element ? element.closest(
      '.wt-block, .wt-side-block, .block, .card, .panel, .box'
    ) : null;
  }

  function enhanceMessagesAndNewsBlocks() {
    document.querySelectorAll('table').forEach(function (table) {
      const headerText = normalise(Array.from(table.querySelectorAll('thead th, tr:first-child th, tr:first-child td')).map(function (cell) {
        return cell.textContent || '';
      }).join(' '));

      const looksLikeMessages = headerText.includes('subject') &&
        (headerText.includes('date sent') || headerText.includes('sent')) &&
        (headerText.includes('delete') || table.querySelector('input[type="checkbox"]'));

      if (!looksLikeMessages) {
        return;
      }

      table.classList.add('potts-message-table');

      const wrapper = table.closest('.table-responsive, .overflow-auto');
      if (wrapper) {
        wrapper.classList.add('potts-message-table-wrap');
      }

      const block = closestThemeBlock(table);
      if (block) {
        block.classList.add('potts-dashboard-messages');
      }

      const headings = Array.from(table.querySelectorAll('thead th, tr:first-child th')).map(function (cell) {
        return String(cell.textContent || '').replace(/\s+/g, ' ').trim();
      });

      table.querySelectorAll('tbody tr').forEach(function (row) {
        row.classList.add('potts-message-row');
        Array.from(row.children).forEach(function (cell, index) {
          if (headings[index]) {
            cell.setAttribute('data-potts-label', headings[index]);
          }
        });
      });
    });

    const blocks = Array.from(document.querySelectorAll(
      '.wt-block, .wt-side-block, main .block, main .card, main .panel, main .box'
    ));

    blocks.forEach(function (block) {
      const heading = blockHeading(block) || dashboardBlockHeading(block);
      const text = normalise(block.textContent || '');
      const isNews = heading === 'news' || heading.startsWith('news ') || text.includes('add a news article');

      if (!isNews) {
        return;
      }

      block.classList.add('potts-home-news');

      block.querySelectorAll('a, button').forEach(function (control) {
        const label = normalise(control.textContent || control.getAttribute('value') || '');

        if (label === 'edit' || label.startsWith('edit ')) {
          control.classList.add('potts-news-edit');
        } else if (label === 'delete' || label.startsWith('delete ')) {
          control.classList.add('potts-news-delete');
        } else if (label.includes('add a news article')) {
          control.classList.add('potts-news-add');
        }
      });

      const content = block.querySelector(
        '.wt-block-content, .wt-side-block-content, .card-body, .blockcontent, .block-content, .panel-body, .box-content'
      );

      if (content) {
        content.classList.add('potts-news-content');
        Array.from(content.children).forEach(function (child) {
          const childText = normalise(child.textContent || '');
          if (childText && !child.matches('script, style') && childText !== 'edit delete add a news article') {
            child.classList.add('potts-news-section');
          }
        });
      }
    });
  }

  function enhanceUtilityPages() {
    const main = document.querySelector('main, #content, #main, #main-content, #page');

    if (!main) {
      return;
    }

    const utilityClasses = [
      'potts-utility-page',
      'potts-auth-page',
      'potts-search-page',
      'potts-contact-page',
      'potts-clippings-page',
      'potts-status-page'
    ];

    function clearUtilityPageClasses() {
      utilityClasses.forEach(function (className) {
        document.body.classList.remove(className);
      });
      main.classList.remove('potts-utility-content');
    }

    // Never treat record pages as utility pages. Earlier route matching looked
    // for fragments such as "cart" anywhere in the URL, so an individual
    // named Carter could be mistaken for the clippings cart. That narrowed the
    // page and pushed the Family navigator below the facts section.
    if (isIndividualPage() || main.querySelector('.wt-family-navigator, #family-navigator, .wt-individual-page')) {
      clearUtilityPageClasses();
      return;
    }

    const pathSegments = window.location.pathname.toLowerCase().split('/').filter(Boolean);
    const query = new URLSearchParams(window.location.search);
    const routeValues = pathSegments.concat(Array.from(query.values()).map(function (value) {
      return String(value || '').toLowerCase();
    }));

    function hasRouteToken(tokens) {
      return routeValues.some(function (value) {
        return tokens.includes(value);
      });
    }

    const headingNode = main.querySelector('h1, .wt-page-title, .page-title, header h1');
    const headingText = normalise(headingNode ? headingNode.textContent : document.title);

    const authPage = hasRouteToken([
      'login', 'sign-in', 'signin', 'register', 'registration', 'password',
      'forgot', 'reset-password', 'verify-email'
    ]) || /^(?:sign in|log in|register|create an account|reset password|forgotten password|change password)/.test(headingText);

    const searchPage = hasRouteToken(['general-search', 'advanced-search', 'search-page', 'search', 'search.php']) ||
      /^(?:search|general search|advanced search|search results)/.test(headingText);

    const contactPage = hasRouteToken(['contact', 'message', 'send-message', 'user-contact']) &&
      !document.body.classList.contains('potts-dashboard-page');

    const clippingsPage = hasRouteToken(['clippings', 'cart', 'clippings-cart']) || /clippings cart/.test(headingText);
    const statusPage = hasRouteToken([
      'access-denied', 'maintenance', 'error', 'not-found', 'forbidden',
      'unauthorised', 'unauthorized'
    ]) || /(?:access denied|page not found|site unavailable|maintenance|an error occurred|permission denied)/.test(headingText);

    const utilityPage = authPage || searchPage || contactPage || clippingsPage || statusPage;

    document.body.classList.toggle('potts-utility-page', utilityPage);
    document.body.classList.toggle('potts-auth-page', authPage);
    document.body.classList.toggle('potts-search-page', searchPage);
    document.body.classList.toggle('potts-contact-page', contactPage);
    document.body.classList.toggle('potts-clippings-page', clippingsPage);
    document.body.classList.toggle('potts-status-page', statusPage);
    main.classList.toggle('potts-utility-content', utilityPage);

    if (!utilityPage) {
      return;
    }

    main.querySelectorAll('form').forEach(function (form) {
      form.classList.add('potts-utility-form');
    });

    main.querySelectorAll('.alert, .card, .table-responsive, fieldset').forEach(function (panel) {
      panel.classList.add('potts-utility-panel');
    });

    if (searchPage) {
      main.querySelectorAll('table, .list-group, .search-results, [class*="search-result"]').forEach(function (result) {
        result.classList.add('potts-search-results');
      });
    }
  }

  let refreshPending = false;

  function runEnhancements() {
    refreshPending = false;
    enhanceSiteShell();
    enhanceHistoryRegionMenuLink();
    enhanceStructuredPages();
    enhanceDashboardPage();
    enhanceRecordAndNarrativePages();
    enhanceHomePage();
    enhanceEditingExperience();
    enhanceMessagesAndNewsBlocks();
    enhanceUtilityPages();
    cleanIncorrectFactEnhancements();
    enhanceIndividualIdentityCard();
    enhanceFamilyNavigator();
    resetNestedFactEnhancements();
    enhanceFactCells();
    resetNestedFactEnhancements();
    renderReliableFactIcons();
    enhanceIndividualLayout();
    enhanceFamilyPopovers();
    enhanceRelationshipLinks();
  }

  function scheduleEnhancements() {
    if (refreshPending) {
      return;
    }

    refreshPending = true;
    window.requestAnimationFrame(runEnhancements);
  }

  function start() {
    runEnhancements();

    // The Family navigator creates its floating popover only after the arrow
    // is clicked. Follow the clicked trigger to the generated popover using
    // aria-describedby/aria-controls, then apply the opaque theme styles.
    document.addEventListener('click', function (event) {
      const target = event.target instanceof Element ? event.target : null;
      const trigger = target ? target.closest(
        '.wt-family-navigator-label [data-bs-toggle], ' +
        '.wt-family-navigator-label a, .wt-family-navigator-label button, ' +
        '.potts-family-role-cell [data-bs-toggle], ' +
        '.potts-family-role-cell a, .potts-family-role-cell button'
      ) : null;

      if (!trigger) {
        return;
      }

      [0, 30, 100, 220].forEach(function (delay) {
        window.setTimeout(function () {
          markPopupForFamilyTrigger(trigger);
          enhanceFamilyPopovers();
        }, delay);
      });
    });

    document.addEventListener('shown.bs.popover', function (event) {
      const trigger = event.target instanceof Element ? event.target : null;
      markPopupForFamilyTrigger(trigger);
      enhanceFamilyPopovers();
    });

    /* Performance-safe refreshes. A page-wide MutationObserver caused every
       DOM change made by the theme to trigger another full document scan.
       Refresh only after user actions that can load AJAX content. */
    document.addEventListener('click', function (event) {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) {
        return;
      }

      if (target.closest('[data-bs-toggle=\"tab\"], [role=\"tab\"], .nav-tabs a, .wt-tabs a, [data-bs-toggle=\"collapse\"], .accordion-button')) {
        [80, 260].forEach(function (delay) {
          window.setTimeout(scheduleEnhancements, delay);
        });
      }
    });

    document.addEventListener('shown.bs.tab', scheduleEnhancements, true);
    document.addEventListener('shown.bs.collapse', scheduleEnhancements, true);
    document.addEventListener('shown.bs.modal', scheduleEnhancements, true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
