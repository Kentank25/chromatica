import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import './Modal.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  closable?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  closable = true,
}) => {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  const { containerRef, handleKeyDown } = useFocusTrap<HTMLDivElement>(visible);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      setClosing(false);
    } else if (visible) {
      setClosing(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setClosing(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen, visible]);

  // Lock body scroll
  useEffect(() => {
    if (visible) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [visible]);

  // Escape key
  useEffect(() => {
    if (!visible || !closable) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [visible, closable, onClose]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (closable && e.target === backdropRef.current) {
        onClose();
      }
    },
    [closable, onClose],
  );

  if (!visible) return null;

  return (
    <div
      ref={(el) => {
        // @ts-ignore
        backdropRef.current = el;
        containerRef.current = el;
      }}
      className={`modal-backdrop ${closing ? 'modal-backdrop--closing' : ''}`}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Dialog'}
    >
      <div className={`modal-content ${closing ? 'modal-content--closing' : ''}`}>
        {(title || closable) && (
          <header className="modal-header">
            {title && <h2 className="modal-title">{title}</h2>}
            {closable && (
              <button
                className="modal-close"
                onClick={onClose}
                aria-label="Close dialog"
                id="modal-close-btn"
              >
                ✕
              </button>
            )}
          </header>
        )}
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
