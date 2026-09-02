import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const walk = (directory: string): string[] =>
  fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  });

describe("production isolation", () => {
  it("contains no production endpoint or direct network client in runtime source", () => {
    const sourceRoot = path.resolve(process.cwd(), "client/src");
    const runtimeFiles = walk(sourceRoot).filter(
      (file) => !file.endsWith(".test.ts") && !file.endsWith(".d.ts"),
    );
    const source = runtimeFiles.map((file) => fs.readFileSync(file, "utf8")).join("\n");

    expect(source).not.toMatch(/infiniteawareness\.online/i);
    expect(source).not.toMatch(/\bfetch\s*\(/);
    expect(source).not.toMatch(/\bXMLHttpRequest\b/);
    expect(source).not.toMatch(/\bWebSocket\b/);
    expect(source).not.toMatch(/\baxios\b/);
  });
});

