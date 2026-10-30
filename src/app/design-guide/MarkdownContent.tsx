import type { ReactNode } from 'react';
import { safeExternalUrl } from './content';

function inline(text:string):ReactNode[] {
  return text.split(/(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|`[^`]+`)/g).map((part,index)=>{
    const link=part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if(link){const href=safeExternalUrl(link[2]);return href?<a key={index} href={href} target="_blank" rel="noopener noreferrer">{link[1]} ↗</a>:<span key={index}>{link[1]}</span>;}
    if(part.startsWith('**'))return <strong key={index}>{part.slice(2,-2)}</strong>;
    if(part.startsWith('`'))return <code key={index}>{part.slice(1,-1)}</code>;
    return part;
  });
}
/** Renders the small Markdown subset used by the guide; HTML remains plain text. */
export function MarkdownContent({source}:{source:string}) {
  const lines=source.split('\n');const blocks:ReactNode[]=[];
  for(let i=0;i<lines.length;i++){
    const line=lines[i].trim();if(!line)continue;
    if(line.startsWith('|')){
      const rows:string[][]=[];
      while(i<lines.length&&lines[i].trim().startsWith('|')){
        const cells=lines[i].trim().slice(1,-1).split('|').map(cell=>cell.trim());
        if(!cells.every(cell=>/^:?-+:?$/.test(cell)))rows.push(cells);i++;
      }
      i--;blocks.push(<div className="design-table-scroll" key={i}><table><thead><tr>{rows[0]?.map((cell,j)=><th key={j}>{inline(cell)}</th>)}</tr></thead><tbody>{rows.slice(1).map((row,j)=><tr key={j}>{row.map((cell,k)=><td key={k}>{inline(cell)}</td>)}</tr>)}</tbody></table></div>);continue;
    }
    if(/^[-*] |^\d+\. /.test(line)){
      const ordered=/^\d/.test(line);const items:ReactNode[]=[];
      while(i<lines.length&&(ordered?/^\d+\. /:/^[-*] /).test(lines[i].trim())){items.push(<li key={i}>{inline(lines[i].trim().replace(/^([-*]|\d+\.) /,''))}</li>);i++;}
      i--;blocks.push(ordered?<ol key={i}>{items}</ol>:<ul key={i}>{items}</ul>);continue;
    }
    if(line.startsWith('### ')){blocks.push(<h3 key={i}>{inline(line.slice(4))}</h3>);continue;}
    if(line.startsWith('## ')){blocks.push(<h3 key={i}>{inline(line.slice(3))}</h3>);continue;}
    blocks.push(<p key={i}>{inline(line)}</p>);
  }
  return <div className="design-prose">{blocks}</div>;
}
