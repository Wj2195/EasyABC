"""TradeLens Online scheduled scanner. Experimental technical-only historical analogs."""
import os,time,json,math
from pathlib import Path
from datetime import datetime,timezone
import requests,numpy as np
ROOT=Path(__file__).resolve().parent
PAIRS='EUR/USD GBP/USD AUD/USD NZD/USD USD/JPY USD/CHF USD/CAD EUR/GBP EUR/JPY EUR/CHF EUR/AUD EUR/CAD EUR/NZD GBP/JPY GBP/CHF GBP/AUD GBP/CAD GBP/NZD AUD/JPY AUD/CHF AUD/CAD AUD/NZD NZD/JPY NZD/CHF NZD/CAD CAD/JPY CAD/CHF CHF/JPY'.split()
SECS={'1h':3600,'15m':900,'1d':86400}
def iso(t=None):return datetime.fromtimestamp(t or time.time(),timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
def get_json(p,default):return json.loads(p.read_text()) if p.exists() else default
def save(p,obj):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(obj,indent=2,allow_nan=False)+'\n')
def symbol(p):
    a,b=p.split('/')
    return (b if a=='USD' else a+b)+'=X'
def bars(p,tf,s,now):
    url='https://query1.finance.yahoo.com/v8/finance/chart/'+symbol(p)
    r=s.get(url,params={'interval':tf,'range':'1mo' if tf=='15m' else '3mo' if tf=='1h' else '5y'},headers={'User-Agent':'Mozilla/5.0'},timeout=22);r.raise_for_status()
    result=r.json().get('chart',{}).get('result') or []
    if not result:raise ValueError('No data')
    v=result[0];got=v.get('meta',{}).get('symbol','').upper()
    if got not in {symbol(p).upper(),p.replace('/','')+'=X'}:raise ValueError('Symbol mismatch')
    q=v['indicators']['quote'][0];out=[]
    for i,t in enumerate(v['timestamp']):
        try:
            o,h,l,c=(float(q[k][i]) for k in ('open','high','low','close'))
            if not all(map(math.isfinite,(o,h,l,c))) or o<=0 or l<=0 or h<max(o,c) or l>min(o,c):continue
            if t+SECS[tf]<=now:out.append({'t':int(t),'o':o,'h':h,'l':l,'c':c})
        except (KeyError,TypeError,ValueError,IndexError):continue
    if len(out)<260:raise ValueError('Insufficient completed candles')
    return out[-1500:]
def ema(a,n):
    result=np.empty_like(a);result[0]=a[0];alpha=2/(n+1)
    for i in range(1,len(a)):result[i]=result[i-1]+alpha*(a[i]-result[i-1])
    return result
def calc(candles,horizon):
    n=len(candles);cl=np.array([x['c'] for x in candles]);hi=np.array([x['h'] for x in candles]);lo=np.array([x['l'] for x in candles])
    e20,e50=ema(cl,20),ema(cl,50);s200=np.convolve(cl,np.ones(200)/200,'full')[:n];s20=np.convolve(cl,np.ones(20)/20,'full')[:n]
    macd=ema(cl,12)-ema(cl,26);hist=macd-ema(macd,9)
    tr=np.maximum(hi-lo,np.maximum(abs(hi-np.r_[cl[0],cl[:-1]]),abs(lo-np.r_[cl[0],cl[:-1]])))
    atr=ema(tr,27);atr=np.maximum(atr,cl*1e-8)
    change=np.diff(cl,prepend=cl[0]);up=ema(np.maximum(change,0),27);down=ema(np.maximum(-change,0),27)
    rsi=100-100/(1+up/np.maximum(down,1e-12))
    roc=(cl-np.r_[cl[:10],cl[:-10]])/atr
    f=np.empty((n,9));f[:,0]=np.clip((e20-e50)/atr/3,-1,1);f[:,1]=np.clip((cl-s200)/atr/6,-1,1);f[:,2]=rsi/50-1;f[:,3]=np.clip(hist/atr,-1,1)
    for i in range(n):
        start=max(0,i-19);std=np.std(cl[start:i+1]);l=np.min(lo[max(0,i-50):i+1]);h=np.max(hi[max(0,i-50):i+1])
        f[i,4]=np.clip(abs(e20[i]-e50[i])/atr[i]/3,0,1)
        f[i,5]=np.clip((cl[i]-s20[i])/(max(std,1e-12)*4),-1,1)
        f[i,6]=np.clip(roc[i]/5,-1,1)
        f[i,7]=np.clip(atr[i]/cl[i]*20,0,1)
        f[i,8]=np.clip(2*((cl[i]-l)/max(h-l,1e-12)) -1,-1,1)
    t=n-1;samples=[];count=[0,0,0]
    for i in range(t-horizon-1,198,-horizon):
        move=(cl[i+horizon]-cl[i])/atr[i];bound=.35*math.sqrt(horizon)
        label=2 if move>bound else 0 if move< -bound else 1
        count[label]+=1;samples.append((float(np.sum((f[t]-f[i])**2)),label))
    if len(samples)<45:raise ValueError('Insufficient analog samples')
    k=min(50,max(20,math.isqrt(len(samples))*3));near=sorted(samples)[:k]
    probs=[8*(x+1)/(len(samples)+3) for x in count]
    for _,label in near:probs[label]+=1
    probs=[100*x/(k+8) for x in probs]
    dn,side,up=probs
    return dict(up=round(up,3),down=round(dn,3),sideways=round(side,3),bias='BUY' if up>dn else 'SELL' if dn>up else 'TIE',signal=round(max(up,dn),3),gap=round(abs(up-dn),3),direction_leads=max(up,dn)>side,price=float(cl[-1]))
