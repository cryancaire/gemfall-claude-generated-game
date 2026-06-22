const fs = require('fs');
const path = require('path');

function cleanPrompt(raw) {
  // Strip XML-style injected context tags (e.g. <ide_opened_file>, <ide_selection>, <system-reminder>)
  return raw.replace(/<[a-z_][\w]*(?:\s[^>]*)?>[\s\S]*?<\/[a-z_][\w]*>/gi, '').trim();
}

function makeTitle(text) {
  // Take the first sentence or line, capped at 60 chars
  const first = text.split(/[\n.!?]/)[0].trim();
  if (first.length <= 60) return first;
  const cut = first.slice(0, 60).replace(/\s+\S*$/, '');
  return cut + '...';
}

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { input += chunk; });
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const prompt = cleanPrompt(data.prompt || '');

    if (prompt.length < 20) process.exit(0);

    const file = path.resolve(__dirname, '../../src/data/prompts.js');
    let content = fs.readFileSync(file, 'utf8');

    const matches = [...content.matchAll(/\bid:\s*(\d+)/g)];
    const lastId = Math.max(...matches.map(m => parseInt(m[1], 10)));
    const newId = lastId + 1;

    const date = new Date().toISOString().slice(0, 10);
    const title = makeTitle(prompt).replace(/'/g, "\\'");

    const escaped = prompt
      .replace(/\\/g, '\\\\')
      .replace(/`/g, '\\`')
      .replace(/\$\{/g, '\\${');

    const entry = `\n\n  {\n    id: ${newId},\n    title: '${title}',\n    date: '${date}',\n    text: \`${escaped}\`,\n  },`;

    content = content.replace(/\s*\];\s*$/, `${entry}\n];`);

    fs.writeFileSync(file, content, 'utf8');
    process.exit(0);
  } catch (_) {
    process.exit(0);
  }
});
