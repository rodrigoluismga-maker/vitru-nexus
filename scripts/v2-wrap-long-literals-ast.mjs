import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const roots = [path.resolve("client/src"), path.resolve("server")];

function collect(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return collect(target);
    return entry.isFile() && /\.(ts|tsx)$/.test(target) ? [target] : [];
  });
}

function splitText(value) {
  if (value.length < 78 || !value.includes(" ")) return null;
  const midpoint = Math.floor(value.length / 2);
  let index = value.lastIndexOf(" ", midpoint);
  if (index < 30) index = value.indexOf(" ", midpoint);
  if (index < 30 || index >= value.length - 20) return null;
  return [value.slice(0, index + 1), value.slice(index + 1)];
}

function stringExpression(value) {
  const parts = splitText(value);
  if (!parts) return ts.factory.createStringLiteral(value);
  return ts.factory.createBinaryExpression(
    stringExpression(parts[0]),
    ts.SyntaxKind.PlusToken,
    stringExpression(parts[1])
  );
}

function isModuleSpecifier(node) {
  const parent = node.parent;
  return (
    (ts.isImportDeclaration(parent) && parent.moduleSpecifier === node) ||
    (ts.isExportDeclaration(parent) && parent.moduleSpecifier === node) ||
    (ts.isExternalModuleReference(parent) && parent.expression === node)
  );
}

function templateExpression(node) {
  let expression = stringExpression(node.head.text);
  for (const span of node.templateSpans) {
    expression = ts.factory.createBinaryExpression(
      expression,
      ts.SyntaxKind.PlusToken,
      span.expression
    );
    if (span.literal.text) {
      expression = ts.factory.createBinaryExpression(
        expression,
        ts.SyntaxKind.PlusToken,
        stringExpression(span.literal.text)
      );
    }
  }
  return expression;
}

let changed = 0;
for (const file of roots.flatMap(collect)) {
  if (file.includes(`${path.sep}components${path.sep}ui${path.sep}`)) continue;
  const source = fs.readFileSync(file, "utf8");
  if (!source.split("\n").some(line => line.length > 140)) continue;

  const sourceFile = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );

  const transformer = context => {
    const visit = node => {
      if (
        ts.isJsxAttribute(node) &&
        node.initializer &&
        ts.isStringLiteral(node.initializer) &&
        splitText(node.initializer.text)
      ) {
        return ts.factory.updateJsxAttribute(
          node,
          node.name,
          ts.factory.createJsxExpression(undefined, stringExpression(node.initializer.text))
        );
      }
      if (
        ts.isStringLiteral(node) &&
        !ts.isJsxAttribute(node.parent) &&
        !isModuleSpecifier(node) &&
        splitText(node.text)
      ) {
        return stringExpression(node.text);
      }
      if (
        ts.isNoSubstitutionTemplateLiteral(node) &&
        !ts.isTaggedTemplateExpression(node.parent) &&
        splitText(node.text)
      ) {
        return stringExpression(node.text);
      }
      if (
        ts.isTemplateExpression(node) &&
        !ts.isTaggedTemplateExpression(node.parent) &&
        node.getText(sourceFile).length > 110
      ) {
        return templateExpression(node);
      }
      return ts.visitEachChild(node, visit, context);
    };
    return node => ts.visitNode(node, visit);
  };

  const result = ts.transform(sourceFile, [transformer]);
  const output = ts
    .createPrinter({ newLine: ts.NewLineKind.LineFeed })
    .printFile(result.transformed[0]);
  result.dispose();
  fs.writeFileSync(file, output);
  changed += 1;
}

console.log(`Arquivos transformados por AST: ${changed}`);
