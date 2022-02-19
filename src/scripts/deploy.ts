import { NS } from "../NetscriptDefinitions";
import { discoverHosts, getServer, Servers } from "./discovery";

export async function main(ns: NS) {
  ns.clearLog();

  const target = ns.args[0] as string;
  if (ns.args.some((arg) => typeof arg !== "string")) {
    throw new Error("Args must be strings");
  }

  const { servers, stats: serverStats } = discoverHosts(ns);

  const scriptName = "simple.script";

  const targetServer = getServer(target, servers);
  const script = targetServer.getServerPropertiesInScript() + getScriptByName(scriptName)(target);

  await ns.write(scriptName, script, "w");
  for (let host in servers) {
    try {
      const server = servers[host];
      if (!server.hasAdminRights) continue;

      const instances = Math.floor(server.maxRam / ns.getScriptRam(scriptName));
      if (instances > 0) {
        await ns.scp(scriptName, server.hostname);

        ns.killall(server.hostname);
        await ns.sleep(250);

        ns.exec(scriptName, server.hostname, instances);
        await ns.sleep(250);
      }
    } catch (err) {
      throw new Error(JSON.stringify(err, null, 2));
    }
  }
}

export function getScriptByName(name): (target, ...args: string[]) => string {
  interface HackConfig {
    use: boolean;
    delay: number;
  }
  const scripts = {
    // 2.2gb ram with serverProperties inserted
    "simple.script": (target: string) => `
      var target = "${target}";
      var moneyThresh = moneyMax * 0.75;
      var securityThresh = minDifficulty + 5;
  
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

    "delay-operator.js": (target, grow: HackConfig, weaken: HackConfig, hack: HackConfig) => `
    /** @param {NS} ns **/
    export async function main(ns) {
      if("${grow.use}") sleep("${grow.delay}").then(() => grow("${target}")); 
      if("${weaken.use}") sleep("${weaken.delay}").then(() => weaken(${target}")); 
      if("${hack.use}") sleep("${hack.delay}").then(() => hack(${target}")); 
    }
      `,

    "delay-grow.script": (target, delay) => `
      var target = "${target}"
      
      sleep(${delay}) 
      grow(target)
      `,
    "delay-weaken.script": (target, delay) => `
      var target = "${target}"
      
      sleep(${delay}) 
      weaken(target)
      `,
    "delay-hack.script": (target, delay) => `
      var target = "${target}"
      
      sleep(${delay}) 
      grow(target)
      `,
  };
  return scripts[name];
}
("peirce ");
