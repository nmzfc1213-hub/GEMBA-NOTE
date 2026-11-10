import {object,footprint,inside,intersects} from './model.js';
export const snapPosition=(x,z,step=.1)=>({x:Math.round(x/step)*step,z:Math.round(z/step)*step});
export const rotateBy=(angle,delta)=>((angle+delta+540)%360)-180;
export function localPoint(h,x,z){const a=h.rotation*Math.PI/180;return {x:h.x+x*Math.cos(a)+z*Math.sin(a),z:h.z-x*Math.sin(a)+z*Math.cos(a)};}
export function rectanglesOverlap(a,b){const av=footprint(a),bv=footprint(b);const axes=[...av,...bv].map((v,i,all)=>{const next=i<4?av[(i+1)%4]:bv[(i-3)%4];return [next[1]-v[1],v[0]-next[0]];});return axes.every(([x,z])=>{const aa=av.map(p=>p[0]*x+p[1]*z),bb=bv.map(p=>p[0]*x+p[1]*z);return Math.min(...aa)<Math.max(...bb)-1e-6&&Math.min(...bb)<Math.max(...aa)-1e-6;});}
export function withinSite(item,site){const f=footprint(item),v=site.vertices;return f.every(p=>inside(p,v))&&!f.some((a,i)=>v.some((c,j)=>intersects(a,f[(i+1)%4],c,v[(j+1)%v.length])));}
export function doorAnchor(h){const endX=h.shape==='L'?.05:h.shape==='U'?-.2:h.shape==='offset'?-.15:.5,front=h.shape==='offset'?-.35:-.5;return localPoint(h,(-.5+(endX+.5)*.75)*h.w,front*h.d);}
export function entranceZone(h){const door=doorAnchor(h),a=h.rotation*Math.PI/180;return {...h,x:door.x-1.1*Math.sin(a),z:door.z-1.1*Math.cos(a),w:2.2,d:2.2};}
export function houseFootprint(h){let v;switch(h.shape){case 'L':v=[[-.5,-.5],[.05,-.5],[.05,-.05],[.5,-.05],[.5,.5],[-.5,.5]];break;case 'U':v=[[-.5,-.5],[-.2,-.5],[-.2,.1],[.2,.1],[.2,-.5],[.5,-.5],[.5,.5],[-.5,.5]];break;case 'offset':v=[[-.5,-.35],[-.15,-.35],[-.15,-.5],[.5,-.5],[.5,.25],[.2,.25],[.2,.5],[-.5,.5]];break;default:return footprint(h);}return v.map(([x,z])=>{const p=localPoint(h,x*h.w,z*h.d);return [p.x,p.z]});}
export function entranceConflicts(plan){const houses=plan.objects.filter(o=>o.type==='house'&&o.door);return plan.objects.filter(o=>o.type==='deck'&&houses.some(h=>rectanglesOverlap(o,entranceZone(h))));}
export function suggestPlacement(plan,type,side='garden',existing){const item=existing?{...existing}:object(type),house=plan.objects.find(o=>o.type==='house');const v=plan.site.vertices,minX=Math.min(...v.map(p=>p[0])),maxX=Math.max(...v.map(p=>p[0])),minZ=Math.min(...v.map(p=>p[1])),maxZ=Math.max(...v.map(p=>p[1])),cx=(minX+maxX)/2,cz=(minZ+maxZ)/2;
 let candidates=[];
 if(type==='deck'&&house){const choices={garden:[0,house.d/2+item.d/2+.12],left:[-house.w/2-item.w/2-.12,house.d*.1],right:[house.w/2+item.w/2+.12,house.d*.1]};for(const key of [side,...Object.keys(choices).filter(k=>k!==side)])if(choices[key])candidates.push({...localPoint(house,...choices[key]),rotation:house.rotation});}
 else if(type==='house')candidates=[{x:cx,z:cz+(maxZ-minZ)*.2}];
 else if(type==='carport'){const slab=plan.objects.find(o=>o.type==='concrete');candidates=[slab?{x:slab.x,z:slab.z,rotation:slab.rotation}:{x:cx-2,z:minZ+item.d/2+1}];}
 else if(type==='stairs'&&house){const zone=entranceZone(house);candidates=[{x:zone.x,z:zone.z,rotation:house.rotation}];}
 else if(['sedan','suv','minivan','kei','concrete'].includes(type))candidates=[{x:cx-3,z:minZ+item.d/2+1},{x:cx,z:minZ+item.d/2+1},{x:cx+3,z:minZ+item.d/2+1}];
 else if(type==='gate')candidates=[{x:maxX-2,z:minZ+1},{x:minX+2,z:minZ+1}];
 else if(['fence','wall'].includes(type))candidates=[{x:cx,z:maxZ-item.d/2-.2},{x:minX+item.d/2+.2,z:cz,rotation:90}];
 else if(type==='tile'&&house)candidates=[{...localPoint(house,house.w*.25,-house.d/2-item.d/2-.2),rotation:house.rotation}];
 else candidates=[{x:maxX-item.w/2-.6,z:cz},{x:minX+item.w/2+.6,z:cz},{x:cx,z:maxZ-item.d/2-.6}];
 const blockers=plan.objects.filter(o=>o.id!==item.id&&!['grass','gravel','concrete','tile','carport'].includes(o.type));
 const fits=c=>withinSite(c,plan.site)&&(type==='deck'? !plan.objects.filter(o=>o.type==='house').some(h=>rectanglesOverlap(c,entranceZone(h))||rectanglesOverlap(c,h)):true)&&(['carport','tile','stairs','grass','gravel','concrete'].includes(type)||!blockers.some(o=>rectanglesOverlap(c,o)));
 for(const pos of candidates){const c={...item,...pos};if(fits(c))return {item:c,fits:true};}
 // Search only when semantic candidates do not fit; preserve garden/side preference for a deck.
 const step=Math.max(.5,(maxX-minX)/24,(maxZ-minZ)/24);for(let z=maxZ-item.d/2-.2;z>=minZ+item.d/2+.2;z-=step)for(let x=minX+item.w/2+.2;x<=maxX-item.w/2-.2;x+=step){const c={...item,x,z,rotation:house?.rotation||0};if(fits(c))return {item:c,fits:true};}
 return {item:{...item,...(candidates[0]||{x:cx,z:cz})},fits:false};}
