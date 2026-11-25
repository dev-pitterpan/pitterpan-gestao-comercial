/** A donut is a partition of received money, never a profit/margin calculation. */
export function financialComposition(
  receivedValue: string,
  refundedValue: string,
) {
  const received = receivedValue.trim() === "" ? NaN : Number(receivedValue);
  const refunded = refundedValue.trim() === "" ? NaN : Number(refundedValue);
  if (
    !Number.isFinite(received) ||
    !Number.isFinite(refunded) ||
    received < 0 ||
    refunded < 0
  )
    return {
      state: "invalid" as const,
      received,
      refunded,
      net: null,
      netShare: null,
      refundShare: null,
    };
  const net = received - refunded;
  if (refunded > received)
    return {
      state: "excess" as const,
      received,
      refunded,
      net,
      netShare: null,
      refundShare: null,
    };
  if (received === 0)
    return {
      state: "empty" as const,
      received,
      refunded,
      net,
      netShare: null,
      refundShare: null,
    };
  const refundShare = refunded / received;
  return {
    state: "balanced" as const,
    received,
    refunded,
    net,
    netShare: 1 - refundShare,
    refundShare,
  };
}
