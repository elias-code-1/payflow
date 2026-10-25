import type { ConfirmedPayment, PaymentLink, TransactionRow } from "../types";

const DAY_MS = 24 * 60 * 60 * 1000;

export function getTransactionRows(links: PaymentLink[]): TransactionRow[] {
  const paidLinkRows = links
    .filter((link) => link.status === "paid")
    .map((link) => ({
      id: `link-${link.id}`,
      tx_reference: "Confirmation manuelle",
      identifier: link.identifier,
      status: 1,
      amount: link.amount,
      payment_method: link.payment_method,
      phone_number: link.phone_number,
      created_at: link.status_updated_at || link.created_at,
      source: "manual_link",
    }));

  return paidLinkRows.sort((left, right) => {
    const leftDate = new Date(left.created_at?.includes?.("T") ? left.created_at : `${left.created_at}Z`).getTime();
    const rightDate = new Date(right.created_at?.includes?.("T") ? right.created_at : `${right.created_at}Z`).getTime();
    return (Number.isNaN(rightDate) ? 0 : rightDate) - (Number.isNaN(leftDate) ? 0 : leftDate);
  });
}

export function getConfirmedPayments(links: PaymentLink[]): ConfirmedPayment[] {
  return links
    .filter((link) => link.status === "paid")
    .map((link) => ({
      ...link,
      status: 1,
      created_at: link.status_updated_at || link.created_at,
    }));
}

export function getPaymentsForRange(links: PaymentLink[], days: number): ConfirmedPayment[] {
  const cutoff = Date.now() - days * DAY_MS;
  return getConfirmedPayments(links).filter((payment) => {
    const date = new Date(payment.created_at?.includes?.("T") ? payment.created_at : `${payment.created_at}Z`);
    return !Number.isNaN(date.getTime()) && date.getTime() >= cutoff;
  });
}

export function getDailyRevenue(links: PaymentLink[], days: number): Array<{ date: Date; revenue: number }> {
  const daily = Array.from({ length: days }, (_, index) => {
    const date = new Date(Date.now() - (days - index - 1) * DAY_MS);
    date.setHours(0, 0, 0, 0);
    return { date, revenue: 0 };
  });

  const indexByDay = new Map(daily.map((entry, index) => [entry.date.toDateString(), index]));
  for (const payment of getPaymentsForRange(links, days)) {
    const date = new Date(payment.created_at?.includes?.("T") ? payment.created_at : `${payment.created_at}Z`);
    date.setHours(0, 0, 0, 0);
    const index = indexByDay.get(date.toDateString());
    if (index !== undefined) daily[index].revenue += Number(payment.amount || 0);
  }
  return daily;
}
