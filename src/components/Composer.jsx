import { useCallback, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarDays, Clock3, X } from 'lucide-react';
import { Overlay } from './Overlay';
import { Button, IconButton } from './Button';
import { Visualizer } from './Visualizer';
import { StylePicker } from './StylePicker';
import { EmojiTile } from './EmojiTile';
import { PickerModal } from './pickers/PickerModal';
import { DatePicker } from './pickers/DatePicker';
import { TimePicker } from './pickers/TimePicker';
import { EMOJIS, THEMES, THEME_KEYS, getTheme, gradient } from '../lib/themes';
import { DAY, breakdown, formatLongDate, formatTime, fromInputs, progress, relative, toInputs } from '../lib/time';
import { useNow } from '../lib/useNow';
import { spring, springSnappy, springSoft } from '../lib/motion';
import { emerge, originOffset } from '../lib/origin';

function presets(now) {
  const d = new Date(now);
  return [
    { label: 'Mañana', ts: now + DAY },
    { label: '1 semana', ts: now + 7 * DAY },
    { label: '1 mes', ts: new Date(d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes()).getTime() },
    { label: 'Fin de año', ts: new Date(d.getFullYear(), 11, 31, 23, 59).getTime() },
  ];
}

const fieldClass =
  'h-12 w-full rounded-control border border-hairline bg-surface-2 px-4 font-ui text-17 text-text-1 outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-text-3 focus:border-accent focus:shadow-[0_0_0_4px_var(--accent-soft)]';

