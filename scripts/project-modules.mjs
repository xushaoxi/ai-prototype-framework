import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

// Compile the real local import graph without adding a second TS runtime dependency.
export async function loadProjectModule(root, entry = 'src/modules/registry.ts') {
  const temporary = mkdtempSync(join(tmpdir(), 'framework-modules-'));
  const visited = new Set();
  function compile(file) {
    const absolute = resolve(root, file); const source = readFileSync(absolute, 'utf8');
    if (visited.has(absolute)) return;
    visited.add(absolute);
    const output = join(temporary, relative(root, absolute).replace(/\.tsx?$/, '.mjs'));
    mkdirSync(dirname(output), { recursive: true });
    for (const dependency of ts.preProcessFile(source).importedFiles) {
      if (!dependency.fileName.startsWith('.')) throw new Error(`模块定义只能引用项目内代码：${dependency.fileName}`);
      const target = resolve(dirname(absolute), dependency.fileName.replace(/\.tsx?$/, '') + '.ts');
      if (!target.startsWith(resolve(root) + '/')) throw new Error('模块导入超出项目目录');
      compile(relative(root, target));
    }
    const result = ts.transpileModule(source, {
      fileName: absolute,
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
      transformers: { before: [context => node => ts.visitNode(node, function visitor(child) {
        if (ts.isImportDeclaration(child) && ts.isStringLiteral(child.moduleSpecifier)) {
          const specifier = child.moduleSpecifier.text.replace(/\.tsx?$/, '') + '.mjs';
          return ts.factory.updateImportDeclaration(child, child.modifiers, child.importClause, ts.factory.createStringLiteral(specifier), child.attributes);
        }
        return ts.visitEachChild(child, visitor, context);
      })] },
    });
    writeFileSync(output, result.outputText);
  }
  try { compile(entry); return await import(pathToFileURL(join(temporary, entry.replace(/\.tsx?$/, '.mjs'))).href); }
  finally { rmSync(temporary, { recursive: true, force: true }); }
}
