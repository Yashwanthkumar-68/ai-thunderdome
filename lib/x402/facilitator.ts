import { PrivateKey } from "@hiero-ledger/sdk";
import {
  createHederaClient,
  createHederaSignAndSubmitTransaction,
  createHederaPreflightTransfer,
  createHederaVerifyPayerSignature,
  toFacilitatorHederaSigner,
  HEDERA_TESTNET_CAIP2,
  type SUPPORTED_HEDERA_NETWORKS,
} from "@x402/hedera";

type HederaNetwork = (typeof SUPPORTED_HEDERA_NETWORKS)[number];

export function createFacilitatorSigner(accountId: string, privateKeyStr: string) {
  const privateKey = PrivateKey.fromStringED25519(privateKeyStr);

  const buildClient = (network: string) =>
    createHederaClient(network as HederaNetwork);

  const base = {
    getAddresses: () => [accountId],
    signAndSubmitTransaction: createHederaSignAndSubmitTransaction(buildClient, privateKey),
    preflightTransfer: createHederaPreflightTransfer(),
    verifyPayerSignature: createHederaVerifyPayerSignature(),
  };

  return toFacilitatorHederaSigner(base);
}
