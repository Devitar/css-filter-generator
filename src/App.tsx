import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Input, Modal } from './components';
import { generateFilterWithRetry } from './utils';
import type { FilterResultWithRetry } from './utils';
import './App.css';

import ReactLogo from './assets/react.svg';

/** Types */

type FormState = {
  color: string;
  sourceType: 'hexidecimal' | 'rgb';
};

type FilterState = {
  result: FilterResultWithRetry;
  inputColor: string;
};

/** The main app component. */
function App() {
  const [formState, setFormState] = useState<FormState>({
    color: '#61dafb',
    sourceType: 'hexidecimal',
  });
  const [manualChange, setManualChange] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [filterState, setFilterState] = useState<FilterState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleSubmit = useCallback(() => {
    setError(null);
    try {
      const result = generateFilterWithRetry(formState.color, {
        maxLoss: 1,
        maxAttempts: 100,
        forceBlack: true,
      });
      setFilterState({
        result,
        inputColor: formState.color,
      });
      // Scroll to results on mobile
      if (window.innerWidth <= 480) {
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } catch (e) {
      setFilterState(null);
      setError(e instanceof Error ? e.message : 'An unexpected error occurred');
    }
  }, [formState]);

  // Auto-update source type based on input, only if it wasn't manually changed
  useEffect(() => {
    if (manualChange) return;

    if (formState.color.indexOf(',') !== -1) {
      setFormState((prev) => (prev.sourceType === 'rgb' ? prev : { ...prev, sourceType: 'rgb' }));
    } else if (formState.color.indexOf('#') !== -1) {
      setFormState((prev) =>
        prev.sourceType === 'hexidecimal' ? prev : { ...prev, sourceType: 'hexidecimal' }
      );
    }
  }, [formState]);

  return (
    <div className='app-container'>
      <div className='header-group'>
        <h1 className='main-header'>CSS Filter Generator</h1>
        <Button
          variant='funky'
          className='app-description-button'
          onClick={() => setIsModalOpen(true)}
        >
          What's this?
        </Button>
      </div>
      <div className='color-input-group'>
        <Input
          id='color-input'
          label='Enter or pick a target color:'
          onChange={(v) => {
            setManualChange(false);
            setFormState({ ...formState, color: v });
          }}
          value={formState.color}
        />
        <Input
          id='color-picker'
          type='color'
          value={formState.color}
          onChange={(v) => {
            setManualChange(true);
            setFormState({ ...formState, color: v, sourceType: 'hexidecimal' });
          }}
        />
      </div>
      <fieldset className='radio-group'>
        <legend>Select the source color type:</legend>
        <Input
          id='radio-hexidecimal'
          checked={formState.sourceType === 'hexidecimal'}
          label='Hexidecimal'
          name='source-type'
          onChange={() => {
            setManualChange(true);
            setFormState({ ...formState, sourceType: 'hexidecimal' });
          }}
          type='radio'
        />
        <Input
          id='radio-rgb'
          checked={formState.sourceType === 'rgb'}
          label='RGB'
          name='source-type'
          onChange={() => {
            setManualChange(true);
            setFormState({ ...formState, sourceType: 'rgb' });
          }}
          type='radio'
        />
      </fieldset>
      <Button onClick={handleSubmit}>submit</Button>
      <div className='results-container' ref={resultsRef}>
        <div className='color-squares'>
          <div className='color-square'>
            <p className='color-square-text'>Target</p>
            <div
              className='raw-color'
              style={
                filterState
                  ? {
                      backgroundColor: `rgb(${filterState.result.rgb.r}, ${filterState.result.rgb.g}, ${filterState.result.rgb.b})`,
                    }
                  : undefined
              }
            />
          </div>
          <div className='color-square'>
            <div className='recolored-with-filter'>
              <img
                src={ReactLogo}
                className='react-svg'
                alt='React logo'
                style={filterState ? { filter: filterState.result.filterRaw } : undefined}
              />
            </div>
            <p className='color-square-text'>Filtered</p>
          </div>
        </div>
        {error && <p className='error-text'>{error}</p>}
        {filterState && (
          <div className='result-container'>
            <p className='result-text'>{filterState.result.filter}</p>
            <Button
              onClick={() => {
                navigator.clipboard.writeText(filterState.result.filter);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
            >
              {copied ? 'copied!' : 'copy'}
            </Button>
          </div>
        )}
      </div>
      <Modal
        content='This tool uses an SPSA optimization algorithm to generate a CSS filter value for a given target color. This allows developers (me) to easily recolor just about anything using only CSS!'
        buttonText='got it'
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}

/** Exports */

export default App;
