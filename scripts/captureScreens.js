import http from 'http';
import fs from 'fs';
import { spawn } from 'child_process';

const packDir = '/media/fm9447/D/MULearn/Hackotberfest/screeens/argon_video_pack';

async function main() {
  const chrome = spawn('chromium-browser', [
    '--headless',
    '--disable-gpu',
    '--remote-debugging-port=9223',
    '--window-size=420,880',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  const WebSocket = (await import('ws')).default || global.WebSocket;

  const targets = await new Promise((res, rej) => {
    http.get('http://127.0.0.1:9223/json', (r) => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => res(JSON.parse(d)));
    }).on('error', rej);
  });

  const page = targets.find(t => t.type === 'page') || targets[0];
  const ws = new WebSocket(page.webSocketDebuggerUrl);

  let id = 1;
  const send = (method, params = {}) => new Promise((resolve) => {
    const curId = id++;
    const handler = (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.id === curId) {
        ws.off('message', handler);
        resolve(msg.result);
      }
    };
    ws.on('message', handler);
    ws.send(JSON.stringify({ id: curId, method, params }));
  });

  await new Promise(r => ws.on('open', r));
  await send('Page.enable');
  await send('Runtime.enable');

  // 1. Capture Login Screen
  await send('Page.navigate', { url: 'http://localhost:5173/' });
  await new Promise(r => setTimeout(r, 1500));
  const shot1 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(`${packDir}/01_login_screen.png`, Buffer.from(shot1.data, 'base64'));
  console.log('Saved 01_login_screen.png');

  // 2. Set JWT token in localStorage & reload to see Explore screen
  await send('Runtime.evaluate', {
    expression: "localStorage.setItem('jwt', 'dummy_hadhy_token'); location.reload();"
  });
  await new Promise(r => setTimeout(r, 2000));

  const shot2 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(`${packDir}/02_explore_canvas_screen.png`, Buffer.from(shot2.data, 'base64'));
  console.log('Saved 02_explore_canvas_screen.png');

  // 3. Open Profile Settings Modal (Click profile button)
  await send('Runtime.evaluate', {
    expression: "document.querySelector('header button img')?.parentElement?.click();"
  });
  await new Promise(r => setTimeout(r, 800));
  const shot3 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(`${packDir}/03_profile_settings_modal.png`, Buffer.from(shot3.data, 'base64'));
  console.log('Saved 03_profile_settings_modal.png');

  // Close modal
  await send('Runtime.evaluate', {
    expression: "document.querySelector('button.bg-\\\\[\\\\#0B3BF4\\\\]')?.click() || document.querySelector('header')?.click();"
  });
  await new Promise(r => setTimeout(r, 500));

  // 4. Navigate to AI Planner Tab (Click bottom nav 2nd tab)
  await send('Runtime.evaluate', {
    expression: "const btn = Array.from(document.querySelectorAll('nav button'))[1]; if (btn) btn.click();"
  });
  await new Promise(r => setTimeout(r, 1500));
  const shot4 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(`${packDir}/04_ai_planner_form.png`, Buffer.from(shot4.data, 'base64'));
  console.log('Saved 04_ai_planner_form.png');

  // 5. Trigger Generate Plans in AI Planner
  await send('Runtime.evaluate', {
    expression: "const genBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Generate') || b.textContent.includes('Plan')); if (genBtn) genBtn.click();"
  });
  await new Promise(r => setTimeout(r, 3500));
  const shot5 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(`${packDir}/05_ai_trail_itinerary_result.png`, Buffer.from(shot5.data, 'base64'));
  console.log('Saved 05_ai_trail_itinerary_result.png');

  // 6. Navigate to Add Spot Tab (3rd nav button)
  await send('Runtime.evaluate', {
    expression: "const btn = Array.from(document.querySelectorAll('nav button'))[2]; if (btn) btn.click();"
  });
  await new Promise(r => setTimeout(r, 1000));
  const shot6 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(`${packDir}/06_add_spot_community.png`, Buffer.from(shot6.data, 'base64'));
  console.log('Saved 06_add_spot_community.png');

  ws.close();
  chrome.kill();
  console.log('All screens successfully generated and saved!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
