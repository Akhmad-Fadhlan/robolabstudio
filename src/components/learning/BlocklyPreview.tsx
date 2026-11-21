import { useEffect, useRef } from 'react';
import * as Blockly from 'blockly';

export function BlocklyPreview({ xml }: { xml: string }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = host.current;
    if (!container) return;
    let workspace: Blockly.WorkspaceSvg | undefined;
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect();
      try {
        workspace = Blockly.inject(container, { readOnly: true, renderer: 'zelos', sounds: false, media: '/media/' });
        Blockly.Xml.domToWorkspace(Blockly.utils.xml.textToDom(xml), workspace);
        const bounds = workspace.getBlocksBoundingBox();
        container.style.width = `${Math.max(160, bounds.right - bounds.left + 32)}px`;
        container.style.height = `${Math.max(64, bounds.bottom - bounds.top + 32)}px`;
        Blockly.svgResize(workspace);
        workspace.scroll(16 - bounds.left, 16 - bounds.top);
      } catch {
        workspace?.dispose();
        workspace = undefined;
        container.textContent = 'Pratinjau blok ini belum dapat ditampilkan.';
      }
    });
    observer.observe(container);
    return () => {
      observer.disconnect();
      workspace?.dispose();
      container.replaceChildren();
    };
  }, [xml]);

  return <div className="max-h-96 overflow-auto rounded-lg bg-white"><div ref={host} className="relative min-h-16 min-w-40" /></div>;
}
