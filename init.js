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
  csaDirs.forEach((dir) =>
    mkdir(path.join(projectName, "src", "core", dir))
  );
  configDirs.forEach((dir) =>
    mkdir(path.join(projectName, "src", "config", dir))
  );
  configFiles.forEach((file) =>
    fs.writeFileSync(path.join(projectName, "src", "config", file), "")
  );
  sharedDirs.forEach((dir) =>
    mkdir(path.join(projectName, "src", "shared", dir))
  );

  // Copia app.js do template
  const appJsTemplate = path.join(__dirname, "template", "app.ts");
  const appJsTarget = path.join(projectName, "src", "app.js");
  if (fs.existsSync(appJsTemplate)) {
    fs.copyFileSync(appJsTemplate, appJsTarget);
  } else {
    fs.writeFileSync(appJsTarget, "// Fastify app entry\n");
    console.warn(
      "Aviso: Não foi encontrado template/app.js, criado arquivo vazio."
    );
  }

  // Cria server.js
  fs.writeFileSync(
    path.join(projectName, "src", "server.js"),
    `// Fastify server bootstrap
const app = require('./app');
app.listen({ port: 3000 }, (err, address) => {
  if (err) { app.log.error(err); process.exit(1); }
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
    const defaultPkg = {
      name: projectName,
      version: "1.0.0",
      description: "Projeto gerado com create-stack-fastify",
      main: "src/server.js",
      scripts: {
        dev: "node src/server.js",
      },
      dependencies: {
        fastify: "^4.0.0",
      },
    };
    fs.writeFileSync(
      packageJsonTargetPath,
      JSON.stringify(defaultPkg, null, 2)
    );
  }

  // Instala dependências
  console.log("Instalando dependências com npm install...");
  execSync('npm install', { cwd: projectName, stdio: 'inherit' });
  console.log(`Projeto ${projectName} criado e dependências instaladas!`);
  console.log(`Para começar:`);
  console.log(`  cd ${projectName}`);
  console.log(`  npm run dev\n`);
}

main();
