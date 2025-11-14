import { TransactionsBulkRequest } from "./getTransactionsBulk";

const getAllTransactionsBulk = async <
	T extends string[],
	TSymbol extends string = string,
	TLimit extends number = 100,
	TOrder extends "asc" | "desc" = "desc",
	TOrderBy extends "timestamp" | "value" | "symbol" = "timestamp",
	TFromTimestamp extends number | undefined = undefined,
	TToTimestamp extends number | undefined = undefined,
	TValue extends number | undefined = undefined,
>(
	addresses: T,
	options: Omit<
		TransactionsBulkRequest<
			TSymbol,
			TLimit,
			0,
			TOrder,
			TOrderBy,
			TFromTimestamp,
			TToTimestamp,
			TValue
		>,
		"offset"
	> = {},
) => {
	type DefaultResponse = Awaited<
		ReturnType<
			typeof getTransactionsBulk<
				T,
				TSymbol,
				TLimit,
				0,
				TOrder,
				TOrderBy,
				TFromTimestamp,
				TToTimestamp,
				TValue
			>
		>
	>;
	type Response = Omit<DefaultResponse, "metadata"> & {
		metadata: Omit<DefaultResponse["metadata"], "offset">;
	};

	const step = (options.limit ?? 100) as TLimit;

	const asyncAddressTransactions = Array.from(
		{ length: Math.ceil(addresses.length / 50) },
		async (_, offset) => {
			const chunk = addresses.slice(offset * 50, (offset + 1) * 50);
			const addressTransactions: Response = {
				transactions: chunk.reduce(
					(acc, address) => ({
						...acc,
						[address]: [],
					}),
					{} as Response["transactions"],
				),
				metadata: {
					totalAddresses: chunk.length,
					totalTransactions: 0,
					addressesWithTransactions: 0,
					limit: step,
					order: (options.order ?? "desc") as TOrder,
					orderBy: (options.orderBy ?? "timestamp") as TOrderBy,
					filters: {
						symbol: options.symbol,
						fromTimestamp: options.fromTimestamp,
						toTimestamp: options.toTimestamp,
						value: options.value,
					},
				},
			};

			for (
				let offset = 0;
				new Set(
					Object.values<Response["transactions"][T[number]]>(
						addressTransactions.transactions,
					).flatMap((item) => item.map((transaction) => transaction._id)),
				).size === offset;
				offset += step
			) {
				const nextTransactions = await getTransactionsBulk(chunk, {
					...options,
					limit: step,
					offset,
				});
				console.log(offset, nextTransactions, addressTransactions);
				addressTransactions.transactions = chunk.reduce(
					(acc, address) => ({
						...acc,
						[address]: [
							...acc[address],
							...nextTransactions.transactions[address],
						],
					}),
					addressTransactions.transactions,
				);
				addressTransactions.metadata.totalTransactions +=
					nextTransactions.metadata.totalTransactions;
			}

			addressTransactions.metadata.addressesWithTransactions = Object.values<
				Response["transactions"][T[number]]
			>(addressTransactions.transactions).filter(
				(item) => item.length > 0,
			).length;

			return addressTransactions;
		},
	);

	const addressTransactions = await Promise.all(asyncAddressTransactions);

	const transactions = addressTransactions.reduce(
		(acc, chunk) => ({
			...acc,
			transactions: {
				...acc.transactions,
				...chunk.transactions,
			},
			metadata: {
				...acc.metadata,
				totalTransactions:
					acc.metadata.totalTransactions + chunk.metadata.totalTransactions,
				addressesWithTransactions:
					acc.metadata.addressesWithTransactions +
					chunk.metadata.addressesWithTransactions,
			},
		}),
		{
			transactions: addresses.reduce(
				(acc, address) => ({
					...acc,
					[address]: [],
				}),
				{} as Response["transactions"],
			),
			metadata: {
				totalAddresses: addresses.length,
				totalTransactions: 0,
				addressesWithTransactions: 0,
				limit: step,
				order: (options.order ?? "desc") as TOrder,
				orderBy: (options.orderBy ?? "timestamp") as TOrderBy,
				filters: {
					symbol: options.symbol,
					fromTimestamp: options.fromTimestamp,
					toTimestamp: options.toTimestamp,
					value: options.value,
				},
			},
		} as Response,
	);

	return transactions;
};

export default getAllTransactionsBulk;
