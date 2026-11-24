const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {execFileSync}=require('node:child_process');

const source=fs.readFileSync(path.join(__dirname,'index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
const NOW=Date.parse('2026-11-24T06:20:00Z');
const pairs=Object.keys(JSON.parse(fs.readFileSync(path.join(__dirname,'data/snapshot.json'),'utf8')).rows);
function fixture(){
  const rows={};
  for(const pair of pairs){
    const timeframes={};
    for(const [tf,start]of Object.entries({'15m':NOW/1000-1200,'1h':NOW/1000-4800,'1d':Date.parse('2026-11-23T00:00:00Z')/1000})){
      timeframes[tf]={status:'Updated',candle_epoch:start,candle_time:new Date(start*1000).toISOString(),
        candles:[{t:start-900,o:1,h:1.2,l:.9,c:1.1},{t:start,o:1.1,h:1.3,l:1,c:1.2}],
        forecasts:Object.fromEntries([1,3,6,12].map(h=>[h,{bias:'BUY',up:30,down:20,sideways:50,signal:30,gap:10,top_outcome:'SIDEWAYS'}])),
        validation:{}};
    }
    rows[pair]={timeframes,alignments:Object.fromEntries([1,3,6,12].map(h=>[h,{bias:'BUY',aligned:true}])),
      full_alignment:{bias:'BUY',agreement:12,eligible:true,low_strength:true,reason:'Sideways exceeds directional score'}};
  }
  return {updated_at:new Date(NOW).toISOString(),rows,settings:{alert_rule:'at_least_10_of_12'},
    status:{pairs_checked_this_run:28,errors:[]},history:[],
    news:{usable:true,status:'Updated',checked_at:new Date(NOW).toISOString(),events:[],history:[]}};
}
function harness(snapshot=fixture()){
  let now=NOW;const nodes={},timers=[];
  class Clock extends Date{constructor(...args){super(...(args.length?args:[now]))}static now(){return now}}
  const document={getElementById(id){return nodes[id]??={value:id==='filterState'?'all':'',innerHTML:'',textContent:'',
    addEventListener(){},querySelectorAll(){return []}}}};
  const context={document,Date:Clock,AbortController,setTimeout(){return 1},clearTimeout(){},
    setInterval(cb,delay){timers.push({cb,delay})},fetch:()=>new Promise(()=>{})};
  vm.createContext(context);vm.runInContext(source,context);
  vm.runInContext('snapshot='+JSON.stringify(snapshot)+';render()',context);
  return {nodes,context,timers,run:code=>vm.runInContext(code,context),setNow:value=>{now=value}};
}

test('fresh data renders scores, sideways outcome and low-strength qualification',()=>{
  const h=harness();
  assert.equal(h.nodes.status.textContent,'Snapshot current');
  assert.equal(h.nodes.strongCount.textContent,28);
  assert.match(h.nodes.pairBadge.textContent,/Low strength/);
  assert.match(h.nodes.matrix.innerHTML,/SIDEWAYS/);
  assert.match(h.nodes.matrix.innerHTML,/30.0%/);
  assert.doesNotMatch(h.nodes.validation.innerHTML,/—%/);
});

test('data expires on the render timer while fetch is stalled',()=>{
  const h=harness();h.setNow(NOW+1801000);
  h.timers.find(t=>t.delay===30000).cb();
  assert.equal(h.nodes.status.textContent,'Snapshot stale');
  assert.equal(h.nodes.strongCount.textContent,0);
  assert.match(h.nodes.dataHealth.textContent,/0\/28 pairs current/);
  assert.match(h.nodes.matrix.innerHTML,/STALE/);
  assert.doesNotMatch(h.nodes.matrix.innerHTML,/30.0%|SIDEWAYS/);
  assert.match(h.nodes.chartNote.textContent,/Historical chart only/);
  assert.doesNotMatch(h.nodes.chartNote.textContent,/Updated/);
});

test('lagging daily candle cannot qualify and receives a stale label',()=>{
  const s=fixture();s.rows['EUR/USD'].timeframes['1d'].candle_epoch=Date.parse('2026-11-20T00:00:00Z')/1000;
  const h=harness(s);
  assert.equal(h.nodes.status.textContent,'Partial / stale candles');
  assert.match(h.nodes.dataHealth.textContent,/27\/28 pairs current/);
  assert.equal(h.run("fullConsensus('EUR/USD').eligible"),false);
  assert.match(h.nodes.matrix.innerHTML,/Stale candle/);
});

test('failed refresh retains cached data and recovery clears the failure',async()=>{
  const h=harness();h.context.fetch=async()=>{throw Error('offline')};
  await h.run('load()');
  assert.match(h.nodes.status.textContent,/Refresh failed/);
  assert.match(h.nodes.dataHealth.textContent,/offline/);
  h.context.fetch=async()=>({ok:true,json:async()=>fixture()});
  await h.run('load()');
  assert.equal(h.nodes.status.textContent,'Snapshot current');
  h.context.fetch=async()=>({ok:true,json:async()=>({updated_at:'invalid'})});
  await h.run('load()');
  assert.match(h.nodes.dataHealth.textContent,/Invalid snapshot/);
  assert.match(h.nodes.matrix.innerHTML,/30.0%/);
});

test('news expiry, rolling 24-hour limit and missed warnings remain distinct',()=>{
  const s=fixture();s.news.events=[1,25].map(hours=>({epoch:NOW/1000+hours*3600,pairs:['EUR/USD'],title:'Future '+hours,currency:'USD',impact:'High',at:new Date(NOW+hours*3600000).toISOString()}));
  s.news.missed_warnings=[{currency:'USD',title:'Past release',at:new Date(NOW-3600000).toISOString()}];
  const h=harness(s);
  assert.equal(h.run('liveNews().length'),1);
  assert.match(h.nodes.newsHistory.innerHTML,/MISSED WARNING/);
  assert.match(h.nodes.dataHealth.textContent,/1 news warnings missed/);
  h.setNow(NOW+10801000);h.run('render()');
  assert.equal(h.run('liveNews().length'),0);
  assert.equal(h.nodes.newsStatus.textContent,'Unavailable / stale');
});

test('Python and dashboard freshness policies agree on weekday, DST and expiry boundaries',()=>{
  const cases=[
    ['2026-11-20T00:00:00Z','1d','2026-11-23T22:16:00Z'],
    ['2026-11-19T00:00:00Z','1d','2026-11-23T22:16:00Z'],
    ['2026-11-20T00:00:00Z','1d','2026-11-22T12:00:00Z'],
    ['2026-11-20T00:00:00Z','1d','2026-11-24T01:59:59Z'],
    ['2026-11-20T00:00:00Z','1d','2026-11-24T02:00:00Z'],
    ['2026-11-23T00:00:00Z','1d','2026-11-24T02:00:00Z'],
    ['2026-07-05T23:00:00Z','1d','2026-07-07T06:00:00Z'],
    ['2026-07-05T22:59:59Z','1d','2026-07-07T06:00:00Z'],
    ['2026-11-24T05:00:00Z','15m','2026-11-24T05:45:00Z'],
    ['2026-11-24T05:00:00Z','15m','2026-11-24T05:45:01Z'],
    ['2026-11-24T05:00:00Z','1h','2026-11-24T08:00:00Z'],
    ['2026-11-24T05:00:00Z','1h','2026-11-24T08:00:01Z']
  ].map(([start,tf,now])=>[Date.parse(start)/1000,tf,Date.parse(now)/1000]);
  const python=JSON.parse(execFileSync('python',['-c',
    'import json,sys;from freshness import is_fresh;print(json.dumps([is_fresh(*x) for x in json.load(sys.stdin)]))'],
    {cwd:__dirname,input:JSON.stringify(cases),encoding:'utf8'}));
  const h=harness();assert.deepEqual(cases.map(c=>h.run('candleFresh(...'+JSON.stringify(c)+')')),python);
});
