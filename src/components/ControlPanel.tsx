import { CustomSlider } from './CustomSlider';
import type { MoodSliders } from '../lib/contentMap';
import './ControlPanel.css';

interface ControlPanelProps {
  sliders: MoodSliders;
  onChange: (sliders: MoodSliders) => void;
}

export function ControlPanel({ sliders, onChange }: ControlPanelProps) {
  const updateSlider = (key: keyof MoodSliders, value: number | string) => {
    onChange({ ...sliders, [key]: value });
  };

  return (
    <div className="control-panel">
      <CustomSlider 
        labelLeft="Calm" 
        labelRight="Tense" 
        value={sliders.calm_tense} 
        onChange={(v) => updateSlider('calm_tense', v)} 
      />
      <CustomSlider 
        labelLeft="Organic" 
        labelRight="Synthetic" 
        value={sliders.organic_synthetic} 
        onChange={(v) => updateSlider('organic_synthetic', v)} 
      />
      <CustomSlider 
        labelLeft="Order" 
        labelRight="Entropy" 
        value={sliders.entropy} 
        onChange={(v) => updateSlider('entropy', v)} 
      />
      <CustomSlider 
        labelLeft="Night" 
        labelRight="Day" 
        value={sliders.day_night} 
        onChange={(v) => updateSlider('day_night', v)} 
      />
      <CustomSlider 
        labelLeft="Warm" 
        labelRight="Cold" 
        value={sliders.intimate_open} 
        onChange={(v) => updateSlider('intimate_open', v)} 
      />

      <div className="shape-generator">
        <h4 className="shape-title">Shape Generator</h4>
        <div className="shape-chips">
          {[
            { id: 'sphere',   label: 'Sphere' },
            { id: 'mountain', label: 'Mountain' },
            { id: 'lsd',      label: 'LSD Molecule' },
            { id: 'wave',     label: 'Sea Wave' },
            { id: 'skyline',  label: 'Skyline' },
            { id: 'star',     label: 'Star' },
          ].map(s => (
            <button
              key={s.id}
              className={`shape-chip ${sliders.shape === s.id ? 'active' : ''}`}
              onClick={() => updateSlider('shape', s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