export function Composer({ initial, origin, onClose, onSave }) {
  const now = useNow();
  const editing = Boolean(initial?.id);
  const start = useMemo(() => toInputs(initial?.target ?? Date.now() + DAY), [initial]);

  const [title, setTitle] = useState(initial?.title ?? '');
  const [emoji, setEmoji] = useState(initial?.emoji ?? '🎉');
  const [themeKey, setThemeKey] = useState(initial?.theme ?? 'blue');
  const [style, setStyle] = useState(initial?.style ?? 'digits');
  const [createdAt] = useState(() => initial?.createdAt ?? Date.now());
  const [date, setDate] = useState(start.date);
  const [time, setTime] = useState(start.time);
  const [touched, setTouched] = useState(false);
  const [picker, setPicker] = useState(null); // { kind: 'date' | 'time', origin }
  const closePicker = useCallback(() => setPicker(null), []);

  const theme = getTheme(themeKey);
  const target = fromInputs(date, time);
  const validDate = Number.isFinite(target);
  const error = !title.trim() ? 'Ponle un nombre a tu countdown.' : !validDate ? 'Elige una fecha.' : null;
  const t = breakdown(validDate ? target : now, now);
  const p = validDate ? progress(createdAt, target, now) : 0;

  const submit = (e) => {
    e.preventDefault();
    setTouched(true);
    if (error) return;
    onSave({ title: title.trim(), emoji, theme: themeKey, style, target });
  };

  return (
    <Overlay onClose={onClose}>
      <motion.form
        onSubmit={submit}
        {...emerge(origin)}
        transition={springSoft}
        className="relative z-10 max-h-[calc(100dvh-16px)] w-full max-w-lg overflow-y-auto overflow-x-hidden rounded-modal bg-surface-1 shadow-3 no-scrollbar"
      >
        <div className="p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-ui text-22">{editing ? 'Editar countdown' : 'Nuevo countdown'}</h2>
            <IconButton type="button" aria-label="Cerrar" onClick={onClose}>
              <X size={20} />
            </IconButton>
          </div>

          {/* Vista previa en vivo: misma tarjeta que en la lista, con el estilo elegido */}
          <div className="relative mt-5 overflow-hidden rounded-card border border-hairline bg-surface-2 p-5">
            <motion.div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full blur-3xl"
              animate={{ background: gradient(theme), scale: [1, 1.2, 1] }}
              transition={{ background: { duration: 0.5 }, scale: { duration: 6, repeat: Infinity, ease: 'easeInOut' } }}
              style={{ opacity: 0.25 }}
            />
            <div className="relative flex items-center gap-3">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={emoji + themeKey}
                  initial={{ scale: 0.4, rotate: -20, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  exit={{ scale: 0.4, rotate: 20, opacity: 0 }}
                  transition={springSnappy}
                >
                  <EmojiTile emoji={emoji} theme={theme} />
                </motion.div>
              </AnimatePresence>
              <div className="min-w-0">
                <p className="truncate font-ui text-17 font-semibold">{title.trim() || 'Sin título'}</p>
                <p className="font-ui text-13 text-text-2">{validDate ? relative(target, now) : 'Sin fecha'}</p>
              </div>
            </div>
            <div className="relative mt-5">
              <Visualizer style={style} item={{ target: validDate ? target : now, createdAt }} t={t} p={p} theme={theme} size="sm" />
            </div>
          </div>

          <label className="mt-6 block">
            <span className="mb-2 block font-ui text-13 font-semibold text-text-2">Nombre</span>
            <input
              autoFocus={!editing}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Viaje a Japón"
              maxLength={60}
              className={fieldClass}
            />
          </label>

          <div className="mt-4 grid grid-cols-[1.5fr_1fr] gap-3">
            <PickerField
              label="Fecha"
              icon={CalendarDays}
              onClick={(e) => setPicker({ kind: 'date', origin: originOffset(e.currentTarget) })}
              text={date ? formatLongDate(fromInputs(date, '12:00')) : 'Elegir fecha'}
            />
            <PickerField
              label="Hora"
              icon={Clock3}
              onClick={(e) => setPicker({ kind: 'time', origin: originOffset(e.currentTarget) })}
              text={formatTime(fromInputs('2000-01-01', time))}
            />
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
            {presets(now).map((pr) => (
              <motion.button
                key={pr.label}
                type="button"
                whileTap={{ scale: 0.94 }}
                transition={springSnappy}
                onClick={() => {
                  const v = toInputs(pr.ts);
                  setDate(v.date);
                  setTime(v.time);
                }}
                className="h-9 shrink-0 rounded-full bg-text-1/[0.05] px-4 font-ui text-13 font-semibold text-text-2 transition-colors hover:bg-accent-soft hover:text-accent"
              >
                {pr.label}
              </motion.button>
            ))}
          </div>

          <span className="mb-2 mt-6 block font-ui text-13 font-semibold text-text-2">Icono</span>
          <div className="grid grid-cols-8 gap-1">
            {EMOJIS.map((e) => (
              <motion.button
                key={e}
                type="button"
                aria-label={`Icono ${e}`}
                aria-pressed={e === emoji}
                onClick={() => setEmoji(e)}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.85 }}
                transition={springSnappy}
                className="relative flex aspect-square items-center justify-center rounded-control text-[22px]"
              >
                {e === emoji && (
                  <motion.span layoutId="emoji-sel" transition={spring} className="absolute inset-0 rounded-control bg-text-1/[0.08]" />
                )}
                <span className="relative">{e}</span>
              </motion.button>
            ))}
          </div>

          <span className="mb-2 mt-6 block font-ui text-13 font-semibold text-text-2">Estilo</span>
          <StylePicker value={style} onChange={setStyle} theme={theme} />

          <span className="mb-2 mt-6 block font-ui text-13 font-semibold text-text-2">Color</span>
          <div className="flex flex-wrap gap-3">
            {THEME_KEYS.map((k) => (
              <motion.button
                key={k}
                type="button"
                aria-label={THEMES[k].name}
                aria-pressed={k === themeKey}
                onClick={() => setThemeKey(k)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.88 }}
                transition={springSnappy}
                className="relative flex h-11 w-11 items-center justify-center rounded-full"
              >
                {k === themeKey && (
                  <motion.span layoutId="theme-sel" transition={spring} className="absolute inset-0 rounded-full border-2" style={{ borderColor: THEMES[k].from }} />
                )}
                <span className="h-8 w-8 rounded-full shadow-1" style={{ background: gradient(THEMES[k]) }} />
              </motion.button>
            ))}
          </div>

          <AnimatePresence>
            {touched && error && (
              <motion.p
                initial={{ opacity: 0, height: 0, y: -4 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={springSoft}
                className="mt-4 font-ui text-13 font-medium text-danger"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <div className="mt-6 flex gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              {editing ? 'Guardar cambios' : 'Crear countdown'}
            </Button>
          </div>
        </div>
      </motion.form>

      <PickerModal open={picker?.kind === 'date'} origin={picker?.origin} onClose={closePicker}>
        <DatePicker value={date} onChange={setDate} onDone={closePicker} />
      </PickerModal>
      <PickerModal open={picker?.kind === 'time'} origin={picker?.origin} onClose={closePicker}>
        <TimePicker value={time} onChange={setTime} onDone={closePicker} />
      </PickerModal>
    </Overlay>
  );
}

function PickerField({ label, icon: Icon, text, onClick }) {
  return (
    <div className="min-w-0">
      <span className="mb-2 block font-ui text-13 font-semibold text-text-2">{label}</span>
      <motion.button
        type="button"
        onClick={onClick}
        whileTap={{ scale: 0.97 }}
        transition={springSnappy}
        className="flex h-12 w-full items-center gap-2.5 rounded-control border border-hairline bg-surface-2 px-4 text-left transition-colors hover:border-accent/40"
      >
        <Icon size={18} className="shrink-0 text-accent" />
        <span className="truncate font-ui text-15 font-medium">{text}</span>
      </motion.button>
    </div>
  );
}
