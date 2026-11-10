import React from 'react';
import {createRoot} from 'react-dom/client';
import Office from './Office';
import './office.css';
import './studio.css';
import './integration.css';
createRoot(document.getElementById('root')).render(<div className="office"><Office/></div>);
