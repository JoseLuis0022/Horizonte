import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { DndContext, DragOverlay, MouseSensor, TouchSensor, pointerWithin, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import { ArrowDownUp, Check, LayoutGrid } from 'lucide-react';
import { Header } from './components/Header';
import { Hero, HeroEmpty } from './components/Hero';
import { CardOverlay, CountdownCard } from './components/CountdownCard';
import { DetailView } from './components/DetailView';
import { Composer } from './components/Composer';
import { SegmentedControl } from './components/SegmentedControl';
import { EmptyState } from './components/EmptyState';
import { UpNext } from './components/UpNext';
import { AmbientBackground } from './components/AmbientBackground';
import { Toast } from './components/Toast';
import { Button } from './components/Button';
import { useCountdowns } from './lib/store';
import { getNow, useNowSelector } from './lib/useNow';
import { THEMES, getTheme } from './lib/themes';
import { originOffset } from './lib/origin';
import { dragState } from './lib/dragState';
import { screenEnter, springSoft } from './lib/motion';

// Sin transforms de dnd-kit: el grid se reordena de verdad en cada paso y
// Framer anima el reacomodo (funciona con tarjetas de distintos tamaños).
const noStrategy = () => null;

export default function App() {
  const { items, add, update, remove, restore, move, sortByDate, featuredId, setFeaturedId } = useCountdowns();
  // App NO escucha cada segundo: solo se entera cuando algún countdown cruza
  // el cero (cambia esta firma). Los segundos corren dentro de cada tarjeta.
  useNowSelector(useCallback((t) => items.map((c) => (c.target <= t ? 1 : 0)).join(''), [items]));
  const now = getNow();
  const [filter, setFilter] = useState('upcoming');
  const [selected, setSelected] = useState(null); // { id, origin: 'card' | 'hero' }
  const [composer, setComposer] = useState(null); // { initial?, origin }
  const [toast, setToast] = useState(null);
  const [editing, setEditing] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const lastSwap = useRef({ id: null, t: 0 });

  const upcoming = items.filter((c) => c.target > now);
  const done = items.filter((c) => c.target <= now);
  const visible = filter === 'upcoming' ? upcoming : filter === 'done' ? done : items;
  const next = upcoming.reduce((a, c) => (!a || c.target < a.target ? c : a), null);
  const featured = items.find((c) => c.id === featuredId);
  const heroItem = featured ?? next;
  const later = upcoming
    .filter((c) => c.id !== heroItem?.id)
    .sort((a, b) => a.target - b.target)
    .slice(0, 4);
  const selectedItem = selected && items.find((c) => c.id === selected.id);
  const activeItem = activeId && items.find((c) => c.id === activeId);

  const openCreate = useCallback((e) => {
    const el = e?.currentTarget?.getBoundingClientRect ? e.currentTarget : document.querySelector('[data-create]');
    setComposer({ origin: originOffset(el) });
  }, []);
  const closeDetail = useCallback(() => setSelected(null), []);
  const closeComposer = useCallback(() => setComposer(null), []);
  const dismissToast = useCallback(() => setToast(null), []);
  const toggleFeatured = useCallback((id) => setFeaturedId((f) => (f === id ? null : id)), [setFeaturedId]);

  // Atajos: "N" crea, "Esc" sale del modo organizar.
  useEffect(() => {
    const onKey = (e) => {
      if (selected || composer) return;
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
      if (e.key === 'Escape' && editing) setEditing(false);
      if (e.key.toLowerCase() === 'n' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        openCreate();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected, composer, editing, openCreate]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } })
  );

  const onDragOver = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    // Evita el "ping-pong" entre dos tarjetas de distinto tamaño.
    const t = performance.now();
    if (lastSwap.current.id === over.id && t - lastSwap.current.t < 350) return;
    lastSwap.current = { id: over.id, t };
    move(active.id, over.id);
  };
  const endDrag = () => {
    setActiveId(null);
    dragState.endedAt = Date.now();
  };

  const handleSave = (data) => {
    if (composer?.initial?.id) {
      update(composer.initial.id, data);
    } else {
      const created = add(data);
      setFilter(created.target > Date.now() ? 'upcoming' : 'done');
    }
    setComposer(null);
  };

  const handleDelete = (item) => {
    // Primero se cierra el detalle y luego se borra: si ambos salen a la vez
    // con el mismo layoutId, Framer puede dejar el panel huérfano.
    setSelected(null);
    setTimeout(() => remove(item.id), 380);
    setToast({ key: Date.now(), message: `Se eliminó «${item.title}»`, action: { label: 'Deshacer', run: () => restore(item) } });
  };

  const handleEdit = (item, e) => {
    const origin = originOffset(e?.currentTarget);
    setSelected(null);
    setComposer({ initial: item, origin });
  };

  return (
    <LayoutGroup>
      <AmbientBackground theme={heroItem ? getTheme(heroItem.theme) : THEMES.blue} />
      <Header onCreate={openCreate} composerOpen={Boolean(composer)} />

      <main className="mx-auto max-w-[2100px] px-4 pb-32 pt-6 sm:px-8 sm:pt-8 xl:px-12">
        {/* En pantallas anchas el Hero comparte fila con la columna "Después" */}
        <section aria-label="Destacado" className={later.length ? 'grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(340px,400px)]' : ''}>
          <AnimatePresence mode="popLayout" initial={true}>
            {heroItem ? (
              <Hero
                key={heroItem.id}
                item={heroItem}
                featured={Boolean(featured)}
                onOpen={() => setSelected({ id: heroItem.id, origin: 'hero' })}
              />
            ) : (
              <HeroEmpty key="empty" onCreate={openCreate} />
            )}
          </AnimatePresence>
          {later.length > 0 && (
            <div className="hidden xl:flex">
              <UpNext items={later} onOpen={(id) => setSelected({ id, origin: 'upnext' })} />
            </div>
          )}
        </section>

        <motion.section aria-label="Todos los countdowns" variants={screenEnter} custom={2} initial="hidden" animate="visible" className="mt-12">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-ui text-22">Tus countdowns</h2>
            <div className="flex flex-wrap items-center gap-2">
              <SegmentedControl
                value={filter}
                onChange={setFilter}
                options={[
                  { value: 'upcoming', label: 'Próximos', count: upcoming.length },
                  { value: 'done', label: 'Completados', count: done.length },
                  { value: 'all', label: 'Todos', count: items.length },
                ]}
              />
              <Button variant={editing ? 'primary' : 'secondary'} size="sm" onClick={() => setEditing((v) => !v)} className="h-11">
                <LayoutGrid size={16} />
                {editing ? 'Listo' : 'Organizar'}
              </Button>
            </div>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={pointerWithin}
            onDragStart={({ active }) => setActiveId(active.id)}
            onDragOver={onDragOver}
            onDragEnd={endDrag}
            onDragCancel={endDrag}
          >
            <SortableContext items={visible.map((c) => c.id)} strategy={noStrategy}>
              <div className="mt-6 grid grid-cols-1 gap-4 [grid-auto-flow:dense] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 min-[1900px]:grid-cols-5 min-[2300px]:grid-cols-6">
                <AnimatePresence mode="popLayout">
                  {visible.length === 0 ? (
                    <EmptyState key={`empty-${filter}`} filter={filter} onCreate={openCreate} />
                  ) : (
                    visible.map((item, i) => (
                      <CountdownCard
                        key={item.id}
                        item={item}
                        index={i}
                        editing={editing}
                        featured={item.id === featuredId}
                        onOpen={() => setSelected({ id: item.id, origin: 'card' })}
                        onResize={(size) => update(item.id, { size })}
                        onFeature={() => toggleFeatured(item.id)}
                      />
                    ))
                  )}
                </AnimatePresence>
              </div>
            </SortableContext>
            {/* En portal: la sección tiene `filter` y eso rompería el position:fixed del overlay */}
            {createPortal(
              <DragOverlay dropAnimation={{ duration: 260, easing: 'cubic-bezier(0.32, 0.72, 0, 1)' }}>
                {activeItem ? <CardOverlay item={activeItem} /> : null}
              </DragOverlay>,
              document.body
            )}
          </DndContext>
        </motion.section>
      </main>

      <AnimatePresence>
        {selectedItem && (
          <DetailView
            key={`detail-${selectedItem.id}`}
            item={selectedItem}
            origin={selected.origin}
            featured={selectedItem.id === featuredId}
            onClose={closeDetail}
            onEdit={(e) => handleEdit(selectedItem, e)}
            onDelete={() => handleDelete(selectedItem)}
            onStyle={(style) => update(selectedItem.id, { style })}
            onFeature={() => toggleFeatured(selectedItem.id)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {composer && (
          <Composer key="composer" initial={composer.initial} origin={composer.origin} onClose={closeComposer} onSave={handleSave} />
        )}
      </AnimatePresence>

      {/* Barra flotante del modo Organizar: solo transform/opacity, no empuja el layout */}
      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ y: 80, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 80, opacity: 0, scale: 0.95 }}
            transition={springSoft}
            className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(16px,env(safe-area-inset-bottom))]"
          >
            <div className="flex items-center gap-2 rounded-full bg-[#1d1d1f] p-1.5 pl-5 text-white shadow-3">
              <span className="hidden font-ui text-13 font-medium text-white/80 sm:inline">Arrastra · elige tamaño · ★ destaca</span>
              <span className="font-ui text-13 font-medium text-white/80 sm:hidden">Arrastra para mover</span>
              <button
                type="button"
                onClick={sortByDate}
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/15 px-3.5 font-ui text-13 font-semibold transition-colors hover:bg-white/25"
              >
                <ArrowDownUp size={14} /> Por fecha
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-accent px-4 font-ui text-13 font-semibold transition-colors hover:brightness-110"
              >
                <Check size={14} strokeWidth={3} /> Listo
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Toast toast={toast} onDismiss={dismissToast} />
    </LayoutGroup>
  );
}
