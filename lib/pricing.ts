type ExteriorParameters = Record<string, unknown>;
export type Workspace='livora'|'union';
export type RateRevision={at:string;cost:string;builderSell?:string;customerSell?:string;source?:string};
export type ConcreteRates={meshBasisArea:string;meshBasisCount:string;meshBasisPrice:string;mixRate:string;laborRate:string};
export type ConcreteInput=ConcreteRates&{areaMode:'dimensions'|'area';length:string;width:string;area:string;thicknessCm:string;laborCount:string;meshMode:'sheet'|'set';meshOverride:string};
export const concreteDefaults:ConcreteRates={meshBasisArea:'10',meshBasisCount:'5',meshBasisPrice:'4000',mixRate:'40000',laborRate:'25000'};
export function newConcrete(rates:ConcreteRates=concreteDefaults):ConcreteInput{return {...rates,areaMode:'dimensions',length:'',width:'',area:'',thicknessCm:'',laborCount:'',meshMode:'sheet',meshOverride:''};}
export type QuantityMode = 'direct' | 'area' | 'length' | 'volume';
export type Row = {id:string;name:string;category:string;material:string;qty:string;unit:string;cost:string;sell:string;actual:string;quantityMode?:QuantityMode;length?:string;width?:string;depth?:string;included?:string;rateId?:string;rateDate?:string;concrete?:ConcreteInput;rateApproval?:Rate['approval'];rateTaxMode?:Rate['taxMode'];rateWorkspace?:Workspace;rateImported?:boolean};
export type Shape={id:string;x:number;y:number;w:number;h:number;label:string};
export type Project={editorScene?:any;studioSourceId?:string;scene?:ExteriorParameters;workspace?:Workspace;id:string;name:string;place:string;scope:string;length:string;width:string;progress:string;notes:string;next:string;rows:Row[];days:string;labor:string;outsource:string;overhead:string;target:string;quote:string;actualLabor:string;actualOther:string;checks:boolean[];shapes:Shape[];images:{id:string;src:string;note:string;url:string}[];dimensionNote:string;pricingMode?:'markup'|'margin';builderMarkup?:string;customerMarkup?:string;audience?:'builder'|'customer';};
export type Rate={workspace?:Workspace;code?:string;workType?:string;builderSell?:string;customerSell?:string;approval?:'unverified'|'provisional'|'confirmed';taxMode?:'excl'|'incl'|'unknown';source?:string;importedAt?:string;history?:RateRevision[];id:string;name:string;unit:string;cost:string;sell:string;category:string;material?:string;included?:string;supplier?:string;verifiedAt?:string};
export type Defaults={builderMarkup:string;customerMarkup:string};
export type Data={unionDefaults?:Defaults;projects:Project[];rates:Rate[];defaults?:Defaults;concreteDefaults?:ConcreteRates};
export const n=(v:string|undefined)=>{const x=Number(v);return Number.isFinite(x)?x:0;};
export const defaultPricing:Defaults={builderMarkup:'20',customerMarkup:'40'};
export const markedUnit=(cost:string,percent:string)=>Math.round(n(cost)*(100+n(percent))/100);
export const lineAmount=(qty:string,unit:number)=>Math.trunc(Math.round(n(qty)*unit*1000000)/1000000);
const tidy=(v:number)=>Math.round(v*1000000)/1000000;
export function calcConcrete(c:ConcreteInput){
 const gaps:string[]=[];
 const inputs=c.areaMode==='dimensions'?[c.length,c.width]:[c.area];
 if(inputs.some(v=>v===''||n(v)<=0))gaps.push('施工面積（0より大きい値）');
 if(c.thicknessCm===''||n(c.thicknessCm)<=0)gaps.push('厚み（0より大きい値）');
 if(c.meshBasisArea===''||n(c.meshBasisArea)<=0||c.meshBasisCount===''||n(c.meshBasisCount)<=0)gaps.push('メッシュの基準面積・枚数');
 if(c.meshBasisPrice==='')gaps.push('メッシュの基準金額');if(c.mixRate==='')gaps.push('生コンの1㎥単価');
 if(c.laborCount==='')gaps.push('この工事に必要な人工数');if(c.laborRate==='')gaps.push('1人工の単価');
 const area=tidy(c.areaMode==='dimensions'?n(c.length)*n(c.width):n(c.area));
 const volume=tidy(area*n(c.thicknessCm)/100);
 const theoreticalSheets=n(c.meshBasisArea)>0?tidy(area/n(c.meshBasisArea)*n(c.meshBasisCount)):0;
 const sheets=c.meshOverride!==''?n(c.meshOverride):(c.meshMode==='set'&&n(c.meshBasisCount)>0?Math.ceil(theoreticalSheets/n(c.meshBasisCount))*n(c.meshBasisCount):Math.ceil(theoreticalSheets));
 const meshUnit=n(c.meshBasisCount)>0?n(c.meshBasisPrice)/n(c.meshBasisCount):0;
 const meshCost=Math.round(sheets*meshUnit);const mixCost=Math.round(volume*n(c.mixRate));const laborCost=Math.round(n(c.laborCount)*n(c.laborRate));
 return {area,volume,theoreticalSheets,sheets,meshUnit,meshCost,mixCost,laborCost,total:meshCost+mixCost+laborCost,gaps};
}
export function concreteRow(id:string,rates:ConcreteRates=concreteDefaults):Row{return {id,name:'土間コンクリート（材料・人工の積上げ）',category:'材工込み',material:'厚み・仕様は案件ごとに確認',qty:'1',unit:'式',cost:'0',sell:'',actual:'',included:'メッシュ・生コン・ここに入力した人工のみ。掘削、残土処分、砕石、型枠、ポンプ、運搬、諸経費などは別途確認。',concrete:newConcrete(rates)};}
export function rowCost(r:Row){return r.concrete?calcConcrete(r.concrete).total:n(r.qty)*n(r.cost);}
export function rowSell(r:Row,rate:string){return r.concrete?Math.round(calcConcrete(r.concrete).total*(100+n(rate))/100):lineAmount(r.qty,markedUnit(r.cost,rate));}
export function quantityChange(row:Row,patch:Partial<Row>):Row{
 const r={...row,...patch};if(r.concrete){r.qty='1';r.unit='式';r.cost=String(calcConcrete(r.concrete).total);return r;}const mode=r.quantityMode||'direct';
 if(mode==='direct')return r;
 const inputs=mode==='length'?[r.length]:mode==='area'?[r.length,r.width]:[r.length,r.width,r.depth];
 r.qty=inputs.some(v=>v===undefined||v==='')?'':String(Math.round(inputs.reduce<number>((s,v)=>s*n(v),1)*1000000)/1000000);
 r.unit=mode==='length'?'m':mode==='area'?'㎡':'㎥';return r;
}
export function calc(p:Project){
 const automatic=p.pricingMode==='markup';
 const material=p.rows.reduce((s,r)=>s+(r.concrete?rowCost(r):(automatic?lineAmount(r.qty,n(r.cost)):n(r.qty)*n(r.cost))),0);
 const labor=automatic?lineAmount(p.days,n(p.labor)):n(p.days)*n(p.labor);const extraCost=labor+n(p.outsource)+n(p.overhead);const cost=material+extraCost;
 const builderRate=p.builderMarkup??(p.workspace==='union'?'':defaultPricing.builderMarkup),customerRate=p.customerMarkup??(p.workspace==='union'?'':defaultPricing.customerMarkup);
 const builder=p.rows.reduce((s,r)=>s+rowSell(r,builderRate),0)+Math.round(extraCost*(100+n(builderRate))/100);
 const customer=p.rows.reduce((s,r)=>s+rowSell(r,customerRate),0)+Math.round(extraCost*(100+n(customerRate))/100);
 const markup=p.audience==='builder'?builderRate:customerRate;
 const suggested=p.pricingMode==='markup'?(p.audience==='builder'?builder:customer):(n(p.target)<100?Math.ceil(cost/(1-n(p.target)/100)):0);
 const salesReady=p.quote!==''||!automatic||(p.audience==='builder'?builderRate:customerRate)!=='';const sales=salesReady?(p.quote===''?suggested:n(p.quote)):0;const profit=salesReady?sales-cost:0;
 return {salesReady,material,labor,cost,extraCost,builder,customer,markup,suggested,sales,profit,margin:sales?profit/sales*100:0,actual:p.rows.reduce((s,r)=>s+n(r.actual),0)+n(p.actualLabor)+n(p.actualOther)};
}
export function missing(p:Project){
 const a:string[]=[];if(!p.name)a.push('案件名');if(!p.place)a.push('工事場所');if(!p.scope)a.push('施工範囲');if(!p.rows.length)a.push('工事項目');
 p.rows.forEach(r=>{if(r.rateImported&&(r.rateApproval!=='confirmed'||r.rateTaxMode!=='excl'))a.push(r.name+'の単価確認・税区分');if(p.workspace&&r.rateWorkspace&&p.workspace!==r.rateWorkspace)a.push(r.name+'の所属会社');if(r.concrete){calcConcrete(r.concrete).gaps.forEach(g=>a.push(r.name+'：'+g));}if(!r.name)a.push('工事項目の名称');if(r.qty===''||r.cost==='')a.push((r.name||'名称未入力の項目')+'の数量・原価単価');if(!r.unit)a.push((r.name||'工事項目')+'の単位');if(p.pricingMode==='markup'&&!r.included?.trim())a.push((r.name||'工事項目')+'の単価に含む範囲');});
 if(p.days===''||p.labor==='')a.push('追加の人工・人工単価（なしは0）');if(p.outsource==='')a.push('追加の外注費（なしは0）');if(p.overhead==='')a.push('諸経費（なしは0）');if(!p.length||!p.width)a.push('施工範囲の寸法');
 if(p.pricingMode==='markup'){if(p.builderMarkup===undefined||p.builderMarkup==='')a.push('工務店向けの上乗せ率');if(p.customerMarkup===undefined||p.customerMarkup==='')a.push('客出しの上乗せ率');}else if(p.target===''||n(p.target)>=100)a.push('100%未満の目標粗利率');return a;
}
