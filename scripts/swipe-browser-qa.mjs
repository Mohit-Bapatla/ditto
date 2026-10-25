// Run through the Codex cua_repl browser API; no external browser driver.
// Pass a tab on the disposable swipe QA database, its CDP capability and a save callback.
export async function runSwipeBrowserQA(tab, cdp, save, screens = ['circle','discover']) {
  const results = [];
  const assert = (condition, message) => { if (!condition) throw Error(message); };
  const title = () => tab.playwright.evaluate(() => document.querySelector('.swipe-surface h2')?.textContent);
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
  const poll = async read => { const start=Date.now(); while(Date.now()-start<6000) { if(await read()) return true; await pause(40); } return false; };
  const settle = (before, changed) => poll(() => tab.playwright.evaluate(({before,changed}) => {
    const card=document.querySelector('.swipe-surface');
    const current=card?.querySelector('h2')?.textContent;
    return card?.getAttribute('data-swipe-phase')==='idle' && (changed ? current!==before : current===before);
  },{before,changed}));
  const bounds = () => tab.playwright.evaluate(() => {
    const r = document.querySelector('.swipe-surface').getBoundingClientRect();
    return {x:r.x+r.width/2, y:r.y+Math.min(100,r.height/3), width:r.width};
  });
  const undo = async before => {
    await tab.playwright.getByRole('button',{name:'Undo last swipe',exact:true}).click();
    assert(await settle(before,false),'Undo did not restore '+before);
    // Deliberately separate test gestures beyond the momentum quiet window.
    await pause(400);
  };
  const pointer = async (dx, touch=false, stepMs=20, steps=6) => {
    const b = await bounds();
    await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:touch,maxTouchPoints:1});
    if (touch) {
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:b.x,y:b.y}]});
      for(let i=1;i<=steps;i++) await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:b.x+dx*i/steps,y:b.y}]});
      await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    } else {
      await cdp.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:b.x,y:b.y});
      await pause(20);
      await cdp.send('Input.dispatchMouseEvent',{type:'mousePressed',x:b.x,y:b.y,button:'left',clickCount:1});
      for(let i=1;i<=steps;i++) { await cdp.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:b.x+dx*i/steps,y:b.y,button:'left',buttons:1}); await pause(stepMs); }
      await cdp.send('Input.dispatchMouseEvent',{type:'mouseReleased',x:b.x+dx,y:b.y,button:'left',clickCount:1});
    }
  };
  const wheel = async dx => {const b=await bounds(); await cdp.send('Input.dispatchMouseEvent',{type:'mouseWheel',x:b.x,y:b.y,deltaX:dx,deltaY:0});};
  for (const screen of screens) {
    if(screen==='discover') await tab.playwright.getByRole('button',{name:'Discover',exact:true}).click();
    for(const [name,gesture] of [
      ['mouse-right',()=>pointer(140)], ['mouse-left',()=>pointer(-140)],
      ['slow-right',()=>pointer(140,false,70)], ['slow-left',()=>pointer(-140,false,70)],
      ['flick-right',()=>pointer(60,false,8,3)], ['flick-left',()=>pointer(-60,false,8,3)],
      ['touch-right',()=>pointer(130,true)], ['touch-left',()=>pointer(-130,true)],
      ['keyboard-right',()=>tab.playwright.locator('.swipe-surface').press('ArrowRight')],
      ['keyboard-left',()=>tab.playwright.locator('.swipe-surface').press('ArrowLeft')],
      ['wheel-right',async()=>{await wheel(30);await wheel(70);}],
      ['wheel-left',async()=>{await wheel(-30);await wheel(-70);}],
    ]) {
      const before=await title();
      try { await gesture(); } catch(error) {
        await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:false});
        if(String(error).includes('method is not supported')) {results.push({screen,name,passed:false,unsupported:true});continue;}
        throw error;
      }
      assert(await settle(before,true),screen+' '+name+' failed: expected change from '+before+'; got '+await title());
      if(name.startsWith('wheel')) {
        const timing=await tab.playwright.evaluate(()=>document.querySelector('[data-swipe-timing]')?.getAttribute('data-swipe-timing'));
        const samples=JSON.parse(timing||'[]');
        assert(samples.length>2,'Missing animation measurements');
        const first=samples.find(s=>Math.abs(s.x-samples[0].x)>1);
        assert(first && first.t<80,'Exit paused after acceptance');
        await save(screen+'-'+name+'-timing.json',JSON.stringify(samples,null,2));
      }
      await undo(before); results.push({screen,name,passed:true}); await save('browser-results.json',JSON.stringify(results,null,2));
    }
    const before=await title();
    await pointer(12); assert(await settle(before,false),screen+' snapback failed');
    results.push({screen,name:'partial-snapback',passed:true});
    // Momentum and rapid input must not vote on the prepared next card.
    await wheel(140); assert(await settle(before,true),'initial wheel commit');
    const next=await title();
    for(let i=0;i<12;i++){await wheel(i%2 ? -30 : 30);await pause(20);}
    assert(await title()===next,'momentum advanced the next card');
    await undo(before);results.push({screen,name:'momentum-tail',passed:true});
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:600,downloadThroughput:-1,uploadThroughput:-1});
    await wheel(140);await pause(100);
    const moving=await tab.playwright.evaluate(()=>document.querySelector('.swipe-surface')?.getAttribute('style'));
    assert(moving?.includes('translateX'),'latency must not postpone animation');
    await wheel(-150);
    assert(await settle(before,true),'slow backend did not finish');
    await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});
    await undo(before);results.push({screen,name:'backend-latency',passed:true});
    await cdp.send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:-1,uploadThroughput:-1});
    await pointer(130);
    const failure=await poll(()=>tab.playwright.evaluate(()=>Boolean(document.querySelector('.swipe-failure') && document.querySelector('.swipe-surface')?.getAttribute('data-swipe-phase')==='idle')));
    await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});
    assert(failure && await title()===before,screen+' failed save must restore original card');
    await pointer(130);assert(await settle(before,true),'failed vote retry');await undo(before);
    results.push({screen,name:'offline-failure-and-retry',passed:true});
  }
  await save('browser-results.json',JSON.stringify(results,null,2));
  return results;
}
