import { promises as fs } from 'fs';
import * as path from 'path';
import type { BattleSampleV1, FileHeader } from './schema.v1';

export async function exportLearnAsNDJSON(world: any, dir = 'saves/learn'): Promise<string> {
  const learn = world.learn;
  if (!learn) throw new Error('world.learn is undefined - attach collector first');
  const header: FileHeader | null = learn.header ?? null;
  const rows: BattleSampleV1[] = learn.rows ?? [];
  if (!header) throw new Error('collector header missing');

  const seed = (rows[0]?.seed ?? world.seed ?? 0) as number;
  const ts = header.ts ?? Date.now();
  const file = `${seed}-${ts}.ndjson`;
  const outDir = path.resolve(dir);
  await fs.mkdir(outDir, { recursive: true });
  const fullPath = path.join(outDir, file);

  const lines: string[] = [];
  lines.push(JSON.stringify({ type: 'header', ...header }));
  for (const row of rows) lines.push(JSON.stringify({ type: 'sample', ...row }));
  lines.push(JSON.stringify({ type: 'meta', total: rows.length }));

  await fs.writeFile(fullPath, lines.join('\n') + '\n', 'utf8');
  return fullPath;
}
