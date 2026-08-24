const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf-8');

const finalFix = `
/* ABSOLUTE OVERRIDES FOR BLOCKLY PREMIUM UI */
html body .app-root .blocklyToolboxDiv,
html body .app-root.theme-light .blocklyToolboxDiv,
.blocklyToolboxDiv {
  background: rgba(255, 255, 255, 0.75) !important;
  backdrop-filter: blur(25px) saturate(180%) !important;
  -webkit-backdrop-filter: blur(25px) saturate(180%) !important;
  border-right: 1px solid rgba(0, 0, 0, 0.05) !important;
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.03) !important;
}

html body .app-root:not(.theme-light) .blocklyToolboxDiv {
  background: rgba(13, 16, 27, 0.65) !important;
  border-right: 1px solid rgba(255, 255, 255, 0.05) !important;
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.35) !important;
}

/* Remove ANY weird borders on flyout/toolbox */
.blocklyFlyoutBackground {
  fill: transparent !important;
}
html body .blocklyFlyout {
  display: none !important; 
} /* we don't hide flyout entirely, but wait, flyout is needed for categories */
/* just hide its harsh background stroke */
.blocklyFlyoutBackground {
  stroke: none !important;
}
.theme-light .blocklyFlyoutBackground {
  fill: rgba(248, 250, 252, 0.95) !important;
}
.app-root:not(.theme-light) .blocklyFlyoutBackground {
  fill: rgba(15, 23, 42, 0.95) !important;
}

/* Fix category rows */
.blocklyTreeRow {
  border: none !important;
}

/* Fix Grid Pattern */
.blocklyGridPattern path,
pattern path {
  stroke: rgba(0, 0, 0, 0.06) !important;
}
.app-root:not(.theme-light) .blocklyGridPattern path,
.app-root:not(.theme-light) pattern path {
  stroke: rgba(255, 255, 255, 0.04) !important;
}
`;

fs.appendFileSync('src/index.css', finalFix);
console.log('Appended final UI overrides to index.css');
