import React from 'react';
import {createPortal} from 'react-dom';
import Editor from './Editor';
import {initial,importLegacy,validate} from './model.js';
export default function LinkedEditor({project,onChange,onSave,onClose}){
 let value=project.editorScene;
 if(!value&&project.scene){try{const migrated=importLegacy(project.scene);if(!validate(migrated).length)value=migrated;}catch{}}
 if(!value)value=initial();value={...value,id:project.id,name:project.name||'名称未設定の案件'};
 return createPortal(<div className="studio linked-studio"><Editor value={value} onLinkedChange={onChange} onLinkedSave={onSave} onClose={onClose}/></div>,document.body);
}
