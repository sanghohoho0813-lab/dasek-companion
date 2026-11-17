// public/assets 의 실제 사진 파일을 스캔해 매니페스트를 만든다.
// 사용: 사진을 public/assets/hero_main.jpg 처럼 슬롯 이름으로 넣고 `npm run assets:scan`
import { readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const dir = join(process.cwd(), 'public', 'assets');
const files = readdirSync(dir).filter((f) => /\.(jpe?g|png|webp|avif)$/i.test(f));
const manifest = Object.fromEntries(files.map((f) => [f.replace(/\.[^.]+$/, ''), `/assets/${f}`]));
writeFileSync(join(process.cwd(), 'src', 'lib', 'assets.manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`assets: ${files.length} file(s) registered`, Object.keys(manifest));
