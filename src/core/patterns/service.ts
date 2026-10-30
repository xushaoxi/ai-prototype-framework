import {createContext,useContext} from 'react';
import {patternApi} from '../api';
import type {PatternAction,PatternSnapshot} from './types';
export interface PatternService {
 get():Promise<PatternSnapshot>;
 act(version:number,action:PatternAction):Promise<PatternSnapshot>;
 restore(version:number,snapshot:unknown):Promise<PatternSnapshot>;
}
export const PatternServiceContext=createContext<PatternService>(patternApi);
export const usePatternService=()=>useContext(PatternServiceContext);
