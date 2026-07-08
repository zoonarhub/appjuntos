import React from 'react';
import { bairrosRJ } from '../../utils/bairrosRJ';

interface BairroSelectProps {
  value: string;
  onChange: (value: string) => void;
  municipality?: string;
  required?: boolean;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
}

const BairroSelect: React.FC<BairroSelectProps> = ({
  value,
  onChange,
  municipality = 'Rio de Janeiro',
  required = false,
  className = 'form-input',
  placeholder = 'Selecione o bairro',
  disabled = false,
  style,
}) => {
  const isRio = municipality?.toLowerCase() === 'rio de janeiro' || municipality?.toLowerCase().includes('rio');

  if (!isRio) {
    return (
      <input
        className={className}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        style={style}
      />
    );
  }

  return (
    <select
      className={className}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      disabled={disabled}
      style={style}
    >
      <option value="">Selecione o bairro</option>
      {bairrosRJ.map((bairro) => (
        <option key={bairro} value={bairro}>{bairro}</option>
      ))}
    </select>
  );
};

export default BairroSelect;
