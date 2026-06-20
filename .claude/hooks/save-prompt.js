const fs = require('fs');
const path = require('path');

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { input += chunk; });
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const prompt = (data.prompt || '').trim();

    if (prompt.length < 20) process.exit(0);

    const file = path.resolve(__dirname, '../../src/data/prompts.js');
    let content = fs.readFileSync(file, 'utf8');

    const matches = [...content.matchAll(/\bid:\s*(\d+)/g)];
    const lastId = Math.max(...matches.map(m => parseInt(m[1], 10)));
    const newId = lastId + 1;

    const date = new Date().toISOString().slice(0, 10);

    const escaped = prompt
      .replace(/\\/g, '\\\\')
      .replace(/`/g, '\\`')
      .replace(/\$\{/g, '\\${');

    const entry = `\n\n  {\n    id: ${newId},\n    title: 'Prompt ${newId}',\n    date: '${date}',\n    text: \`${escaped}\`,\n  },`;

    content = content.replace(/\s*\];\s*$/, `${entry}\n];`);

    fs.writeFileSync(file, content, 'utf8');
    process.exit(0);
  } catch (_) {
    process.exit(0);
  }
});
