import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import { existsSync } from 'fs';

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

const CPP_TEMPLATE = `
#include <iostream>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int test;
    cin >> test;
    while (test--) {
        // Your code here
    }

  return 0;
}
`;

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

async function getNextSerial(dir: string, prefix: string): Promise<string> {
  // Look for files like YYYYMMDD-XXX.cpp
  let max = 0;
  try {
    const entries = await fs.readdir(dir);
    for (const name of entries) {
      const match = name.match(new RegExp(`^${prefix}-([0-9]{3})\\.cpp$`));
      if (match) {
        const n = parseInt(match[1], 10);
        if (!Number.isNaN(n)) max = Math.max(max, n);
      }
    }
  } catch {
    // ignore
  }
  const next = (max + 1).toString().padStart(3, '0');
  return next;
}

async function createCppFileInWorkspaceRoot() {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    vscode.window.showErrorMessage('No workspace folder open.');
    return;
  }
  const root = folders[0].uri.fsPath;
  const targetDir = root; // Create directly in workspace root
  const today = formatDate(new Date());
  const serial = await getNextSerial(targetDir, today);
  const fileName = `${today}-${serial}.cpp`;
  const filePath = path.join(targetDir, fileName);

  await fs.writeFile(filePath, CPP_TEMPLATE, { encoding: 'utf8' });

  const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(filePath));
  await vscode.window.showTextDocument(doc, { preview: false });
}

function parseDateFromCppFileName(name: string): string | null {
  const m = name.match(/^(\d{8})-\d{3}\.cpp$/);
  return m ? m[1] : null;
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function moveFileOverwrite(src: string, dest: string) {
  await ensureDir(path.dirname(dest));
  try {
    await fs.rename(src, dest);
  } catch (e: any) {
    if (e.code === 'EXDEV') {
      await fs.copyFile(src, dest);
      await fs.unlink(src);
    } else if (e.code === 'EEXIST') {
      await fs.rm(dest, { force: true });
      await fs.rename(src, dest);
    } else {
      // try overwrite by copy
      await fs.copyFile(src, dest);
      await fs.unlink(src);
    }
  }
}

async function moveDirMerge(srcDir: string, destDir: string) {
  await ensureDir(destDir);
  const entries = await fs.readdir(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const s = path.join(srcDir, entry.name);
    const d = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      await moveDirMerge(s, d);
    } else {
      await moveFileOverwrite(s, d);
    }
  }
  // remove now-empty source directory
  await fs.rmdir(srcDir).catch(() => {});
}

async function archiveCppAndOut() {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    vscode.window.showErrorMessage('No workspace folder open.');
    return;
  }
  const root = folders[0].uri.fsPath;

  const entries = await fs.readdir(root);
  const cppFiles = entries.filter((n) => n.toLowerCase().endsWith('.cpp'));
  if (cppFiles.length === 0) {
    vscode.window.showWarningMessage('No .cpp files found to archive.');
    return;
  }

  // Determine earliest date from filenames matching YYYYMMDD-XXX.cpp
  const dated = cppFiles
    .map((n) => ({ name: n, date: parseDateFromCppFileName(n) }))
    .filter((x) => x.date !== null) as { name: string; date: string }[];

  if (dated.length === 0) {
    vscode.window.showWarningMessage('No dated C++ files (YYYYMMDD-XXX.cpp) found to derive archive date.');
    return;
  }

  const earliest = dated.map((x) => x.date).sort()[0]!;
  const archivesDir = path.join(root, 'archives');
  const targetDir = path.join(archivesDir, earliest);
  await ensureDir(targetDir);

  // Move all .cpp files (dated or not) into the target dir
  for (const name of cppFiles) {
    const src = path.join(root, name);
    const dest = path.join(targetDir, name);
    await moveFileOverwrite(src, dest);
  }

  // Move 'out' folder if present
  const outSrc = path.join(root, 'out');
  if (await pathExists(outSrc)) {
    const outDest = path.join(targetDir, 'out');
    if (await pathExists(outDest)) {
      await moveDirMerge(outSrc, outDest);
    } else {
      try {
        await fs.rename(outSrc, outDest);
      } catch {
        await moveDirMerge(outSrc, outDest);
      }
    }
  }

  const uri = vscode.Uri.file(targetDir);
  vscode.window.showInformationMessage(`Archived to ${uri.fsPath}`);
}

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('autoDateFile.createFile', async () => {
    try {
  await createCppFileInWorkspaceRoot();
    } catch (err: any) {
      vscode.window.showErrorMessage(`Failed to create file: ${err?.message ?? err}`);
    }
  });
  const disposable2 = vscode.commands.registerCommand('autoDateFile.archiveCppAndOut', async () => {
    try {
      await archiveCppAndOut();
    } catch (err: any) {
      vscode.window.showErrorMessage(`Failed to archive: ${err?.message ?? err}`);
    }
  });

  context.subscriptions.push(disposable, disposable2);
}

export function deactivate() {}
