const getAllTransactions = async (address: string, currencySymbol: string, options: Omit<Parameters<typeof getTransactions>[2], "offset" | "limit"> = {}) => {
  const step = 1000;

  let transactions: Awaited<ReturnType<typeof getTransactions>> = [];
  for (let offset = 0; transactions.length === offset; offset += step) {
    const nextTransactions = await getTransactions(address, currencySymbol, {
      ...options,
      limit: step,
      offset,
    });
    transactions = [...transactions, ...nextTransactions];
  }

  return transactions;
};

export default getAllTransactions;
