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

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('autoDateFile.createFile', async () => {
    try {
  await createCppFileInWorkspaceRoot();
    } catch (err: any) {
      vscode.window.showErrorMessage(`Failed to create file: ${err?.message ?? err}`);
    }
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}
