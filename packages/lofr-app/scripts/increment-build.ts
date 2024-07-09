import fs from 'fs';
const version = parseInt(fs.readFileSync('./src/build-version.json', 'utf-8')) + 1;
fs.writeFileSync('./src/build-version.json', `${version}`);
