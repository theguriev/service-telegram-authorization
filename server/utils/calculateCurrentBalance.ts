import { differenceInDays, startOfDay } from "date-fns";
import { sortBy } from "es-toolkit";

const calculateCurrentBalance = (
  from: string, transactions: Awaited<ReturnType<typeof getTransactions>>,
  getStartDate: (date: Date) => Date = startOfDay
) => {
  const sortedTransactions = sortBy(transactions, [(transaction) => transaction.timestamp]);

  const { currentBalance, previousTransaction } = sortedTransactions.reduce<{
    previousTransaction: typeof transactions[number] | undefined;
    currentBalance: number;
  }>(({ previousTransaction, currentBalance }, transaction) => {
    if (transaction.from === from) {
      return { previousTransaction, currentBalance };
    }

    if (!previousTransaction) {
      return {
        previousTransaction: transaction,
        currentBalance: transaction.value,
      };
    }

    const transactionDate = getStartDate(new Date(transaction.timestamp));
    const previousTransactionDate = getStartDate(new Date(previousTransaction.timestamp));
    const daysDifference = differenceInDays(transactionDate, previousTransactionDate);
    const value = Math.max(0, currentBalance - daysDifference) + transaction.value;
    return {
      previousTransaction: transaction,
      currentBalance: value,
    };
  }, {
    previousTransaction: undefined,
    currentBalance: 0,
  });

  const currentDate = getStartDate(new Date());
  const previousTransactionDate = previousTransaction
    ? getStartDate(new Date(previousTransaction.timestamp))
    : currentDate;
  const daysDifference = differenceInDays(currentDate, previousTransactionDate);
  return Math.max(0, currentBalance - daysDifference);
};

export default calculateCurrentBalance;
