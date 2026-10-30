import type {ReactNode} from 'react';
import {PatternServiceContext} from './service';
import type {PatternService} from './service';
/** Inject a typed business adapter without copying the UI templates. */
export function PatternProvider({service,children}:{service:PatternService;children:ReactNode}){return <PatternServiceContext.Provider value={service}>{children}</PatternServiceContext.Provider>;}