def scan():
    now=time.time();cfg=get_json(ROOT/'config.json',{});state=get_json(ROOT/'state/state.json',{'run_index':0,'last_alerts':{}});snap=get_json(ROOT/'data/snapshot.json',{'rows':{}})
    watch=cfg.get('watchlist',[]);others=[p for p in PAIRS if p not in watch];index=int(state.get('run_index',0));batch=int(cfg.get('batch_size',7))
    target=list(dict.fromkeys(watch+[others[(index*batch+i)%len(others)] for i in range(min(batch,len(others)))]))
    rows={p:snap.get('rows',{}).get(p,{'pair':p,'ready':False,'status':'Pending'}) for p in PAIRS};hist=state.get('history',[]);errors=[];sent=0
    token=os.getenv('TELEGRAM_BOT_TOKEN','');chat=os.getenv('TELEGRAM_CHAT_ID','')
    with requests.Session() as session:
        for p in target:
            try:
                c=bars(p,cfg['interval'],session,now);res=calc(c,int(cfg['horizon']));t=c[-1]['t'];stale=not (-60<=now-t-SECS[cfg['interval']]<=max(7200,2*SECS[cfg['interval']]))
                row=dict(res,pair=p,ready=True,status='Old / closed' if stale else 'Updated',candle_time=iso(t),candle_epoch=t,candles=[{'t':v['t'],'o':v['o'],'h':v['h'],'l':v['l'],'c':v['c']} for v in c[-60:]])
                rows[p]=row
                if stale or not res['direction_leads'] or res['signal']<cfg['min_signal'] or res['gap']<cfg['min_gap'] or not token or not chat:continue
                fingerprint=f"{t}:{res['bias']}:{cfg['interval']}"
                if state.setdefault('last_alerts',{}).get(p)==fingerprint:continue
                confirmed=True
                for tf in cfg.get('confirm_timeframes',[]):
                    cc=bars(p,tf,session,now);result=calc(cc,int(cfg['horizon']))
                    if result['bias']!=res['bias'] or not result['direction_leads'] or not (-60<=now-cc[-1]['t']-SECS[tf]<=max(7200,2*SECS[tf])):confirmed=False;break
                if not confirmed:continue
                msg=f"TradeLens {res['bias']} WATCH\n{p} / {cfg['interval']}\nSignal {res['signal']:.1f}% / gap {res['gap']:.1f} points\nUP {res['up']:.1f}%, DOWN {res['down']:.1f}%\nIndicative price {res['price']:.5f}\nClosed candle {iso(t)} UTC\nTechnical experimental alert. Not win rate. Confirm spread/news/risk."
                try:
                    rr=session.post('https://api.telegram.org/bot'+token+'/sendMessage',json={'chat_id':chat,'text':msg},timeout=15);rr.raise_for_status()
                    if rr.json().get('ok'):
                        sent+=1;state['last_alerts'][p]=fingerprint;hist.append(dict(pair=p,bias=res['bias'],signal=res['signal'],at=iso(now)))
                except (requests.RequestException,ValueError):errors.append(p+': Telegram delivery unavailable')
            except (ValueError,KeyError,TypeError,requests.RequestException) as ex:
                errors.append(p+': '+str(ex)[:100]);rows[p]={**rows[p], 'ready':False,'status':'Unavailable','last_error':str(ex)[:100]}
            time.sleep(.6)
    state['run_index']=index+1;state['history']=hist[-100:]
    output=dict(app='TradeLens Online',version='1.0.0',updated_at=iso(now),rows=rows,history=hist[-50:],settings=cfg,status=dict(pairs_checked_this_run=len(target),errors=errors[:28],alerts_sent=sent,telegram_configured=bool(token and chat)),provider='Unofficial Yahoo Finance',model='Experimental nine-factor historical analog approximation')
    save(ROOT/'state/state.json',state);save(ROOT/'data/snapshot.json',output)
    print('Scanned',len(target),'errors',len(errors),'sent',sent)
if __name__=='__main__':scan()
