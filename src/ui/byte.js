import {
  THEME,
  accent,
  accentStrong,
  danger,
  mergeColumns,
  muted,
  panel,
  success,
  text,
  truncateMiddle,
} from './theme.js';

const FRAME_DELAY = 100;

const FOX_STATES = {
  idle: {
    art: [
      ['    /\\_/\\    ', '   ( o.o ) ', '    > ^ <   '],
      ['   /\\_/\\    ', '  (  -  ) ', '   >  ^  <  '],
    ],
    eyes: '( o.o )',
    label: 'idle',
    status: 'waiting for your request',
  },
  thinking: {
    art: [
      ['    /\\_/\\    ', '   ( ??? ) ', '    > ? <   '],
      ['   /\\_/\\    ', '  ( ... ) ', '   >  ?  <  '],
    ],
    eyes: '( ?.? )',
    label: 'thinking',
    status: 'analyzing your request',
  },
  reading: {
    art: [
      ['    /\\_/\\    ', '   ( o_o ) ', '    > · <   '],
      ['   /\\_/\\    ', '  ( O_O ) ', '   >  ·  <  '],
    ],
    eyes: '( o_o )',
    label: 'reading',
    status: 'reading files',
  },
  tool: {
    art: [
      ['    /\\_/\\    ', '   ( >.< ) ', '    > ● <   '],
      ['   /\\_/\\    ', '  ( ⊙_⊙ ) ', '   >  ●  <  '],
    ],
    eyes: '( >.< )',
    label: 'tool',
    status: 'running commands',
  },
  working: {
    art: [
      ['    /\\_/\\    ', '   ( █_█ ) ', '    > ✓ <   '],
      ['   /\\_/\\    ', '  ( ██_ ) ', '   >  ✓  <  '],
    ],
    eyes: '( █_█ )',
    label: 'working',
    status: 'executing tasks',
  },
  success: {
    art: [
      ['    /\\_/\\    ', '   ( ^_^ ) ', '    > ◡ <   '],
      ['   /\\_/\\    ', '  ( ^∇^ ) ', '   >  ◡  <  '],
    ],
    eyes: '( ^_^ )',
    label: 'done',
    status: 'all tasks completed',
  },
  error: {
    art: [
      ['    /\\_/\\    ', '   ( X_X ) ', '    > ! <   '],
      ['   /\\_/\\    ', '  ( T_T ) ', '   >  !  <  '],
    ],
    eyes: '( X_X )',
    label: 'error',
    status: 'something went wrong',
  },
  greeting: {
    art: [
      ['    /\\_/\\    ', '   ( ◡◡ ) ', '    >◡◡<    '],
      ['   /\\_/\\    ', '  ( ◠◠ ) ', '   >◠◠<    '],
    ],
    eyes: '( ◡◡ )',
    label: 'ready',
    status: 'welcome!',
  },
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function pickFrame(frames, index) {
  return frames[index % Math.max(1, frames.length)] || [];
}

function wrapText(text, maxWidth = 32) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= maxWidth) {
      currentLine = (currentLine + ' ' + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);

  return lines.length > 0 ? lines : ['...'];
}

export class Byte {
  constructor(species = 'fox') {
    this.species = species;
    this.state = 'idle';
    this.message = '';
  }

  async show(state, message = '') {
    this.state = state;
    this.message = message;

    const foxState = FOX_STATES[state] || FOX_STATES.idle;
    const frameCount = foxState.art.length;

    if (!process.stdout.isTTY || frameCount < 2) {
      process.stdout.write(this.renderFrame(foxState, 0));
      return;
    }

    for (let i = 0; i < frameCount; i++) {
      process.stdout.write(this.renderFrame(foxState, i));
      if (i < frameCount - 1) {
        await sleep(FRAME_DELAY);
        process.stdout.write('\x1b[6A\x1b[J');
      }
    }
  }

  renderFrame(foxState, frameIndex) {
    const art = pickFrame(foxState.art, frameIndex);
    const statusText = this.message || foxState.status;
    const statusLines = wrapText(statusText, 30);

    const maxLen = Math.max(...statusLines.map(l => l.length), 4);
    const bubble = [
      '┌' + '─'.repeat(maxLen + 2) + '┐',
      ...statusLines.map(l => '│ ' + l.padEnd(maxLen) + ' │'),
      '└' + '─'.repeat(maxLen + 2) + '┘',
    ];

    const body = mergeColumns(art, [
      accentStrong('● ' + foxState.label),
      '',
      ...bubble.map(l => text(l)),
    ], { gap: 1, leftFormatter: accent });

    const content = [
      accent('  claude'),
      '',
      ...body,
    ].join('\n');

    const borderColor = this.state === 'error' ? THEME.error :
                        this.state === 'success' ? THEME.success :
                        THEME.frame;

    return '\n' + panel(content, {
      borderColor,
      margin: { top: 0, bottom: 1, left: 2, right: 2 }
    }) + '\n';
  }
}