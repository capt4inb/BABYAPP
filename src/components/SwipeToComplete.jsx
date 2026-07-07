import { useState, useRef, useEffect, useCallback } from 'react';
import GameIcon from './GameIcon';

export default function SwipeToComplete({ onComplete, label = 'Trượt để hoàn thành' }) {
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [particles, setParticles] = useState([]);
  
  const containerRef = useRef(null);
  const thumbRef = useRef(null);
  const startXRef = useRef(0);

  const THUMB_SIZE = 40;
  const PADDING = 4;

  const getMaxDrag = () => {
    if (!containerRef.current) return 0;
    return containerRef.current.clientWidth - THUMB_SIZE - (PADDING * 2);
  };

  const handleStart = (clientX) => {
    if (completed) return;
    setIsDragging(true);
    startXRef.current = clientX - dragX;
  };

  const handleMove = useCallback((clientX) => {
    if (!isDragging || completed) return;
    const maxDrag = getMaxDrag();
    let x = clientX - startXRef.current;
    if (x < 0) x = 0;
    if (x > maxDrag) x = maxDrag;
    setDragX(x);
  }, [completed, isDragging]);

  const triggerBurst = () => {
    setParticles([]);
  };

  // Particle animation loop
  useEffect(() => {
    if (particles.length === 0) return;

    let frameId;
    const updateParticles = () => {
      setParticles((prev) => {
        const next = prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.1, // gravity
            opacity: p.opacity - 0.02,
          }))
          .filter((p) => p.opacity > 0);
        
        if (next.length > 0) {
          frameId = requestAnimationFrame(updateParticles);
        }
        return next;
      });
    };

    frameId = requestAnimationFrame(updateParticles);
    return () => cancelAnimationFrame(frameId);
  }, [particles.length]);

  const handleEnd = useCallback(() => {
    if (!isDragging || completed) return;
    setIsDragging(false);
    
    const maxDrag = getMaxDrag();
    if (dragX >= maxDrag * 0.85) {
      // Complete!
      setDragX(maxDrag);
      setCompleted(true);
      triggerBurst();
      
      // Vibrate if mobile
      if (navigator.vibrate) {
        navigator.vibrate(80);
      }

      // Delay callback slightly to allow completion animation
      setTimeout(() => {
        onComplete();
      }, 400);
    } else {
      // Reset
      setDragX(0);
    }
  }, [completed, dragX, isDragging, onComplete]);

  // Touch handlers
  const onTouchStart = (e) => handleStart(e.touches[0].clientX);
  const onTouchMove = (e) => handleMove(e.touches[0].clientX);
  const onTouchEnd = () => handleEnd();

  // Mouse handlers
  const onMouseDown = (e) => handleStart(e.clientX);
  
  useEffect(() => {
    const onMouseMove = (e) => {
      if (isDragging) {
        handleMove(e.clientX);
      }
    };
    const onMouseUp = () => {
      if (isDragging) {
        handleEnd();
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging, dragX, handleEnd, handleMove]);

  const guideOpacity = completed ? 1 : Math.max(0, 1 - (dragX / 180));

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: 48,
        borderRadius: 24,
        background: completed ? 'var(--color-success)' : 'var(--color-surface-alt)',
        border: completed 
          ? '1.5px solid rgba(57, 169, 143, 0.28)'
          : '1.5px solid var(--color-border)',
        padding: PADDING,
        display: 'flex',
        alignItems: 'center',
        overflow: 'visible', // Keep particles visible outside the slider track!
        userSelect: 'none',
        cursor: completed ? 'default' : 'pointer',
        transition: 'background-color 0.3s ease, border-color 0.3s ease',
        boxShadow: completed 
          ? '0 4px 12px rgba(0, 201, 167, 0.2)' 
          : 'inset 0 1px 3px rgba(142, 125, 174, 0.05)',
      }}
    >
      {/* Sliding green success background overlay */}
      {!completed && (
        <div
          style={{
            position: 'absolute',
            left: PADDING,
            top: PADDING,
            height: THUMB_SIZE,
            width: dragX + (THUMB_SIZE / 2),
            background: 'color-mix(in oklab, var(--color-success) 18%, transparent)',
            borderRadius: 20,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Guide text */}
      <span
        style={{
          position: 'absolute',
          width: '100%',
          textAlign: 'center',
          left: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          fontSize: 13,
          fontWeight: 700,
          color: completed ? 'white' : 'var(--color-text-muted)',
          pointerEvents: 'none',
          opacity: guideOpacity,
          transition: completed ? 'color 0.3s' : 'none',
          letterSpacing: '0.02em',
          fontFamily: 'Outfit, sans-serif',
        }}
      >
        {completed ? 'Đã hoàn thành!' : label}
      </span>

      {/* Thumb handle */}
      <div
        ref={thumbRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        style={{
          position: 'absolute',
          left: dragX + PADDING,
          width: THUMB_SIZE,
          height: THUMB_SIZE,
          borderRadius: '50%',
          background: completed ? 'white' : 'var(--color-success)',
          boxShadow: completed 
            ? '0 2px 6px rgba(0,0,0,0.1)' 
            : '0 3px 10px rgba(0, 201, 167, 0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: completed ? 'default' : 'grab',
          transition: isDragging ? 'none' : 'left 0.25s cubic-bezier(0.25, 0.8, 0.25, 1), background-color 0.3s',
          zIndex: 5,
        }}
      >
        {completed ? (
          <GameIcon name="check" size={30} variant="green" />
        ) : (
          <GameIcon name="right" size={30} variant="green" />
        )}

        {/* Particles burst relative to the thumb */}
        {particles.map((p) => (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              backgroundColor: p.color,
              left: THUMB_SIZE / 2 + p.x,
              top: THUMB_SIZE / 2 + p.y,
              transform: 'translate(-50%, -50%)',
              opacity: p.opacity,
              pointerEvents: 'none',
              zIndex: 10,
            }}
          />
        ))}
      </div>
    </div>
  );
}
