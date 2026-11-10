import type { ExteriorParameters } from '../components/exterior-viewer';
import type {LandscapeOptions} from './exterior-landscape';
export type ExteriorWishes = { cars: number; pathSide: 'left'|'right'|'none'; carport: boolean; deck: boolean; deckWidth: number; deckDepth: number; deckSide: 'left'|'right'|'front'; memo: string; landscape?: LandscapeOptions };
export const defaultWishes: ExteriorWishes = {cars:0,pathSide:'right',carport:false,deck:false,deckWidth:2.4,deckDepth:3,deckSide:'left',memo:''};
export type Rect = {x:number;z:number;w:number;d:number};
export type SceneBox = {w:number;h:number;d:number;x:number;y:number;z:number;color:string};
export function wishesOf(p: ExteriorParameters): ExteriorWishes { return {...defaultWishes,...p.wishes}; }
export function exteriorLayout(p: ExteriorParameters) {
  const a=wishesOf(p), front=p.siteDepth/2-p.buildingDepth-1.2;
  const parkingX=a.pathSide==='right'?-.5:a.pathSide==='left'?.5:0;
  const parking:Rect={x:parkingX,z:-p.siteDepth/2+.5+p.slabDepth/2,w:p.slabWidth,d:p.slabDepth};
  const building:Rect={x:0,z:p.siteDepth/2-p.buildingDepth/2-1.2,w:p.buildingWidth,d:p.buildingDepth};
  const side=a.pathSide==='left'?-1:1, pathX=side*(p.siteWidth/2-1.05), doorX=p.buildingWidth*.27;
  const start=-p.siteDepth/2+.4,end=front-.65;
  const paths:Rect[]=a.pathSide==='none'?[]:[{x:pathX,z:(start+end)/2,w:.95,d:Math.max(.5,end-start)},{x:(pathX+doorX)/2,z:front-.55,w:Math.abs(pathX-doorX),d:.9}];
  const deck:Rect|undefined=!a.deck?undefined:a.deckSide==='front'?{x:0,z:front-a.deckDepth/2-.15,w:a.deckWidth,d:a.deckDepth}:{x:(a.deckSide==='left'?-1:1)*(p.buildingWidth/2+a.deckWidth/2+.15),z:building.z,w:a.deckWidth,d:a.deckDepth};
  return {a,parking,building,paths,deck,pathX,front};
}
const overlaps=(a:Rect,b:Rect)=>Math.abs(a.x-b.x)<(a.w+b.w)/2-.001&&Math.abs(a.z-b.z)<(a.d+b.d)/2-.001;
export function validateExteriorLayout(p:ExteriorParameters):string[]{
  const {a,parking,paths,deck}=exteriorLayout(p),errors:string[]=[];
  if(!Number.isInteger(a.cars)||a.cars<0||a.cars>3)errors.push('車の台数は0〜3台で選択してください。');
  if(!['left','right','none'].includes(a.pathSide))errors.push('通路の位置を選択してください。');
  if(typeof a.carport!=='boolean'||typeof a.deck!=='boolean')errors.push('カーポート・デッキの選択を確認してください。');
  if(typeof a.memo!=='string'||a.memo.length>2000)errors.push('希望メモは2000文字以内で入力してください。');
  if(a.cars>0&&(p.slabWidth<a.cars*2.7||p.slabDepth<5))errors.push(`車${a.cars}台の仮配置には、駐車場の幅${(a.cars*2.7).toFixed(1)}m・奥行き5m以上で調整してください（配置用の仮条件）。`);
  if(a.carport&&p.slabDepth<5)errors.push('カーポートの仮配置には駐車場の奥行き5m以上が必要です。');
  const within=(r:Rect)=>Math.abs(r.x)+r.w/2<=p.siteWidth/2-.2&&Math.abs(r.z)+r.d/2<=p.siteDepth/2-.2;
  if(!within(parking))errors.push('駐車場が敷地からはみ出します。幅を小さくするか敷地を広げてください。');
  if(paths.some(r=>overlaps(r,parking)))errors.push('駐車場と通路が重なります。駐車場の幅・奥行きを調整してください。');
  if(a.deck){
    if(!['left','right','front'].includes(a.deckSide)||![a.deckWidth,a.deckDepth].every(v=>typeof v==='number'&&Number.isFinite(v)&&v>=.6&&v<=10))errors.push('デッキの幅・奥行きは0.6〜10mで、設置側も選択してください。');
    else if(deck){if(!within(deck))errors.push('ウッドデッキが敷地からはみ出します。寸法か設置側を変えてください。');if(overlaps(deck,parking)||paths.some(r=>overlaps(deck,r)))errors.push('ウッドデッキが駐車場・通路と重なります。寸法か設置側を変えてください。');}
  }
  return errors;
}
export function exteriorExtraBoxes(p:ExteriorParameters):SceneBox[]{
  const {a,parking,deck}=exteriorLayout(p),out:SceneBox[]=[];
  const add=(w:number,h:number,d:number,x:number,y:number,z:number,color:string)=>out.push({w,h,d,x,y,z,color});
  if(deck){add(deck.w,.18,deck.d,deck.x,.4,deck.z,'#9b704a');const count=Math.ceil(deck.d/.18);for(let i=0;i<count;i++)add(deck.w,.008,.012,deck.x,.495,deck.z-deck.d/2+(i+.5)*deck.d/count,'#614b36');for(const sx of [-1,1])for(const sz of [-1,1])add(.1,.31,.1,deck.x+sx*(deck.w/2-.15),.16,deck.z+sz*(deck.d/2-.15),'#655a49');}
  if(a.carport){add(parking.w,.13,parking.d,parking.x,2.7,parking.z,'#a3bbc0');for(const sx of [-1,1])for(const sz of [-1,1])add(.12,2.65,.12,parking.x+sx*(parking.w/2-.17),1.325,parking.z+sz*(parking.d/2-.25),'#3b4948');}
  for(let i=0;i<a.cars;i++){const x=parking.x-parking.w/2+parking.w/a.cars*(i+.5);add(1.75,.65,4.2,x,.55,parking.z,'#d6dfe0');add(1.5,.55,2.1,x,1.12,parking.z+.05,'#66848c');for(const sx of [-1,1])for(const sz of [-1,1])add(.15,.42,.65,x+sx*.85,.25,parking.z+sz*1.35,'#37413f');}
  return out;
}
/** Deliberately bounded keyword extraction, not general AI interpretation. */
export function extractExteriorWishes(text:string,current:ExteriorWishes){
  const next={...current,memo:text};const matched:string[]=[];
  const number=text.match(/(?:車|駐車)\s*([0-3０-３一二三])\s*台/);
  if(number){const map:Record<string,number>={'一':1,'二':2,'三':3,'０':0,'１':1,'２':2,'３':3};next.cars=map[number[1]]??Number(number[1]);matched.push(`車${next.cars}台`);}
  for(const sentence of text.split(/[、。,，\n]/)){
    const no=/なし|不要|いらない|作らない|設置しない/.test(sentence);
    if(/通路|アプローチ/.test(sentence)){next.pathSide=no?'none':/左/.test(sentence)?'left':/右/.test(sentence)?'right':next.pathSide;matched.push('通路');}
    if(/カーポート/.test(sentence)){next.carport=!no;matched.push('カーポート');}
    if(/ウッドデッキ|デッキ/.test(sentence)){next.deck=!no;if(/左/.test(sentence))next.deckSide='left';else if(/右/.test(sentence))next.deckSide='right';else if(/手前|正面/.test(sentence))next.deckSide='front';matched.push('ウッドデッキ');}
  }
  return {next,matched};
}
