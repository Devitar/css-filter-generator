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
  if (!isOpen) return null;

  return (
    <div className='modal-overlay'>
      <div className='modal'>
        {title && <h2 className='modal-title'>{title}</h2>}
        <p className='modal-content'>{content}</p>
        <Button onClick={onClose}>{buttonText}</Button>
      </div>
    </div>
  );
};

/** Exports */

export default Modal;
