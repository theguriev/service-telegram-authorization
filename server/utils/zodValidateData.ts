import type { ValidateFunction } from "h3";

const createValidationError = (validateError?: any) => {
  throw createError({
    status: 400,
    statusMessage: "Validation Error",
    message: "Validation Error",
    data: validateError?.issues,
  });
};

const zodValidateData = async <T>(
  data: unknown,
  fn: ValidateFunction<T>
): Promise<T> => {
  try {
    const res = await fn(data);
    if (res === false) {
      throw createValidationError();
    }
    if (res === true) {
      return data as T;
    }
    return res ?? (data as T);
  } catch (error) {
    throw createValidationError(error);
  }
};

export default zodValidateData;
