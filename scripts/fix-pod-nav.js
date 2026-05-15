const fs = require('fs');
const fp = 'C:/Users/jcuad/OneDrive/Documents/NexLogistics/app/(app)/pod/page.tsx';
let c = fs.readFileSync(fp, 'utf8');

const navIdx = c.indexOf('Bottom nav', c.indexOf('DriverPodList'));
const si = c.lastIndexOf('{/*', navIdx);
const ei = c.indexOf('</nav>', navIdx) + 6;

console.log('si:', si, 'ei:', ei);
if (si === -1 || ei < 6) { console.log('NOT FOUND'); process.exit(1); }

c = c.slice(0, si) + '<DriverNav active={"pod"} />' + c.slice(ei);
fs.writeFileSync(fp, c, 'utf8');

const n = fs.readFileSync(fp, 'utf8');
console.log('DriverNav present:', n.includes('DriverNav active'));
console.log('Old nav gone (MoreHorizontal):', !n.includes('MoreHorizontal'));
