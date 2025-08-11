"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/extension.ts
var extension_exports = {};
__export(extension_exports, {
  activate: () => activate,
  deactivate: () => deactivate
});
module.exports = __toCommonJS(extension_exports);
var vscode = __toESM(require("vscode"));
var path = __toESM(require("path"));
var fs = __toESM(require("fs/promises"));
function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}
var CPP_TEMPLATE = `
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
async function getNextSerial(dir, prefix) {
  let max = 0;
  try {
    const entries = await fs.readdir(dir);
    for (const name of entries) {
      const match = name.match(new RegExp(`^${prefix}-([0-9]{3})\\.cpp$`));
      if (match) {
        const n = parseInt(match[1], 10);
        if (!Number.isNaN(n))
          max = Math.max(max, n);
      }
    }
  } catch {
  }
  const next = (max + 1).toString().padStart(3, "0");
  return next;
}
async function createCppFileInWorkspaceRoot() {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    vscode.window.showErrorMessage("No workspace folder open.");
    return;
  }
  const root = folders[0].uri.fsPath;
  const targetDir = root;
  const today = formatDate(/* @__PURE__ */ new Date());
  const serial = await getNextSerial(targetDir, today);
  const fileName = `${today}-${serial}.cpp`;
  const filePath = path.join(targetDir, fileName);
  await fs.writeFile(filePath, CPP_TEMPLATE, { encoding: "utf8" });
  const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(filePath));
  await vscode.window.showTextDocument(doc, { preview: false });
}
function activate(context) {
  const disposable = vscode.commands.registerCommand("autoDateFile.createFile", async () => {
    try {
      await createCppFileInWorkspaceRoot();
    } catch (err) {
      vscode.window.showErrorMessage(`Failed to create file: ${(err == null ? void 0 : err.message) ?? err}`);
    }
  });
  context.subscriptions.push(disposable);
}
function deactivate() {
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  deactivate
});
//# sourceMappingURL=extension.js.map
