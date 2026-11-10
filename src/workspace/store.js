import {validate as validateScene} from '../model.js';
export const WORKSPACE_KEY='gemba-note:workspace:v1';
export const STUDIO_KEY='genba-exterior-studio:v1';
const record=o=>o&&typeof o==='object'&&!Array.isArray(o);
const strings=(o,keys)=>{for(const key of keys)if(o[key]!==undefined&&typeof o[key]!=='string')throw Error(`${key}の形式が不正です`);};
const projectStrings=['id','name','place','scope','length','width','progress','notes','next','days','labor','outsource','overhead','target','quote','actualLabor','actualOther','dimensionNote','builderMarkup','customerMarkup'];
export function normalizeWorkspace(raw,makeProject){
 if(!record(raw)||!Array.isArray(raw.projects)||!Array.isArray(raw.rates)||raw.projects.length>100||raw.rates.length>10000)throw Error('現場ノートのバックアップ形式を確認してください');
 const ids=new Set();const projects=raw.projects.map(q=>{
  if(!record(q)||typeof q.id!=='string'||!q.id||ids.has(q.id))throw Error('案件IDが不正・重複しています');ids.add(q.id);strings(q,projectStrings);
  const p={...makeProject(),...q};if(!Array.isArray(p.rows)||p.rows.length>1000||!Array.isArray(p.shapes)||p.shapes.length>500||!Array.isArray(p.images)||p.images.length>6||!Array.isArray(p.checks)||p.checks.some(v=>typeof v!=='boolean'))throw Error('案件の明細・図形・写真・チェックの形式が不正です');
  p.checks=Array.from({length:7},(_,i)=>!!p.checks[i]);
  const rowIds=new Set();p.rows=p.rows.map(r=>{if(!record(r)||typeof r.id!=='string'||rowIds.has(r.id))throw Error('明細IDが不正です');rowIds.add(r.id);strings(r,['name','category','material','qty','unit','cost','sell','actual','included','length','width','depth']);if(r.concrete!==undefined){if(!record(r.concrete))throw Error('コンクリート明細の形式が不正です');for(const v of Object.values(r.concrete))if(typeof v!=='string')throw Error('コンクリートの入力値を確認してください');}return {name:'',category:'材料',material:'',qty:'',unit:'㎡',cost:'',sell:'',actual:'',...r};});
  if(p.shapes.some(s=>!record(s)||typeof s.id!=='string'||typeof s.label!=='string'||![s.x,s.y,s.w,s.h].every(Number.isFinite)))throw Error('平面図の寸法が不正です');
  if(p.images.some(i=>!record(i)||typeof i.id!=='string'||typeof i.src!=='string'||!/^data:image\/(png|jpeg|webp|gif);base64,/.test(i.src)||i.src.length>2000000||typeof i.note!=='string'||typeof i.url!=='string'))throw Error('参考写真の形式を確認してください');
  if(p.editorScene&&validateScene(p.editorScene).length)throw Error('案件の3Dデータが不正です');return p;
 });
 const rateIds=new Set();const rates=raw.rates.map(r=>{if(!record(r)||typeof r.id!=='string'||rateIds.has(r.id))throw Error('単価IDが不正・重複しています');rateIds.add(r.id);strings(r,['name','unit','cost','sell','category','material','included','code','supplier','builderSell','customerSell']);if(r.history!==undefined&&(!Array.isArray(r.history)||r.history.some(h=>!record(h)||typeof h.at!=='string'||typeof h.cost!=='string')))throw Error('単価履歴の形式が不正です');return {name:'',unit:'㎡',cost:'',sell:'',category:'材料',...r};});
 for(const key of ['defaults','unionDefaults','concreteDefaults'])if(raw[key]!==undefined&&(!record(raw[key])||Object.values(raw[key]).some(v=>typeof v!=='string')))throw Error('基本単価・上乗せ率の形式が不正です');
 return {...raw,projects:projects.length?projects:[makeProject()],rates};
}
export function mergeWorkspace(current,incoming,newId){const remap=new Map(incoming.rates.map(r=>[r.id,newId()]));return {...current,projects:[...current.projects,...incoming.projects.map(p=>{const id=newId();return {...p,id,editorScene:p.editorScene?{...p.editorScene,id}:undefined,rows:p.rows.map(r=>({...r,rateId:remap.get(r.rateId)}))};})],rates:[...current.rates,...incoming.rates.map(r=>({...r,id:remap.get(r.id)}))]};}
export function studioProjects(storage,makeProject){const raw=JSON.parse(storage.getItem(STUDIO_KEY)||'[]');if(!Array.isArray(raw)||raw.some(p=>validateScene(p).length))throw Error('保存済み3D案件を読み込めません');return raw.map(scene=>({...makeProject(),name:scene.name,editorScene:scene,studioSourceId:scene.id}));}
export function writeWorkspace(storage,data){const text=JSON.stringify(data);if(text.length>12000000)throw Error('保存データが大きすぎます。写真を減らし、JSONを書き出してください');storage.setItem(WORKSPACE_KEY,text);}
