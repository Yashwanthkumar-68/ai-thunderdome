const BASE = process.env.NEXT_PUBLIC_HASHSCAN_BASE ?? "https://hashscan.io/testnet";

export function hashscanTxUrl(transactionId: string): string {
  // Hedera tx IDs look like "0.0.1234@1234567890.000000000"
  // HashScan expects format: "0.0.1234-1234567890-000000000"
  const normalized = transactionId.replace("@", "-").replace(".", "-").replace(/\./g, "-");
  // Actually just replace @ with - and keep dots in account part
  // Format: accountId@seconds.nanos -> accountId-seconds-nanos
  const parts = transactionId.split("@");
  if (parts.length === 2) {
    const [account, time] = parts;
    const timeParts = time.split(".");
    const formatted = `${account}-${timeParts[0]}-${timeParts[1]?.padStart(9, "0") ?? "000000000"}`;
    return `${BASE}/transaction/${formatted}`;
  }
  return `${BASE}/transaction/${normalized}`;
}

export function hashscanAccountUrl(accountId: string): string {
  return `${BASE}/account/${accountId}`;
}

export function formatHbar(tinybars: bigint): string {
  const hbar = Number(tinybars) / 100_000_000;
  return `${hbar.toFixed(4)} ℏ`;
}

export function tinybarsToHbar(tinybars: bigint): string {
  return (Number(tinybars) / 100_000_000).toFixed(6);
}

export function hbarToTinybars(hbar: number): bigint {
  return BigInt(Math.round(hbar * 100_000_000));
}
