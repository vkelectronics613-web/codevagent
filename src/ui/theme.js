import chalk from 'chalk';
import boxen from 'boxen';

export const THEME = {
  frame: '#8a5a3b',
  frameSoft: '#5f4130',
  orange: '#f08a5d',
  text: '#f4dfd3',
  dim: '#b69580',
  success: '#8ccf7e',
  error: '#ff8a7a',
};

export const accent = (value) => chalk.hex(THEME.orange)(value);
export const accentStrong = (value) => chalk.hex(THEME.orange).bold(value);
export const text = (value) => chalk.hex(THEME.text)(value);
export const muted = (value) => chalk.hex(THEME.dim)(value);
export const success = (value) => chalk.hex(THEME.success)(value);
export const danger = (value) => chalk.hex(THEME.error)(value);

export function panel(content, options = {}) {
  return boxen(content, {
    padding: options.padding ?? { top: 0, bottom: 0, left: 1, right: 1 },
    margin: options.margin ?? { top: 0, bottom: 1, left: 2, right: 2 },
    borderStyle: options.borderStyle ?? 'round',
    borderColor: options.borderColor ?? THEME.frame,
    backgroundColor: options.backgroundColor ?? 'black',
  });
}

export function padRight(value, width) {
  const plain = String(value ?? '');
  return plain.length >= width ? plain : plain + ' '.repeat(width - plain.length);
}

export function truncateMiddle(value, maxWidth = 48) {
  const plain = String(value ?? '');
  if (plain.length <= maxWidth) {
    return plain;
  }

  const start = Math.max(1, Math.floor((maxWidth - 3) / 2));
  const end = Math.max(1, maxWidth - start - 3);
  return `${plain.slice(0, start)}...${plain.slice(-end)}`;
}

export function mergeColumns(leftLines, rightLines, options = {}) {
  const gap = options.gap ?? 3;
  const width = options.leftWidth ?? Math.max(0, ...leftLines.map((line) => String(line ?? '').length));
  const leftFormatter = options.leftFormatter ?? ((line) => line);
  const height = Math.max(leftLines.length, rightLines.length);

  return Array.from({ length: height }, (_, index) => {
    const left = padRight(leftLines[index] ?? '', width);
    return `${leftFormatter(left)}${' '.repeat(gap)}${rightLines[index] ?? ''}`;
  });
}

export function keyValue(label, value) {
  return `${muted(padRight(label, 10))}${text(value)}`;
}
