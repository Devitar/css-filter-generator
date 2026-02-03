import './Input.css';

/** Types */

type TextProps = {
  id: string;
  /** Renders a label element if present. */
  label?: string;
  /** Current value (controlled). */
  value: string;
  /** Callback for when value changes. */
  onChange: (value: string) => void;
  /** Type of input to render. Default: text */
  type?: 'text';
};

type ColorProps = {
  id: string;
  /** Renders a label element if present. */
  label?: string;
  /** Current value (controlled). */
  value: string;
  /** Callback for when value changes. */
  onChange: (value: string) => void;
  /** Type of input to render. */
  type: 'color';
};

type ToggleProps = {
  id: string;
  /** Renders a label element if present. */
  label?: string;
  /** Name for the group. */
  name?: string;
  /** Checked state (controlled). */
  checked: boolean;
  /** Callback for when value changes. */
  onChange: (value: boolean) => void;
  /** Type of input to render. Default: text */
  type: 'radio' | 'checkbox';
};

type Props = TextProps | ColorProps | ToggleProps;

/** Helper to assist TS in determining prop type. */
const isTextProps = (p: Props): p is TextProps => {
  return p.type === 'text' || p.type === undefined;
};

const isColorProps = (p: Props): p is ColorProps => {
  return p.type === 'color';
};

/** Component */
/** Renders an input element, either as a text input, color picker, or checkbox/radio. */
const Input = (props: Props) => {
  // Text input
  if (isTextProps(props)) {
    const { id, label, value, onChange } = props;
    return (
      <div className='input-container text-input-container'>
        <input
          className='text-input'
          id={id}
          onChange={(e) => onChange(e.target.value)}
          placeholder='#012345 or R,G,B'
          type='text'
          value={value}
        />
        {label && (
          <label className='input-label text-input-label' htmlFor={id}>
            {label}
          </label>
        )}
      </div>
    );
  }

  // Color picker
  if (isColorProps(props)) {
    const { id, label, value, onChange } = props;
    return (
      <div className='input-container color-input-container'>
        {label && (
          <label className='input-label' htmlFor={id}>
            {label}
          </label>
        )}
        <input
          className='color-input'
          id={id}
          onChange={(e) => onChange(e.target.value)}
          type='color'
          value={value || '#000000'}
        />
      </div>
    );
  }

  // Toggle (radio/checkbox)
  const { id, label, name, type, checked, onChange } = props;
  return (
    <div className='input-container toggle-input-container'>
      <input
        checked={checked}
        className='toggle-input'
        id={id}
        name={name}
        onChange={(e) => onChange(e.target.checked)}
        type={type}
      />
      {label && (
        <label className='input-label' htmlFor={id}>
          {label}
        </label>
      )}
    </div>
  );
};

/** Exports */

export default Input;
