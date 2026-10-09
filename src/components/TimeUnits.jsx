import { NumericText } from './NumericText';
import { pad } from '../lib/time';
import { cn } from '../lib/cn';

const LABELS = ['Días', 'Horas', 'Minutos', 'Segundos'];

// Fila grande de unidades (Hero y Detalle). El tamaño se pasa como clase
// para que cada contexto use su propio clamp().
export function TimeUnits({ t, sizeClass, theme }) {
  const values = [t.days, pad(t.hours), pad(t.minutes), pad(t.seconds)];
  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-4">
      {values.map((v, i) => (
        <div key={LABELS[i]} className="flex min-w-0 flex-col">
          <NumericText value={v} className={cn('font-ui font-semibold leading-none tracking-tight', sizeClass)} />
          <span className="mt-2 flex items-center gap-1.5 font-ui text-12 font-semibold uppercase tracking-wide text-text-2 sm:text-13">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: i === 3 ? theme.to : theme.from }} />
            {LABELS[i]}
          </span>
        </div>
      ))}
    </div>
  );
}
