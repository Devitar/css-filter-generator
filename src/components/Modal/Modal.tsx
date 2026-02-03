import { useEffect, useId, useRef } from 'react';
import Button from '../Button/Button';
import './Modal.css';

/** Types */

type Props = {
  /** Text for the close button. */
  buttonText: string;
  /** Modal text content. */
  content: string;
  isOpen: boolean;
  onClose?: () => void;
  /** Text for the modal title. */
  title?: string;
};

/** Component */
/** Renders a full-screen modal with a title, content, and a close button. */
const Modal = ({ title, content, buttonText, onClose, isOpen }: Props) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const contentId = useId();

  // Handle escape key and focus management
  useEffect(() => {
    if (!isOpen) return;

    // Store the previously focused element to restore later
    previouslyFocusedElement.current = document.activeElement as HTMLElement;

    // Focus the modal when it opens
    modalRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }

      // Focus trap - keep focus within modal
      if (e.key === 'Tab') {
        const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusableElements || focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';

      // Return focus to the previously focused element
      previouslyFocusedElement.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    // Close when clicking on the overlay (not the modal content)
    if (e.target === e.currentTarget && onClose) {
      onClose();
    }
  };

  return (
    <div
      className='modal-overlay'
      onClick={handleOverlayClick}
      role='presentation'
    >
      <div
        ref={modalRef}
        className='modal'
        role='dialog'
        aria-modal='true'
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={contentId}
        tabIndex={-1}
      >
        {title && (
          <h2 id={titleId} className='modal-title'>
            {title}
          </h2>
        )}
        <p id={contentId} className='modal-content'>
          {content}
        </p>
        <Button onClick={onClose}>{buttonText}</Button>
      </div>
    </div>
  );
};

/** Exports */

export default Modal;
