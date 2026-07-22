import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

export function validateEnvironment(source, options = {}) {
  const values = Object.fromEntries(source.split(/\r?\n/).filter((line) => line.trim() && !line.trim().startsWith("#")).map((line) => {
    const index = line.indexOf("=");
    return index < 0 ? [line.trim(), ""] : [line.slice(0, index).trim(), line.slice(index + 1).trim()];
  }));
  const required = ["VITE_SUPABASE_URL", "VITE_SUPABASE_PUBLISHABLE_KEY"];
  const missing = required.filter((name) => !(name in values));
  const errors = missing.map((name) => `${name} 항목이 없습니다.`);
  if (options.requireValues) for (const name of required) if (name in values && !values[name]) errors.push(`${name} 값을 입력하세요.`);
  if (values.VITE_SUPABASE_URL && !/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(values.VITE_SUPABASE_URL)) errors.push("VITE_SUPABASE_URL 형식이 올바르지 않습니다.");
  if (/service[_-]?role|secret/i.test(values.VITE_SUPABASE_PUBLISHABLE_KEY ?? "")) errors.push("브라우저에는 Secret/Service Role Key를 사용할 수 없습니다.");
  return errors;
}

async function main() {
  const file = process.argv[2];
  if (!file) throw new Error("검사할 환경파일 경로가 필요합니다.");
  const errors = validateEnvironment(await readFile(file, "utf8"), { requireValues: process.argv.includes("--require-values") });
  if (errors.length) { console.error(errors.join("\n")); process.exitCode = 1; }
  else console.log("환경변수 이름과 공개키 안전 규칙을 확인했습니다.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
