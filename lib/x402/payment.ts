import { PrivateKey } from "@hiero-ledger/sdk";
import {
  createClientHederaSigner,
  HEDERA_TESTNET_CAIP2,
  HBAR_ASSET_ID,
} from "@x402/hedera";
import { ExactHederaScheme as ClientScheme } from "@x402/hedera/exact/client";
import { ExactHederaScheme as FacilitatorScheme } from "@x402/hedera/exact/facilitator";
import { x402Version } from "@x402/core";
import { hashscanTxUrl, tinybarsToHbar } from "../hedera/hashscan";
import { createFacilitatorSigner } from "./facilitator";

export interface AgentWallet {
  accountId: string;
  privateKey: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId: string;
  hashscanUrl: string;
  amountHbar: string;
  errorMessage?: string;
}

let facilitatorScheme: InstanceType<typeof FacilitatorScheme> | null = null;
let facilitatorAccountId: string | null = null;

export function initFacilitator(
  accountId: string,
  privateKey: string
): void {
  facilitatorAccountId = accountId;
  const signer = createFacilitatorSigner(accountId, privateKey);
  facilitatorScheme = new FacilitatorScheme(signer);
  console.log(`✅ x402 facilitator ready: ${accountId}`);
}

export function getFacilitatorAccount(): string {
  if (!facilitatorAccountId) {
    throw new Error("Facilitator not initialized. Set FACILITATOR_ACCOUNT_ID and FACILITATOR_PRIVATE_KEY.");
  }
  return facilitatorAccountId;
}

export async function executePayment(
  fromWallet: AgentWallet,
  toAccountId: string,
  amountTinybars: bigint
): Promise<PaymentResult> {
  if (!facilitatorScheme || !facilitatorAccountId) {
    throw new Error("Facilitator not initialized. Set FACILITATOR_ACCOUNT_ID and FACILITATOR_PRIVATE_KEY.");
  }
  if (amountTinybars <= 0n) {
    throw new Error(`Invalid payment amount: ${amountTinybars}`);
  }

  const requirements = {
    scheme: "exact" as const,
    network: HEDERA_TESTNET_CAIP2 as `${string}:${string}`,
    amount: amountTinybars.toString(),
    asset: HBAR_ASSET_ID,
    payTo: toAccountId,
    maxTimeoutSeconds: 300,
    extra: { feePayer: facilitatorAccountId },
  };

  try {
    const privateKey = PrivateKey.fromStringED25519(fromWallet.privateKey);
    const clientSigner = createClientHederaSigner(fromWallet.accountId, privateKey);
    const clientScheme = new ClientScheme(clientSigner);

    const payloadResult = await clientScheme.createPaymentPayload(
      x402Version,
      requirements,
      undefined
    );

    const settlePayload = {
      ...payloadResult,
      accepted: requirements,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await facilitatorScheme.settle(settlePayload as any, requirements as any);

    if (!result.success) {
      const r = result as { errorMessage?: string; errorReason?: string };
      return {
        success: false,
        transactionId: "",
        hashscanUrl: "",
        amountHbar: tinybarsToHbar(amountTinybars),
        errorMessage: r.errorMessage ?? r.errorReason ?? "unknown error",
      };
    }

    const txId = result.transaction;
    return {
      success: true,
      transactionId: txId,
      hashscanUrl: hashscanTxUrl(txId),
      amountHbar: tinybarsToHbar(amountTinybars),
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      transactionId: "",
      hashscanUrl: "",
      amountHbar: tinybarsToHbar(amountTinybars),
      errorMessage: msg,
    };
  }
}
