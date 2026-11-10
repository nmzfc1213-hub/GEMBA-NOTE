import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {build} from 'esbuild';
import {mkdirSync} from 'node:fs';
import {WORKSPACE_KEY} from '../src/workspace/store.js';
const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'https://workspace.test/'});
for(const k of ['window','document','HTMLElement','Element','HTMLInputElement','HTMLCanvasElement','Event','MouseEvent','PointerEvent','File','FileReader','Blob'])if(dom.window[k])globalThis[k]=dom.window[k];
Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});
globalThis.localStorage=dom.window.localStorage;globalThis.confirm=()=>true;globalThis.IS_REACT_ACT_ENVIRONMENT=true;
dom.window.HTMLCanvasElement.prototype.getContext=()=>null;
mkdirSync(new URL('../.qa/',import.meta.url),{recursive:true});
await build({entryPoints:['src/Office.tsx'],bundle:true,format:'esm',platform:'node',packages:'external',outfile:'.qa/office.mjs',logLevel:'silent'});
const React=await import('react');
const {render,fireEvent,waitFor,cleanup}=await import('@testing-library/react');
const {default:Office}=await import('../.qa/office.mjs');
const findInput=(container,label)=>{const span=[...container.querySelectorAll('label>span')].find(e=>e.textContent===label);assert.ok(span,`入力欄 ${label}`);return span.parentElement.querySelector('input');};
test('見積を編集→同案件の3D編集→見積へ戻る→端末保存から復元',async()=>{
 localStorage.clear();const ui=render(React.createElement(Office));
 fireEvent.click(ui.getByRole('button',{name:'案件・見積もり'}));
 const name=findInput(ui.container,'案件名');fireEvent.change(name,{target:{value:'統合テスト案件'}});
 fireEvent.click(ui.getByRole('button',{name:'この案件の3Dプランを編集'}));
 await waitFor(()=>assert.ok(document.querySelector('.linked-studio')));
 await waitFor(()=>assert.ok(document.querySelector('.linked-studio .library')));
 const studio=document.querySelector('.linked-studio');
 fireEvent.click([...studio.querySelectorAll('.library button')].find(b=>b.textContent.includes('門柱')));
 await waitFor(()=>assert.ok([...studio.querySelectorAll('.object-list button')].some(b=>b.textContent.includes('門柱'))));
 fireEvent.click([...studio.querySelectorAll('button')].find(b=>b.textContent==='案件を保存'));
 fireEvent.click([...studio.querySelectorAll('button')].find(b=>b.textContent.includes('見積もり・案件へ')));
 await waitFor(()=>assert.equal(document.querySelector('.linked-studio'),null));
 assert.equal(findInput(ui.container,'案件名').value,'統合テスト案件');
 await waitFor(()=>{const data=JSON.parse(localStorage.getItem(WORKSPACE_KEY));assert.equal(data.projects[0].name,'統合テスト案件');assert.equal(data.projects[0].editorScene.objects.filter(o=>o.type==='gate').length,2);},{timeout:2500});
 const before=JSON.parse(localStorage.getItem(WORKSPACE_KEY));cleanup();
 const again=render(React.createElement(Office));await waitFor(()=>assert.ok(again.container.textContent.includes('統合テスト案件')));
 assert.deepEqual(JSON.parse(localStorage.getItem(WORKSPACE_KEY)).projects[0].rows,before.projects[0].rows);cleanup();
});
test('単価ライブラリ・原価比較・平面図・写真・提出チェックが開ける',async()=>{
 const ui=render(React.createElement(Office));
 for(const label of ['単価ライブラリ','原価・粗利の比較','平面図・寸法メモ','参考イメージ','提出前チェック']){
  fireEvent.click(ui.getByRole('button',{name:label,exact:true}));assert.ok(ui.container.querySelector('h1').textContent.includes(label));
 }
 cleanup();
});
