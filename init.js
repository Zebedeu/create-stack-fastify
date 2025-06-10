#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

function mkdir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

const baseDirs = [
  ".github",
  ".husky",
  ".nova",
  "jenkins",
  "migrations",
  "prisma",
  "src",
  "tests",
];

const srcDirs = ["config", "core", "shared", "routes"];

const coreDirs = ["csa"];

const csaDirs = ["application", "domain", "infra", "module"];

const configDirs = ["client", "swaggers"];

const sharedDirs = ["common", "domain", "interfaces", "types"];

const configFiles = [
  "column.ts",
  "constants.ts",
  "db-connection.ts",
  "swagger.ts",
  "typeorm.connection.ts",
];

function main() {
  const projectName = process.argv[2];
  if (!projectName) {
    console.error("Uso: create-stack-fastify <nome-do-projeto>");
    process.exit(1);
  }

  // Cria estrutura de diretórios
  baseDirs.forEach((dir) => mkdir(path.join(projectName, dir)));
  srcDirs.forEach((dir) => mkdir(path.join(projectName, "src", dir)));
  coreDirs.forEach((dir) => mkdir(path.join(projectName, "src", "core", dir)));
  csaDirs.forEach((dir) => mkdir(path.join(projectName, "src", "core", "csa", dir)));
  configDirs.forEach((dir) =>
    mkdir(path.join(projectName, "src", "config", dir))
  );
  configFiles.forEach((file) =>
    fs.writeFileSync(path.join(projectName, "src", "config", file), "")
  );
  sharedDirs.forEach((dir) =>
    mkdir(path.join(projectName, "src", "shared", dir))
  );

  // Garante que a pasta http exista
  const httpDir = path.join(projectName, "src", "core", "infra", "http");
  mkdir(httpDir);

  // Copia app.ts do template para src/core/infra/http/app.ts
  const appTsTemplate = path.join(__dirname, "template", "app.ts");
  const appTsTarget = path.join(httpDir, "app.ts");
  if (fs.existsSync(appTsTemplate)) {
    fs.copyFileSync(appTsTemplate, appTsTarget);
  } else {
    fs.writeFileSync(appTsTarget, "// Fastify app entry\n");
    console.warn(
      "Aviso: Não foi encontrado template/app.ts, criado arquivo vazio."
    );
  }

  // Cria server.ts em src/core/infra/http/server.ts
  fs.writeFileSync(
    path.join(httpDir, "server.ts"),
    `// Fastify server bootstrap
import app from './app';

app.listen({ port: 3000 }, (err, address) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  app.log.info(\`Server listening on \${address}\`);
});
`
  );

  // Cria README.md
  fs.writeFileSync(
    path.join(projectName, "README.md"),
    `# ${projectName}\n\nProjeto gerado com create-stack-fastify\n`
  );

  // Cria package.json
  const packageJsonTemplatePath = path.join(
    __dirname,
    "template",
    "packagejson"
  );
  const packageJsonTargetPath = path.join(projectName, "package.json");

  if (fs.existsSync(packageJsonTemplatePath)) {
    let content = fs.readFileSync(packageJsonTemplatePath, "utf-8");
    content = content.replace(/{{projectName}}/g, projectName);
    fs.writeFileSync(packageJsonTargetPath, content);
  } else {
    console.warn(
      "Aviso: template/packagejson não encontrado. Criando package.json padrão."
    );
    fs.writeFileSync(packageJsonTargetPath, JSON.stringify({
      name: projectName,
      version: "1.0.0",
      main: "dist/core/infra/http/server.js",
      scripts: {
        dev: "ts-node src/core/infra/http/server.ts",
        build: "tsc",
        start: "node dist/core/infra/http/server.js"
      },
      _moduleAliases: {
        "@core": "dist/core"
      }
    }, null, 2));
  }

  // Instala dependências
  console.log("Instalando dependências com npm install...");
  execSync("npm install", { cwd: projectName, stdio: "inherit" });
  console.log(`Projeto ${projectName} criado e dependências instaladas!`);
  console.log(`Para começar:`);
  console.log(`  cd ${projectName}`);
  console.log(`  npm run dev\n`);
}

main();
