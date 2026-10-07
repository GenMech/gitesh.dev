const controlNames = [
  'NUL', 'SOH', 'STX', 'ETX', 'EOT', 'ENQ', 'ACK', 'BEL',
  'BS', 'TAB', 'LF', 'VT', 'FF', 'CR', 'SO', 'SI',
  'DLE', 'DC1', 'DC2', 'DC3', 'DC4', 'NAK', 'SYN', 'ETB',
  'CAN', 'EM', 'SUB', 'ESC', 'FS', 'GS', 'RS', 'US',
];

function assertByte(value) {
  if (!Number.isInteger(value) || value < 0 || value > 255) {
    throw new RangeError('A byte must be an integer from 0 to 255.');
  }
}

export function describeByte(value) {
  assertByte(value);
  const ascii = value < 32 ? controlNames[value]
    : value === 32 ? 'Space'
    : value === 127 ? 'DEL'
    : value > 127 ? 'Non-ASCII'
    : String.fromCharCode(value);
  return {
    binary: value.toString(2).padStart(8, '0'),
    decimal: value,
    hex: `0x${value.toString(16).toUpperCase().padStart(2, '0')}`,
    ascii,
  };
}

export function toggleBit(value, bit) {
  assertByte(value);
  if (!Number.isInteger(bit) || bit < 0 || bit > 7) {
    throw new RangeError('A bit position must be an integer from 0 to 7.');
  }
  return value ^ (1 << bit);
}
