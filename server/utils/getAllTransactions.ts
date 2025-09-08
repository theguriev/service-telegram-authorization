const getAllTransactions = async (address: string, options: Omit<Parameters<typeof getTransactions>[1], "offset" | "limit"> = {}) => {
  const step = 1000;

  let transactions: Awaited<ReturnType<typeof getTransactions>> = [];
  for (let offset = 0; transactions.length === offset; offset += step) {
    const nextTransactions = await getTransactions(address, {
      ...options,
      limit: step,
      offset,
    });
    transactions = [...transactions, ...nextTransactions];
  }

  return transactions;
};

export default getAllTransactions;
