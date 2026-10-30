import type {ReactNode} from 'react';
import {ExitRegistry,ExitPage} from './workspace-exit';
import type {Registry} from './workspace-exit';
export function WorkspaceExitProvider({value,children}:{value:Registry;children:ReactNode}){return <ExitRegistry.Provider value={value}>{children}</ExitRegistry.Provider>;}
export function WorkspaceExitScope({page,children}:{page:string;children:ReactNode}){return <ExitPage.Provider value={page}>{children}</ExitPage.Provider>;}
