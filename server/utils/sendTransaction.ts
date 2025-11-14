import { bllsBase } from "~~/constants";

const sendTransaction = async (
	currencySymbol: string,
	fromPrivateKey: string,
	address: string,
	value: number,
	message?: string,
	idempotencyKey?: string,
) => {
	const fromWallet = new Wallet(fromPrivateKey);

	const transaction = {
		from: fromWallet.address,
		to: address,
		value,
		symbol: currencySymbol,
	};

	const signature = await fromWallet.signMessage(JSON.stringify(transaction));
	await $fetch("/billing/transactions", {
		baseURL: bllsBase,
		retry: 5,
		retryDelay: 1000,
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: {
			...transaction,
			message,
			signature,
			idempotencyKey,
		},
	});
};

export default sendTransaction;
