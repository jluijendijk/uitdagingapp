
import {useEffect,useMemo,useRef,useState} from 'react';
import {Home,Map,Star,Backpack,Volume2,Lock,ChevronLeft,RotateCcw,Sparkles,Settings} from 'lucide-react';
import {challenges,Challenge,Category} from './data';
import './style.css';

const worlds:{id:Category,name:string,tag:string,icon:string}[]=[
{id:'lees',name:'Leesland',tag:'Zoem, lees en ontdek',icon:'📖'},{id:'taal',name:'Taaljungle',tag:'Speel met woorden',icon:'🔤'},
{id:'reken',name:'Rekenrijk',tag:'Tel, denk en probeer',icon:'🔢'},{id:'puzzel',name:'Puzzelplaneet',tag:'Kraak slimme puzzels',icon:'🧩'},
{id:'speur',name:'Speurwereld',tag:'Kijk als een detective',icon:'🔎'},{id:'maak',name:'Maakstudio',tag:'Bedenk en bouw',icon:'🎨'},
{id:'plus',name:'Pluswereld',tag:'Extra pittig — proberen mag!',icon:'⭐+'}];
type Progress={done:string[],weeklyDone:string[],stars:number,week:string,collection:string[],counts:Record<string,number>,attempts:Record<string,number>,correct:Record<string,number>,settings:{goal:number,enabled:Record<Category,boolean>,readLevel:number,mathLevel:number},intro:boolean};
const blank=():Progress=>({done:[],weeklyDone:[],stars:0,week:weekKey(),collection:[],counts:{},attempts:{},correct:{},settings:{goal:5,enabled:{lees:true,taal:true,reken:true,puzzel:true,speur:true,maak:true,plus:true},readLevel:2,mathLevel:2},intro:false});
function weekKey(){const d=new Date(),onejan=new Date(d.getFullYear(),0,1);return `${d.getFullYear()}-${Math.ceil((((d.getTime()-onejan.getTime())/86400000)+onejan.getDay()+1)/7)}`}
const collectables=['🦕','🚀','🐳','🏰','🦊','🪐','🚂','🦄','🐙','🦖','🐬','🚁'];
const collectionNames:Record<string,string>={'🦕':'Dino','🚀':'Raket','🐳':'Walvis','🏰':'Kasteel','🦊':'Vos','🪐':'Planeet','🚂':'Trein','🦄':'Eenhoorn','🐙':'Octopus','🦖':'T-rex','🐬':'Dolfijn','🚁':'Helikopter'};
const levelName=(n:number)=>n===1?'Ontdekker':n===2?'Speurneus':n===3?'Uitdager':'PLUS';
const levelMark=(n:number)=>n===1?'★':n===2?'★★':n===3?'★★★':'◆';
const praise=['Yes! Goed gevonden!','Super!','Dat heb jij slim opgelost!','Yes, gelukt!','Goed gekeken!'];


