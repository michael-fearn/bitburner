import { NS } from "../NetscriptDefinitions";
import { EnrichedServer, wrapServer } from "./server";

interface AggregatedServerStats {
  rootedHosts: number;
  maxRam: number;
  availableRam: number;
  ramUsed: number;
  totalHosts: number;
}

export type Servers = Record<string, EnrichedServer>;
export const servers: Servers = {};

export function discoverHosts(ns: NS, host?: string, servers: Servers = {}, stats = getNewStatsObject()) {
  const blacklist = ["darkweb", "home"];
  if (blacklist.includes(host) || servers[host]) return;

  const hosts = ns.scan(host).filter((host) => !blacklist.includes(host));

  if (host) {
    servers[host] = wrapServer(ns, host);
    const server = servers[host];

    if (server.hasAdminRights) {
      stats.rootedHosts++;
      stats.maxRam += server.maxRam;
      stats.availableRam += server.maxRam - server.ramUsed;
      stats.ramUsed += server.ramUsed;
    }
    stats.totalHosts++;
  }

  for (let _host of hosts) {
    discoverHosts(ns, _host, servers, stats);
  }

  return { servers, stats };
}

export function getServer(hostname: string, servers: Servers) {
  return servers[hostname];
}

function getNewStatsObject(): AggregatedServerStats {
  return {
    maxRam: 0,
    ramUsed: 0,
    availableRam: 0,
    totalHosts: 0,
    rootedHosts: 0,
  };
}
