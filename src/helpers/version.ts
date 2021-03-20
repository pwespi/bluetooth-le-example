export async function getVersion(): Promise<string> {
    const versionInfo = await import("../generated/version.json")
    return versionInfo.capacitorVersion;
}