export default function App(){
 const [p,setP]=useState<Progress>(()=>{try{const x={...blank(),...(JSON.parse(localStorage.getItem('uitdagingapp')||'null')||{})};x.weeklyDone=x.weeklyDone||[];x.attempts=x.attempts||{};x.correct=x.correct||{};if(x.week!==weekKey()){x.week=weekKey();x.stars=0;x.weeklyDone=[];x.counts={}}return x}catch{return blank()}});
 const [page,setPage]=useState<'home'|'worlds'|'stars'|'collection'|'parent'>('home'); const [world,setWorld]=useState<Category|null>(null); const [active,setActive]=useState<Challenge|null>(null);
 const [feedback,setFeedback]=useState(''); const [tries,setTries]=useState(0); const [typed,setTyped]=useState(''); const [intro,setIntro]=useState(p.intro?4:0); const hold=useRef<number|undefined>(undefined);
 useEffect(()=>localStorage.setItem('uitdagingapp',JSON.stringify(p)),[p]);
 useEffect(()=>{if('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(()=>{})},[]);
 const complete=(item:Challenge)=>{
   let reward='';
   setP(x=>{
     const freshWeek=!x.weeklyDone.includes(item.id);
     const freshEver=!x.done.includes(item.id);
     const newStars=x.stars+(freshWeek?1:0);
     const unlockCount=Math.floor(newStars/5);
     const nextCollection=collectables.slice(0,Math.min(collectables.length,Math.max(x.collection.length,unlockCount)));
     if(nextCollection.length>x.collection.length) reward=nextCollection[nextCollection.length-1];
     return {...x,
       done:freshEver?[...x.done,item.id]:x.done,
       weeklyDone:freshWeek?[...x.weeklyDone,item.id]:x.weeklyDone,
       stars:newStars,
       counts:{...x.counts,[item.category]:(x.counts[item.category]||0)+(freshWeek?1:0)},
       correct:{...x.correct,[item.category]:(x.correct[item.category]||0)+1},
       collection:nextCollection
     };
   });
   setFeedback(`${item.plus?'Mooi geprobeerd én opgelost! Dat was een echte PLUS-uitdaging.':praise[Math.floor(Math.random()*praise.length)]}${reward?' Nieuw ontdekt: '+reward:''}`);
 };
 const answer=(v:string)=>{
   if(!active)return;
   if(v.trim().toLowerCase()===(active.answer||'').trim().toLowerCase()){complete(active);return;}
   const n=tries+1; setTries(n);
   setP(x=>({...x,attempts:{...x.attempts,[active.id]:(x.attempts[active.id]||0)+1}}));
   setFeedback(active.plus
     ?(n>=2?'Deze is extra lastig. Bekijk het hulpje of kies even iets anders.':'Goede poging! Een PLUS-opdracht mag lastig zijn.')
     :(n>=2?`Hier is een klein hulpje: ${active.hint}`:['Hmm… kijk nog eens goed.','Bijna! Probeer nog eens.'][n-1]));
 };
 const choose=(cat:Category)=>{setWorld(cat);setPage('worlds');setActive(null);setFeedback('')};
 const start=(ch:Challenge)=>{setActive(ch);setFeedback('');setTries(0);setTyped('')};
 const list=useMemo(()=>world?challenges.filter(x=>x.category===world):[],[world]);
 const suggested=useMemo(()=>{
   let pool=challenges.filter(x=>p.settings.enabled[x.category]&&!p.done.includes(x.id));
   if(!pool.length) pool=challenges.filter(x=>p.settings.enabled[x.category]);
   const target=(cat:Category)=>cat==='plus'?4:cat==='lees'?p.settings.readLevel:cat==='reken'?p.settings.mathLevel:2;
   return [...pool].sort((a,b)=>Math.abs(a.level-target(a.category))-Math.abs(b.level-target(b.category)) || Math.random()-.5).slice(0,3)
 },[p.done.length,p.settings]);
 const speak=(t:string)=>{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang='nl-NL';u.rate=.72;speechSynthesis.speak(u)};
 const resetNav=()=>{setActive(null);setWorld(null)};
 if(intro<4)return <div className="intro"><div className="introCard"><div className="mascot">✦</div><h1>{['Welkom in jouw UitdagingApp!','Kies zelf wat jij wilt ontdekken.','Verzamel sterren','Klaar? Kies jouw eerste wereld!'][intro]}</h1>{intro===2&&<div className="bigstars">★ ★ ★ ★ ★</div>}{intro===3&&<div className="introWorlds">📖 🔤 🔢 🧩 🔎 🎨 ◆</div>}<p>{['Hier vind je korte, leuke uitdagingen.','Lezen, puzzelen, rekenen, speuren of iets maken — jij kiest.','Vijf sterren in een week is mooi meegenomen. Meer mag, maar hoeft niet.','Jij kiest waar je begint. Veel plezier!'][intro]}</p><button className="primary" onClick={()=>{if(intro===3){setIntro(4);setP(x=>({...x,intro:true}))}else setIntro(x=>x+1)}}>{intro===3?'Start ontdekken':'Verder'}</button></div></div>;
 return <div className="app">
  <header><button className="brand" onClick={()=>{setPage('home');resetNav()}}><span className="logo">✦</span><span><b>Mijn UitdagingApp</b><small>kiezen • ontdekken • proberen</small></span></button><button className="parentLock" aria-label="Oudergedeelte, 3 seconden vasthouden" onPointerDown={()=>hold.current=window.setTimeout(()=>setPage('parent'),3000)} onPointerUp={()=>clearTimeout(hold.current)} onPointerLeave={()=>clearTimeout(hold.current)}><Lock size={20}/></button></header>
  <main>
   {page==='home'&&<><section className="hero"><div><span className="eyebrow">JOUW UITDAGINGENKAST</span><h1>Waar heb jij vandaag zin in?</h1><p>Kies zelf een wereld. Niets hoeft op volgorde.</p></div><div className="weekMini"><span>Mijn week</span><div>{Array.from({length:p.settings.goal},(_,i)=><span key={i}>{i<p.stars?'⭐':'☆'}</span>)}</div><small>{p.stars>=p.settings.goal?'Weekuitdaging gehaald! 🎉':`Kun jij deze week ${p.settings.goal} uitdagingen halen?`}</small></div></section>
   <h2>Werelden</h2><div className="worldGrid">{worlds.filter(w=>p.settings.enabled[w.id]).map(w=><button key={w.id} className={`world ${w.id}`} onClick={()=>choose(w.id)}><span className="worldIcon">{w.icon}</span><span><b>{w.name}</b><small>{w.tag}</small></span><span className="go">›</span></button>)}</div>
   <h2>Misschien leuk voor jou</h2><div className="suggest">{suggested.map(ch=><button key={ch.id} onClick={()=>{choose(ch.category);start(ch)}}><span>{worlds.find(w=>w.id===ch.category)?.icon}</span><b>{ch.title}</b><small>{ch.instruction}</small></button>)}</div></>}
   {page==='worlds'&&!active&&<>{world?<><button className="back" onClick={resetNav}><ChevronLeft/> Alle werelden</button><div className={`worldHead ${world}`}><span>{worlds.find(w=>w.id===world)?.icon}</span><div><h1>{worlds.find(w=>w.id===world)?.name}</h1><p>{worlds.find(w=>w.id===world)?.tag}</p></div></div><div className="challengeGrid">{list.map(ch=><button key={ch.id} className={`challengeCard ${p.done.includes(ch.id)?'done':''}`} onClick={()=>start(ch)}><div className="cardMeta"><span className="tiny">{ch.subcategory}</span><span className="levelPill">{levelName(ch.level)}</span></div><b>{ch.title}</b><small>{ch.instruction}</small><span className="cardGo">{p.done.includes(ch.id)?'⭐':'Start ›'}</span></button>)}</div></>:<><h1>Kies een wereld</h1><div className="worldGrid">{worlds.filter(w=>p.settings.enabled[w.id]).map(w=><button key={w.id} className={`world ${w.id}`} onClick={()=>choose(w.id)}><span className="worldIcon">{w.icon}</span><span><b>{w.name}</b><small>{w.tag}</small></span></button>)}</div></>}</>}
   {page==='worlds'&&active&&<ChallengeView ch={active} feedback={feedback} typed={typed} setTyped={setTyped} answer={answer} complete={()=>complete(active)} speak={speak} onBack={()=>setActive(null)} onNext={()=>{const candidates=list.filter(x=>x.id!==active.id);start(candidates[Math.floor(Math.random()*candidates.length)])}} onOther={()=>{setActive(null);setWorld(null);setPage('home')}}/>}
   {page==='stars'&&<section className="panel"><span className="eyebrow">MIJN WEEK</span><h1>Jouw sterren</h1><div className="hugeStars">{Array.from({length:p.settings.goal},(_,i)=><span key={i}>{i<p.stars?'⭐':'☆'}</span>)}</div><h2>{p.stars>=p.settings.goal?'🎉 Weekuitdaging gehaald!':`${p.stars} van ${p.settings.goal} sterren`}</h2><p>Je mag natuurlijk doorgaan als je daar zin in hebt.</p></section>}
   {page==='collection'&&<section className="panel"><span className="eyebrow">MIJN VERZAMELING</span><h1>Wat heb jij al ontdekt?</h1><p>Af en toe verschijnt er zomaar iets nieuws als je uitdagingen doet.</p><div className="collection">{collectables.map(x=><div className={p.collection.includes(x)?'unlocked':'locked'} key={x}><span>{p.collection.includes(x)?x:'?'}</span><small>{p.collection.includes(x)?collectionNames[x]:'Nog geheim'}</small></div>)}</div></section>}
   {page==='parent'&&<Parent p={p} setP={setP} close={()=>setPage('home')}/>}
  </main>
  {page!=='parent'&&<nav><button className={page==='home'?'on':''} onClick={()=>{setPage('home');resetNav()}}><Home/><span>Home</span></button><button className={page==='worlds'?'on':''} onClick={()=>{setPage('worlds');resetNav()}}><Map/><span>Werelden</span></button><button className={page==='stars'?'on':''} onClick={()=>setPage('stars')}><Star/><span>Mijn sterren</span></button><button className={page==='collection'?'on':''} onClick={()=>setPage('collection')}><Backpack/><span>Verzameling</span></button></nav>}
 </div>
}
function ChallengeView({ch,feedback,typed,setTyped,answer,complete,speak,onBack,onNext,onOther}:{ch:Challenge,feedback:string,typed:string,setTyped:(s:string)=>void,answer:(s:string)=>void,complete:()=>void,speak:(s:string)=>void,onBack:()=>void,onNext:()=>void,onOther:()=>void}){
 const success=feedback.includes('Yes')||feedback.includes('Super')||feedback.includes('slim')||feedback.includes('Goed gekeken');
 return <section className="challenge"><button className="back" onClick={onBack}><ChevronLeft/> Terug</button><div className={`challengeTop ${ch.category}`}><div className="challengeMeta"><span className="eyebrow">{ch.plus?'💎 PLUSUITDAGING':ch.subcategory.toUpperCase()}</span><span className="levelPill">{levelName(ch.level)}</span></div><h1>{ch.title}</h1><p>{ch.instruction}</p></div><div className="task"><div className="visual">{ch.visual}</div><h2>{ch.question}</h2><TouchPlay ch={ch} answer={answer} success={success}/>{ch.category==='reken'&&<NumberPlay text={ch.question}/>} {ch.category==='lees'&&<button className="sound" onClick={()=>speak(ch.question)}><Volume2/> Zoem mee</button>}
 {ch.answerType==='choice'&&<div className="answers tactile">{ch.options?.map(o=><button disabled={success} key={o} onClick={()=>answer(o)}><span>{o}</span></button>)}</div>}
 {ch.answerType==='text'&&<div className="typeRow"><input value={typed} onChange={e=>setTyped(e.target.value)} placeholder="Typ hier…" autoCapitalize="none"/><button onClick={()=>answer(typed)}>Kijk!</button></div>}
 {ch.answerType==='self'&&<><div className="makePrompt"><span>💡</span><p>Jij bepaalt hoe het eruitziet. Er is niet één goed antwoord.</p></div><button className="primary big" onClick={complete}>★ IK HEB HET GEDAAN!</button></>}
 {feedback&&<div className={`feedback ${success?'yay':''}`}><Sparkles/>{feedback}</div>}
 {success&&<div className="after"><button onClick={onNext}>Nog eentje <RotateCcw/></button><button onClick={onOther}>Iets anders kiezen</button></div>}</div></section>
}


function TouchPlay({ch,answer,success}:{ch:Challenge,answer:(s:string)=>void,success:boolean}){
 const [taps,setTaps]=useState<number[]>([]);
 const [cards,setCards]=useState<number[]>([]);
 const isPattern=ch.category==='puzzel'&&ch.subcategory==='patroon'&&ch.answerType==='choice';
 const isOrder=ch.category==='puzzel'&&/volgorde|eerst|daarna/i.test(ch.subcategory+' '+ch.question);
 const isSpeur=ch.category==='speur'&&ch.answerType==='choice';

 if(isPattern) return <div className="touchPlay" aria-label="Patroon bekijken">
   <p className="touchHint">Bekijk het patroon. Welk stukje hoort op de lege plek?</p>
   <div className="patternStrip">{ch.question.split(' ').map((x,i)=><span key={i} className={x==='__'?'gap':''}>{x}</span>)}</div>
 </div>;

 if(isOrder){
   const parts=(ch.options||[]).slice(0,4);
   return <div className="touchPlay">
    <p className="touchHint">Tik de kaartjes in de volgorde die jij logisch vindt.</p>
    <div className="tapSequence">{parts.map((x,i)=><button key={x} disabled={success||taps.includes(i)} onClick={()=>setTaps(v=>[...v,i])}>{taps.includes(i)?`${taps.indexOf(i)+1}. `:''}{x}</button>)}</div>
    {taps.length===parts.length&&<button className="miniAction" onClick={()=>answer(taps.map(i=>parts[i]).join(' → '))}>Controleer mijn volgorde</button>}
   </div>
 }

 if(isSpeur) return <div className="touchPlay">
   <p className="touchHint">Speur eerst zelf. Tik op de loepjes die je wilt bekijken.</p>
   <div className="searchDots">{[0,1,2,3,4,5].map(i=><button aria-label={`Speurplek ${i+1}`} key={i} className={cards.includes(i)?'found':''} onClick={()=>setCards(v=>v.includes(i)?v:[...v,i])}>{cards.includes(i)?'✦':'⌕'}</button>)}</div>
   <small>{cards.length<2?'Kijk op minstens twee plekjes.':'Goed gespeurd! Kies nu je antwoord hieronder.'}</small>
 </div>;
 return null;
}
function NumberPlay({text}:{text:string}){
 const nums=(text.match(/\d+/g)||[]).map(Number);
 if(nums.length<2)return null;
 const op=text.includes('−')||text.includes('-')?'−':text.includes('+')?'+':null;
 if(!op)return null;
 const max=Math.min(nums[0],20), second=Math.min(nums[1],20);
 return <div className="numberPlay" aria-hidden="true">
   <div className="dotGroup">{Array.from({length:max},(_,i)=><i key={'a'+i}/>)}</div>
   <b>{op}</b>
   <div className="dotGroup second">{Array.from({length:second},(_,i)=><i key={'b'+i}/>)}</div>
 </div>
}

function observation(p:Progress){
 const entries=Object.entries(p.counts).sort((a,b)=>b[1]-a[1]);
 if(!entries.length)return 'Nog te weinig gedaan voor een observatie.';
 const names:Record<string,string>={lees:'lezen',taal:'taal',reken:'rekenen',puzzel:'puzzelen',speur:'speuren',maak:'maken',plus:'PLUS'};
 const [top,n]=entries[0];
 const tries=Object.values(p.attempts).reduce((a,b)=>a+b,0);
 return `Deze week koos je het vaakst voor ${names[top]||top} (${n}×). ${tries===0?'Veel opdrachten gingen zonder extra poging.':'Op sommige opdrachten is nog eens opnieuw geprobeerd — precies waar uitdagingen voor zijn.'}`;
}
function Parent({p,setP,close}:{p:Progress,setP:React.Dispatch<React.SetStateAction<Progress>>,close:()=>void}){
 const labels:any={lees:'Lezen',taal:'Taal',reken:'Rekenen',puzzel:'Puzzelen',speur:'Speuren',maak:'Creatief',plus:'Plus'};
 const obs=[] as string[];
 const ranked=Object.entries(p.counts).filter(([,n])=>n>0).sort((a,b)=>b[1]-a[1]);
 if(ranked.length){const top=ranked[0][0];obs.push(`${labels[top]} werd deze week het vaakst gekozen.`)}
 if((p.counts.plus||0)>=2)obs.push('PLUS-uitdagingen worden uit zichzelf opgezocht.');
 const retries=Object.values(p.attempts).reduce((a,b)=>a+b,0);
 if(p.stars>=3)obs.push(retries===0?'Veel uitdagingen lukten zonder een extra poging.':'Bij sommige uitdagingen werd opnieuw geprobeerd; doorzetten is zichtbaar.');
 if(!obs.length)obs.push('Nog te weinig activiteiten voor een duidelijke observatie. Kiesvrijheid blijft leidend.');
 return <section className="parent"><button className="back" onClick={close}><ChevronLeft/> Terug naar kind</button><div className="parentTitle"><Settings/><div><span className="eyebrow">ALLEEN VOOR GROTE MENSEN</span><h1>Oudergedeelte</h1></div></div><div className="parentGrid"><div className="panel"><h2>Deze week</h2><p className="stat">{p.stars}<small> uitdagingen gedaan</small></p><p>Sterren: {Math.min(p.stars,p.settings.goal)}/{p.settings.goal}</p><h3>Verdeling</h3>{Object.keys(labels).map(k=><div className="row" key={k}><span>{labels[k]}</span><b>{p.counts[k]||0}</b></div>)}</div><div className="panel"><h2>Observaties</h2>{obs.map(o=><p key={o}>• {o}</p>)}<p className="muted">Beschrijvend, zonder cijfers of normering.</p></div><div className="panel wide"><h2>Instellingen</h2><div className="toggles">{worlds.map(w=><label key={w.id}><input type="checkbox" checked={p.settings.enabled[w.id]} onChange={e=>setP(x=>({...x,settings:{...x.settings,enabled:{...x.settings.enabled,[w.id]:e.target.checked}}}))}/>{w.name}</label>)}</div><label className="slider">Uitdagingen per week: <b>{p.settings.goal}</b><input type="range" min="3" max="10" value={p.settings.goal} onChange={e=>setP(x=>({...x,settings:{...x.settings,goal:+e.target.value}}))}/></label><label className="slider">Leesniveau: <b>{p.settings.readLevel}</b><input type="range" min="1" max="3" value={p.settings.readLevel} onChange={e=>setP(x=>({...x,settings:{...x.settings,readLevel:+e.target.value}}))}/></label><label className="slider">Rekenniveau: <b>{p.settings.mathLevel}</b><input type="range" min="1" max="3" value={p.settings.mathLevel} onChange={e=>setP(x=>({...x,settings:{...x.settings,mathLevel:+e.target.value}}))}/></label></div></div></section>
}
