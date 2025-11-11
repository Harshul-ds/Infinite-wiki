/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

interface TemperatureSliderProps {
  value: number;
  onChange: (value: number) => void;
  disabled: boolean;
}

const TemperatureSlider: React.FC<TemperatureSliderProps> = ({ value, onChange, disabled }) => {
  return (
    <div className="temperature-slider-container">
      <label htmlFor="temperature-slider" className="slider-label">Factual</label>
      <input
        id="temperature-slider"
        type="range"
        min="0.1"
        max="1.0"
        step="0.1"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        disabled={disabled}
        className="temperature-slider"
        aria-label="Content temperature control. Lower is more factual, higher is more creative."
      />
      <label htmlFor="temperature-slider" className="slider-label">Creative</label>
    </div>
  );
};

export default TemperatureSlider;
