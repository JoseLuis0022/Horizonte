import { createContext, useContext, useEffect, useState } from 'react';

const NowContext = createContext(Date.now());

// Un solo reloj para toda la app, alineado al cambio de segundo para que
// todos los dígitos cambien en el mismo frame.
export function NowProvider({ children }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let t;
    const tick = () => {
      setNow(Date.now());
      t = setTimeout(tick, 1000 - (Date.now() % 1000) + 4);
    };
    t = setTimeout(tick, 1000 - (Date.now() % 1000) + 4);
    return () => clearTimeout(t);
  }, []);

  return <NowContext.Provider value={now}>{children}</NowContext.Provider>;
}

export const useNow = () => useContext(NowContext);
