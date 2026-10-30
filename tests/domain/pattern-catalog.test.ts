import {it,expect} from 'vitest';
import {readFileSync,existsSync} from 'node:fs';
import ts from 'typescript';
import {patternCatalog} from '../../src/app/patterns/catalog';
function object(value:unknown):Record<string,unknown>{if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Expected object');return value as Record<string,unknown>;}
it('PAT-LIB-001 catalogue, action contract and requirements cannot drift',()=>{
 const spec=object(JSON.parse(readFileSync('business-specs/pattern-library/requirements.json','utf8')));
 expect(Array.isArray(spec.templates)).toBe(true);const templates=(spec.templates as unknown[]).map(object);
 expect(templates.map(row=>row.id).sort()).toEqual(patternCatalog.map(row=>row.id).sort());
 expect(new Set(patternCatalog.map(row=>row.id)).size).toBe(patternCatalog.length);
 const source=ts.createSourceFile('types.ts',readFileSync('src/core/patterns/types.ts','utf8'),ts.ScriptTarget.Latest,true);
 const definition=source.statements.find((node):node is ts.TypeAliasDeclaration=>ts.isTypeAliasDeclaration(node)&&node.name.text==='PatternAction');
 if(!definition||!ts.isUnionTypeNode(definition.type))throw new Error('Missing action union');
 const actions=definition.type.types.flatMap(node=>ts.isTypeLiteralNode(node)?node.members.flatMap(member=>{
  if(!ts.isPropertySignature(member)||member.name.getText(source)!=='type'||!member.type)return [];
  const values=ts.isUnionTypeNode(member.type)?member.type.types:[member.type];
  return values.flatMap(value=>ts.isLiteralTypeNode(value)&&ts.isStringLiteral(value.literal)?[value.literal.text]:[]);
 }):[]);
 expect([...actions].sort()).toEqual([...(spec.actions as string[])].sort());
 const requirements=(spec.requirements as unknown[]).map(object);expect(new Set(requirements.map(row=>row.id)).size).toBe(requirements.length);
 expect([...new Set(requirements.flatMap(row=>row.actions as string[]))].sort()).toEqual([...actions].sort());
 for(const row of requirements)for(const path of row.testFiles as string[])expect(existsSync(path),path).toBe(true);
});
