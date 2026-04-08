import './CustomSlider.css';

interface CustomSliderProps {
  labelLeft: string;
  labelRight: string;
  value: number;
  onChange: (val: number) => void;
}

export function CustomSlider({ labelLeft, labelRight, value, onChange }: CustomSliderProps) {
  return (
    <div className="slider-container">
      <div className="slider-labels">
        <span className="slider-label">{labelLeft}</span>
        <span className="slider-label text-right">{labelRight}</span>
      </div>
      <div className="slider-wrapper">
        <input 
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="custom-range"
        />
        <div 
          className="slider-track-fill" 
          style={{ width: `${value}%` }} 
        />
      </div>
    </div>
  );
}
