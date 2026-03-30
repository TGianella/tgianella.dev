import { useState, useEffect, useCallback } from 'react';
import styles from './GalleryLightbox.module.css';

interface Photo {
  src: string;
  alt: string;
  caption?: string;
  width: number;
  height: number;
}

interface Props {
  photos: Photo[];
  labels: {
    close: string;
    prev: string;
    next: string;
  };
}

export default function GalleryLightbox({ photos, labels }: Props) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const isOpen = activeIndex !== null;

  const close = useCallback(() => setActiveIndex(null), []);

  const prev = useCallback(() => {
    setActiveIndex(i => (i === null ? null : (i - 1 + photos.length) % photos.length));
  }, [photos.length]);

  const next = useCallback(() => {
    setActiveIndex(i => (i === null ? null : (i + 1) % photos.length));
  }, [photos.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, close, prev, next]);

  // Prevent background scroll when open
  useEffect(() => {
    document.documentElement.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.documentElement.style.overflow = ''; };
  }, [isOpen]);

  const active = activeIndex !== null ? photos[activeIndex] : null;

  return (
    <>
      <ul className={styles.grid} role="list">
        {photos.map((photo, i) => (
          <li key={photo.src} className={styles.gridItem}>
            <button
              className={styles.gridItem}
              onClick={() => setActiveIndex(i)}
              aria-label={photo.alt}
              style={{ all: 'unset', display: 'block', width: '100%', height: '100%', cursor: 'pointer' }}
            >
              <img
                src={photo.src}
                alt={photo.alt}
                className={styles.thumb}
                loading="lazy"
                decoding="async"
                width={photo.width}
                height={photo.height}
              />
            </button>
          </li>
        ))}
      </ul>

      {isOpen && active && (
        <div
          className={styles.overlay}
          role="dialog"
          aria-modal="true"
          aria-label={active.alt}
          onClick={e => { if (e.target === e.currentTarget) close(); }}
        >
          <div className={styles.overlayInner}>
            <button
              className={`${styles.btn} ${styles.btnClose}`}
              onClick={close}
              aria-label={labels.close}
            >
              ✕
            </button>

            <img
              key={activeIndex}
              src={active.src}
              alt={active.alt}
              className={styles.lightboxImg}
              loading="eager"
              decoding="async"
              width={active.width}
              height={active.height}
            />

            {active.caption && (
              <p className={styles.caption}>{active.caption}</p>
            )}

            <div className={styles.controls}>
              <button className={styles.btn} onClick={prev} aria-label={labels.prev}>
                ←
              </button>
              <span className={styles.counter}>
                {(activeIndex as number) + 1} / {photos.length}
              </span>
              <button className={styles.btn} onClick={next} aria-label={labels.next}>
                →
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
