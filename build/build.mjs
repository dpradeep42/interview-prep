import fs from 'fs';
const data = fs.readFileSync('data.json','utf8').replace(/</g,'\\u003c');
const html = fs.readFileSync('template.html','utf8').replace('__DATA__', () => data);
fs.writeFileSync('../index.html', html);
fs.writeFileSync('../interview-prep.html', html);
console.log('ok', html.length);
