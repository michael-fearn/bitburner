import { NS } from "../NetscriptDefinitions.js";
import { Server } from "./server";

const servers: Record<string, Server> = {};
/** @param {NS} ns **/
export async function main(ns: NS) {
  ns.clearLog();
  const target = "joesguns";
  const scriptName = "simple-hack.script";

  crawlHost(ns);
  const targetServer = servers[target];

  for (let host in servers) {
    try {
      const server = servers[host];
      if (!server.isRoot) continue;

      const script = targetServer.getServerPropertiesInScript() + getScriptByName(scriptName, target);

      const threads = Math.floor(server.maxRam / ns.getScriptRam(scriptName));
      if (threads > 0) {
        await ns.write(scriptName, script, "w");
        await ns.scp(scriptName, server.hostname);

        ns.killall(server.hostname);
        ns.exec(scriptName, server.hostname, threads);
        await ns.sleep(100);
      }
    } catch (err) {
      throw new Error(JSON.stringify(err, null, 2));
    }
  }
}

function crawlHost(ns: NS, host: string = "home"): Server[] {
  const blacklist = ["darkweb"];

  const hosts = ns.scan(host).filter((_host) => !blacklist.includes(_host));

  if (servers[host]) return;
  if (host !== "home") servers[host] = new Server(host, ns);

  for (let _host of hosts) {
    crawlHost(ns, _host);
  }
}

export function getScriptByName(name: string, target: string): string {
  const scripts = {
    // 2.2gb ram with serverProperties inserted
    "simple-hack.script": `
      var target = "${target}";
      var moneyThresh = maxMoney * 0.75;
      var securityThresh = minSecurityLevel + 5;
  
      while(true) {
          if (getServerSecurityLevel(target) > securityThresh) {
              weaken(target);
          } else if (getServerMoneyAvailable(target) < moneyThresh) {
              grow(target);
          } else {
              hack(target);
          }
      }
      `,
  };
  return scripts[name];
}
