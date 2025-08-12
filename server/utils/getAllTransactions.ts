const getAllTransactions = async (privateKey: string, options: Omit<Parameters<typeof getTransactions>[1], "offset" | "limit"> = {}) => {
  const step = 1000;

  let transactions: Awaited<ReturnType<typeof getTransactions>> = [];
  for (let offset = 0; transactions.length === offset; offset += step) {
    const nextTransactions = await getTransactions(privateKey, {
      ...options,
      limit: step,
      offset,
    });
    transactions = [...transactions, ...nextTransactions];
  }

  return transactions;
};

export default getAllTransactions;
