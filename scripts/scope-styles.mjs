import fs from 'node:fs';
import postcss from 'postcss';
import selectorParser from 'postcss-selector-parser';
for(const [file,scope] of [['office','office'],['studio','studio']]){
 const css=fs.readFileSync(`styles/${file}.raw.css`,'utf8');const root=postcss.parse(css);
 root.walkAtRules('import',r=>r.remove());
 root.walkRules(rule=>{let p=rule.parent;while(p){if(p.type==='atrule'&&/keyframes/.test(p.name))return;p=p.parent;}
 rule.selector=selectorParser(selectors=>selectors.each(sel=>{const first=sel.nodes[0];if((first.type==='pseudo'&&first.value===':root')||(first.type==='tag'&&['body','html'].includes(first.value))){first.replaceWith(selectorParser.className({value:scope}));}else{sel.prepend(selectorParser.combinator({value:' '}));sel.prepend(selectorParser.className({value:scope}));}})).processSync(rule.selector);
 });fs.writeFileSync(`src/${file}.css`,root.toString());
}
