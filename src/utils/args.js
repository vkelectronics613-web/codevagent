export function parseArgs(argv) {
  let path = null;
  const flags = {};

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const val = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true;
      flags[key] = val;
      if (val !== true) i++;
    } else if (!path && !arg.startsWith('-')) {
      path = arg;
    }
  }

  return { path, flags };
}
