const getAllTransactions = async <TSymbol extends string = string>(options: Omit<TransactionsRequest<TSymbol>, "offset"> = {}) => {
  const step = options.limit ?? 1000;

  let transactions: Awaited<ReturnType<typeof getTransactions<TSymbol>>> = [];
  for (let offset = 0; transactions.length === offset; offset += step) {
    const nextTransactions = await getTransactions({
      ...options,
      limit: step,
      offset,
    });
    transactions = [...transactions, ...nextTransactions];
  }

  return transactions;
};

export default getAllTransactions;
