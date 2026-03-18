const [major, minor] = process.versions.node.split('.').map(Number);

const isSupported = major === 22 && minor >= 0;

if (isSupported) {
  process.exit(0);
}

console.error('');
console.error('Unsupported Node.js version detected.');
console.error(`Current version: ${process.versions.node}`);
console.error('Required version: Node.js 22.x LTS');
console.error('');
console.error('This project uses Angular 19.1.x. According to Angular compatibility guidance,');
console.error('the supported Node.js majors are 18, 20, and 22, but this repository is pinned');
console.error('to Node 22 to avoid runtime and build instability on newer majors such as Node 25.');
console.error('');
console.error('Use one of these before running npm scripts:');
console.error('  nvm use');
console.error('  fnm use');
console.error('  volta install node@22');
console.error('');
process.exit(1);
