import { NS } from "../NetscriptDefinitions";

export class Server {
  public portsOpen!: number;
  public portsRequired!: number;
  public hackingLevel!: number;
  public maxMoney!: number;
  public maxRam!: number;
  public minSecurityLevel!: number;
  public isRoot: boolean;

  constructor(public hostname: string, private ns: NS) {
    this.portsRequired = this.ns.getServerNumPortsRequired(this.hostname);
    this.minSecurityLevel = this.ns.getServerMinSecurityLevel(this.hostname);
    this.maxMoney = this.ns.getServerMaxMoney(this.hostname);
    this.maxRam = this.ns.getServerMaxRam(this.hostname);

    if (ns.hasRootAccess(this.hostname)) {
      this.isRoot = true;
      return;
    } else {
      this.isRoot = autoNook(ns, this);
    }
  }

  // public async executeScript(
  //   filename: string,
  //   script: string,
  //   threads: number,
  //   ...args: string[]
  // ): Promise<boolean> {
  //   if (!this.ns.hasRootAccess(this.hostname)) return false;

  //   await this.ns.write(filename, script, "w");
  //   await this.ns.scp(filename, this.hostname);
  //   this.ns.scriptKill(filename, this.hostname);
  //   this.ns.exec(filename, this.hostname, threads, ...args);

  //   return true;
  // }

  public getServerPropertiesInScript(): string {
    return (
      "\n" +
      Object.keys({ ...this })
        .filter((key) => !["ns", "key", "hostname"].includes(key))
        .map((key) => {
          return 'var ' + key + " = " + this[key as keyof this] + "\n";
        })
        .join("") +
      "\n\n"
    );
  }
}

export function autoNook(ns: NS, server: Server): boolean {
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
  if (server.portsRequired <= portsOpened) ns.nuke(server.hostname);
  return ns.hasRootAccess(server.hostname);
}
