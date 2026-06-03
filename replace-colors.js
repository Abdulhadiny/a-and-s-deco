const fs = require('fs');
const path = require('path');

function walkSync(dir, filelist = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filepath = path.join(dir, file);
    const stat = fs.statSync(filepath);
    if (stat.isDirectory()) {
      if (!filepath.includes('node_modules') && !filepath.includes('.next') && !filepath.includes('.git')) {
        filelist = walkSync(filepath, filelist);
      }
    } else if (filepath.endsWith('.tsx') || filepath.endsWith('.ts')) {
      filelist.push(filepath);
    }
  }
  return filelist;
}

const files = walkSync(path.join(process.cwd(), 'src'));

let replacements = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  // Backgrounds
  content = content.replace(/bg-zinc-950/g, 'bg-card');
  content = content.replace(/bg-zinc-900\/50/g, 'bg-muted/50');
  content = content.replace(/bg-zinc-900\/30/g, 'bg-muted/30');
  content = content.replace(/bg-zinc-900/g, 'bg-muted');
  content = content.replace(/bg-zinc-800\/50/g, 'bg-accent/50');
  content = content.replace(/bg-zinc-800/g, 'bg-accent');
  
  // Borders
  content = content.replace(/border-zinc-900/g, 'border-border/50');
  content = content.replace(/border-zinc-800/g, 'border-border');
  content = content.replace(/border-zinc-700/g, 'border-border');
  
  // Text
  content = content.replace(/text-zinc-100/g, 'text-foreground');
  content = content.replace(/text-zinc-200/g, 'text-foreground/90');
  content = content.replace(/text-zinc-300/g, 'text-foreground/80');
  content = content.replace(/text-zinc-400/g, 'text-muted-foreground');
  content = content.replace(/text-zinc-500/g, 'text-muted-foreground');
  content = content.replace(/text-zinc-600/g, 'text-muted-foreground/70');
  
  // Hover Backgrounds
  content = content.replace(/hover:bg-zinc-900/g, 'hover:bg-muted');
  content = content.replace(/hover:bg-zinc-800\/50/g, 'hover:bg-accent/50');
  content = content.replace(/hover:bg-zinc-800/g, 'hover:bg-accent');
  
  // Hover Text
  content = content.replace(/hover:text-zinc-100/g, 'hover:text-foreground');
  content = content.replace(/hover:text-zinc-200/g, 'hover:text-foreground/90');
  
  // Focus ring
  content = content.replace(/focus:ring-offset-zinc-900/g, 'focus:ring-offset-background');

  if (original !== content) {
    fs.writeFileSync(file, content, 'utf8');
    replacements++;
    console.log(`Updated ${file}`);
  }
}

console.log(`Replaced zinc colors in ${replacements} files.`);
