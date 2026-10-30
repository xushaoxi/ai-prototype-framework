export interface DesignChapter { id:string; title:string; body:string }
export function parseChapters(markdown:string):DesignChapter[] {
  return [...markdown.matchAll(/^## (\d{2}) (.+)\n([\s\S]*?)(?=^## |$(?![\s\S]))/gm)]
    .map(match=>({id:match[1],title:match[2],body:match[3].trim()}));
}
export function safeExternalUrl(value:string):string|undefined {
  if(!/^https?:\/\//i.test(value))return undefined;
  try { const url=new URL(value);return ['http:','https:'].includes(url.protocol)?url.href:undefined; }
  catch { return undefined; }
}

export interface DesignRule {id:string;title:string;body:string;decision:string;implementation:string;coverage:string;remaining:string;verification:string;evidence:string;examples:string[]}
export function parseRules(markdown:string):DesignRule[]{
  return [...markdown.matchAll(/^## ([A-Z]+-\d+)：(.+)\n([\s\S]*?)(?=^## |$(?![\s\S]))/gm)].map(match=>({
    id:match[1],title:match[2],body:match[3].trim(),
    decision:match[3].match(/^决策状态：(.+)$/m)?.[1]??'待讨论',
    implementation:match[3].match(/^实现状态：(.+)$/m)?.[1]??'未实现',
    coverage:match[3].match(/^覆盖能力：(.+)$/m)?.[1]??'未记录',remaining:match[3].match(/^未覆盖：(.+)$/m)?.[1]??'未记录',verification:match[3].match(/^验证状态：(.+)$/m)?.[1]??'未记录',evidence:match[3].match(/^证据入口：(.+)$/m)?.[1]??'未记录',examples:(match[3].match(/^示例入口：(.+)$/m)?.[1]??'').split(',').map(route=>route.trim()).filter(Boolean),
  }));
}
