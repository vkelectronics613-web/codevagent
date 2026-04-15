#!/usr/bin/env node

import { Planner } from './src/ai/planner.js';

const planner = new Planner('csk-j283t68556ndfrrfmfxeh488wm8fw64cvj5vkrjewr5hnnrv');

async function test() {
  try {
    const plan = await planner.createPlan('make a todo app', { files: [] }, []);
    console.log('PLAN:', JSON.stringify(plan, null, 2));
  } catch(e) {
    console.error('ERROR:', e.message);
    console.error('Stack:', e.stack);
  }
}

test();
