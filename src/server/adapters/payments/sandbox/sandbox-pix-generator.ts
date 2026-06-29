function randomDigits(length: number) {
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join("");
}

export class SandboxPixGenerator {
  create(input: {
    amountCents: number;
    expiresAt: string;
    paymentId: string;
    workspaceId: string;
  }) {
    const transactionId = `SANDBOX-${input.paymentId.slice(0, 8).toUpperCase()}`;
    const merchant = "OCTOPUSBOT SANDBOX";
    const amount = (input.amountCents / 100).toFixed(2);
    const workspace = input.workspaceId.replaceAll("-", "").slice(0, 16);
    const copyPaste = [
      "000201",
      "26360014BR.GOV.BCB.PIX",
      `0114+5500${randomDigits(8)}`,
      "52040000",
      "5303986",
      `54${String(amount.length).padStart(2, "0")}${amount}`,
      "5802BR",
      `59${String(merchant.length).padStart(2, "0")}${merchant}`,
      "6009SAO PAULO",
      `62190515${transactionId}`,
      `6304${workspace.slice(0, 4).toUpperCase()}`,
    ].join("");

    return {
      copyPaste,
      qrCode: copyPaste,
      transactionId,
    };
  }
}
