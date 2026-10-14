import { spawn } from "node:child_process";
import process from "node:process";

const serverMode = process.argv[2] === "production" ? "start" : "dev";
const server = process.platform === "win32"
  ? spawn(process.env.ComSpec ?? "cmd.exe", ["/d", "/s", "/c", `npm run ${serverMode}`], { stdio: ["inherit", "pipe", "inherit"] })
  : spawn("npm", ["run", serverMode], { stdio: ["inherit", "pipe", "inherit"] });
let output = "";
let browserOpened = false;

server.stdout.on("data", (chunk) => {
  process.stdout.write(chunk);
  output = (output + chunk.toString()).slice(-1000);
  const match = output.match(/Local:\s+(https?:\/\/[^\s]+)/);
  if (match && !browserOpened) {
    browserOpened = true;
    openBrowser(match[1]);
  }
});
server.on("error", (error) => {
  console.error(`Could not start the blog server: ${error.message}`);
  process.exitCode = 1;
});
server.on("exit", (code) => { process.exitCode = code ?? 1; });

function openBrowser(url) {
  const command = process.platform === "win32" ? ["cmd.exe", ["/c", "start", "", url]]
    : process.platform === "darwin" ? ["open", [url]] : ["xdg-open", [url]];
  const opener = spawn(command[0], command[1], { detached: true, stdio: "ignore" });
  opener.on("error", () => console.log(`Open ${url} in your browser.`));
  opener.unref();
}