import { NS, Server } from "../NetscriptDefinitions";

interface AdditionalMethods {
  getServerPropertiesInScript(): string;
}

export type EnrichedServer = Server & AdditionalMethods;

export function wrapServer(ns: NS, hostname: string): EnrichedServer {
  // @ts-expect-error missing method
  const server: EnrichedServer = ns.getServer(hostname);

  if (!server.hasAdminRights) autoNook(ns, server);

  server.getServerPropertiesInScript = function () {
    return (
      "\n" +
      Object.keys({ ...server })
        .filter((key) => !["getServerPropertiesInScript"].includes(key))
        .map((key) => {
          return (
            "var " + key + " = " + (typeof server[key] === "string" ? `"${server[key]}"` : server[key]) + "\n"
          );
        })
        .join("") +
      "\n\n"
    );
  };

  return server;
}

export function autoNook(ns: NS, server: Server): void {
  const programs = {
    "BruteSSH.exe": ns.brutessh,
    "FTPCrack.exe": ns.ftpcrack,
    "relaySMTP.exe": ns.relaysmtp,
    "HTTPWorm.exe": ns.httpworm,
    "SQLInject.exe": ns.sqlinject,
  };

  let portsOpened = 0;

  for (let program in programs) {
    if (ns.fileExists(program)) {
      programs[program](server.hostname);
      portsOpened++;
    }
  }
  if (server.numOpenPortsRequired <= portsOpened) ns.nuke(server.hostname);
  server.hasAdminRights = ns.hasRootAccess(server.hostname);
}
