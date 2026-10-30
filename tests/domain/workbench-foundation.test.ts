import {describe,it,expect} from 'vitest';
import {patternRecipes,relatedPatterns} from '../../src/app/patterns/recipes';
import {createTheme,defaultThemeTokens} from '../../src/core/theme';
import {patternCatalog} from '../../src/app/patterns/catalog';
describe('WB-001 structure and shared theme',()=>{
 it('groups capabilities once and relates patterns by task rather than transport family',()=>{
  const variants=patternRecipes.flatMap(recipe=>recipe.variants);
  expect(new Set(variants).size).toBe(variants.length);
  expect(variants.every(id=>patternCatalog.some(pattern=>pattern.id===id))).toBe(true);
  expect(relatedPatterns('advanced-table').map(p=>p.id)).toContain('tree-table');
  expect(relatedPatterns('advanced-table').map(p=>p.id)).not.toContain('approval');
  expect(relatedPatterns('grouped-form').map(p=>p.id)).not.toContain('files');
 });
 it('derives Ant and CSS values from the same semantic source, including overrides',()=>{
  const theme=createTheme({...defaultThemeTokens,primary:'#123456',fontSize:16,controlHeight:40,spacingUnit:5});
  expect(theme.antd.token?.colorPrimary).toBe('#123456');
  expect(theme.variables['--color-primary']).toBe('#123456');
  expect(theme.variables['--font-size']).toBe('16px');
  expect(theme.antd.token?.controlHeight).toBe(40);
  expect(theme.variables['--control-height']).toBe('40px');
  expect(theme.variables['--space-24']).toBe('30px');
  expect(theme.antd.token?.sizeUnit).toBe(5);
  expect(theme.variables['--color-primary-soft']).not.toBe(defaultThemeTokens.primarySoft);
  expect(createTheme().variables['--color-primary-soft']).toBe(defaultThemeTokens.primarySoft);
 });
});


it('WB-002 body and secondary text remain readable on the default surfaces',()=>{
 const luminance=(hex:string)=>[1,3,5].map(index=>parseInt(hex.slice(index,index+2),16)/255).reduce((sum,value,index)=>sum+(value<=0.04045?value/12.92:((value+0.055)/1.055)**2.4)*[0.2126,0.7152,0.0722][index],0);
 for(const foreground of [defaultThemeTokens.text,defaultThemeTokens.textSecondary,defaultThemeTokens.textMuted])for(const background of [defaultThemeTokens.surface,defaultThemeTokens.background])expect((luminance(background)+0.05)/(luminance(foreground)+0.05)).toBeGreaterThanOrEqual(4.5);
});
