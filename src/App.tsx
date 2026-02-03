import { useEffect, useState } from 'react';
import { Button, Input, Modal } from './components'
import './App.css'

/** Types */

type FormState = {
  color: string;
  sourceType: "hexidecimal" | "rgb";
}

/** The main app component. */
function App() {
  const [formState, setFormState] = useState<FormState>({
    color: "",
    sourceType: "hexidecimal",
  });
  const [manualChange, setManualChange] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Auto-update source type based on input, only if it wasn't manually changed
  useEffect(() => {
    if (manualChange) return;

    if ((formState.color).indexOf(",") !== -1) {
      setFormState(prev => prev.sourceType === "rgb" ? prev : {...prev, sourceType: "rgb"})
    } else if ((formState.color).indexOf("#") !== -1) {
      setFormState(prev => prev.sourceType === "hexidecimal" ? prev : {...prev, sourceType: "hexidecimal"})
    } 
  }, [formState])

  return (
    <div className="app-container">
      <div className="header-group">
        <h1 className="main-header">CSS Filter Generator</h1>
        <Button
          variant='funky'
          className="app-description-button"
          onClick={() => setIsModalOpen(true)}
        >
          What's this?
        </Button>
      </div>
      <Input 
        id="color-input"
        label="Enter a target color:"
        onChange={(v) => {
          setManualChange(false);
          setFormState({...formState, color: v});
        }}
        value={formState.color}
      />
      <fieldset className="radio-group">
        <legend>Select the source color type:</legend>
        <Input
          id="radio-hexidecimal"
          checked={formState.sourceType === "hexidecimal"}
          label="Hexidecimal"
          name="source-type"
          onChange={() => {
            setManualChange(true);
            setFormState({...formState, sourceType: "hexidecimal"});
          }}
          type="radio"
          />
        <Input
          id="radio-rgb"
          checked={formState.sourceType === "rgb"}
          label="RGB"
          name="source-type"
          onChange={() => {
            setManualChange(true);
            setFormState({...formState, sourceType: "rgb"});
          }}
          type="radio"
        />
      </fieldset>
      {/* <Input
        id="checkbox-input"
        checked={true}
        name="test"
        onChange={(v) => console.log(v)}
        type="checkbox"
      /> */}
      <Modal
        // title='CSS Filter Generator'
        content='This tool generates a CSS filter value for a given target color, allowing developers (me) or designers to easily recolor just about anything using only CSS!'
        buttonText='Got it'
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}

/** Exports */

export default App
