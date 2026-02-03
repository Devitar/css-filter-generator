import type { ReactNode, ButtonHTMLAttributes } from 'react';
import './Button.css';

/** Types */

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'funky';
};

/** Component */
/** Multi purpose button component. */
const Button = ({ children, variant = 'primary', className = '', ...props }: Props) => {
  return (
    <button className={`button button-${variant} ${className}`} {...props}>
      {children}
    </button>
  );
};

/** Exports */

export default Button;
