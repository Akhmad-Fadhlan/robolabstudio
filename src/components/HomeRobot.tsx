import { useEffect, useRef, useState } from 'react';
import { Bot } from 'lucide-react';

export default function HomeRobot() {
  const host = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const node = host.current;
    if (!node) return;
    let dispose: (() => void) | undefined;
    let cancelled = false;
    void import('./homeRobotScene').then(({ mountHomeRobot }) => {
      if (cancelled) return;
      dispose = mountHomeRobot(node, setReady);
    }).catch(() => {});
    return () => { cancelled = true; dispose?.(); };
  }, []);

  return <div className="home-robot relative grid h-20 w-24 place-items-center overflow-hidden rounded-xl" aria-hidden="true">
    {!ready && <Bot className="size-9 text-sky-600" />}
    <div ref={host} className="absolute inset-0 [&_canvas]:block [&_canvas]:size-full" />
  </div>;
}
