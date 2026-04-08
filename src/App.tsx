import { useState } from 'react';
import './App.css';
import { ControlPanel } from './components/ControlPanel';
import { ParticleSphere } from './components/ParticleSphere';
import { OutputProfile } from './components/OutputProfile';
import type { MoodSliders } from './lib/contentMap';

function App() {
  const [sliders, setSliders] = useState<MoodSliders>({
    calm_tense: 50,
    organic_synthetic: 50,
    entropy: 50,
    day_night: 50,
    intimate_open: 50,
    shape: 'sphere',
  });

  return (
    <div className="app-container">
      <div className="left-panel">
        <div className="header">
          <h1>Antigravity Mood Engine</h1>
          <p className="subtitle">Translate emotional qualities into a curated sonic atmosphere.</p>
        </div>

        <ControlPanel sliders={sliders} onChange={setSliders} />

        <div className="divider" />

        <OutputProfile sliders={sliders} />
      </div>

      <div className="right-panel">
        <ParticleSphere sliders={sliders} />
      </div>
    </div>
  );
}

export default App;
