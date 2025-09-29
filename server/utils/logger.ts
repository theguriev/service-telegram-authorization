import { isPlainObject } from "es-toolkit";
import {
    H3Error,
    MultiPartData,
    type H3Event,
    type HTTPHeaderName,
    type HTTPMethod,
} from "h3";
import { HydratedDocument, InferSchemaType } from "mongoose";
import util from "util";
import { createLogger, format, transport, transports } from "winston";
import LokiTransport from "winston-loki";

const winstonTypes = {
  httpRequestLog: "HTTP_REQUEST_LOG",
  httpRequestResponse: "HTTP_REQUEST_RESPONSE",
} as const;

const methodColors = {
  GET: "yellow",
  POST: "green",
  PUT: "blue",
  DELETE: "red",
};

declare module "logform" {
  export interface TransformableInfo {
    type: (typeof winstonTypes)[keyof typeof winstonTypes];
    id: string;
    request: {
      method: HTTPMethod;
      url: URL;
      path: string;
      ip?: string;
      protocol: "https" | "http";
      host: string;
      headers: Partial<Record<HTTPHeaderName, string>>;
      body?: unknown;
      rawBody?: string;
      fingerprint?: string;
      formData?: FormData;
      multipartFormData?: MultiPartData[];
    };
    user?: HydratedDocument<InferSchemaType<typeof schemaUser>>;
    timestamp?: string;
  }
}

let loggerConfig:
  | {
      service: string;
      host: string;
      basicAuth?: string;
    }
  | undefined = undefined;

export const configureLogger = (
  service: string,
  host: string,
  basicAuth?: string,
) => {
  loggerConfig = {
    service,
    host,
    basicAuth,
  };
};

const consoleFormat = format.printf(
  ({ type, timestamp, level, message, request, user }) => {
    const { method, path } = request;
    const methodColor = methodColors[method];
    const coloredMethod = methodColor
      ? util.styleText(methodColor, method)
      : method;
    const coloredTimestamp = util.styleText("gray", timestamp);

    const userName = user
      ? `${user.meta?.get("firstName") ?? ""} ${user.meta?.get("lastName") ?? ""}`.trim() ||
        `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
      : undefined;
    const coloredUserName = userName
      ? util.styleText("blue", userName)
      : userName;
    const coloredUserId = user
      ? util.styleText("gray", user._id.toString())
      : undefined;
    const userField = user ? ` (${coloredUserName} - ${coloredUserId})` : "";
    const responseField =
      type === winstonTypes.httpRequestResponse
        ? ` ${util.styleText("magenta", "Response")}`
        : undefined;

    return `${coloredTimestamp} ${level} [${coloredMethod}: ${path}]${userField}${responseField}: ${util.inspect(message, { colors: coloredTimestamp !== timestamp })}`;
  },
);

const transformErrors = (info: unknown) => {
  if (info instanceof Error) {
    return {
      ...Object.getOwnPropertyNames(info).reduce(
        (acc, key) => ({ ...acc, [key]: transformErrors(info[key]) }),
        {},
      ),
      name: info.name,
    };
  }

  if (isPlainObject(info)) {
    return Object.keys(info).reduce(
      (acc, key) => ({ ...acc, [key]: transformErrors(info[key]) }),
      {},
    );
  }

  return info;
};

const formatErrorStacks = format(transformErrors);

const getLoggerInstance = async (
  event: H3Event,
  type: keyof typeof winstonTypes,
) => {
  if (!loggerConfig) {
    throw new Error("Logger not configured");
  }

  let userId: string | undefined = undefined;
  try {
    userId = await getUserId(event, { ignoreExpiration: true });
  } catch (error) {
    userId = undefined;
  }
  const user = userId ? await ModelUser.findById(userId) : undefined;

  let fingerprint: string | undefined = undefined;
  try {
    fingerprint = await getRequestFingerprint(event);
  } catch (error) {
    fingerprint = undefined;
  }

  let rawBody: string | undefined = undefined;
  try {
    rawBody = await readRawBody(event);
  } catch (error) {
    rawBody = undefined;
  }

  let requestBody: any | undefined = undefined;
  try {
    requestBody = await readBody(event, { strict: true });
  } catch (error) {
    requestBody = undefined;
  }

  let formData: FormData | undefined = undefined;
  try {
    if (getHeader(event, "content-type").toLowerCase().includes("application/x-www-form-urlencoded")) {
      formData = await readFormData(event);
    }
  } catch (error) {
    formData = undefined;
  }

  let multipartFormData: MultiPartData[] | undefined = undefined;
  try {
    if (getHeader(event, "content-type").toLowerCase().includes("multipart/form-data")) {
      multipartFormData = await readMultipartFormData(event);
    }
  } catch (error) {
    multipartFormData = undefined;
  }

  const loggerTransports: transport[] = [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.timestamp(),
        consoleFormat,
      ),
    }),
  ];

  if (process.env.VITEST !== "true") {
    loggerTransports.push(
      new LokiTransport({
        host: loggerConfig.host,
        basicAuth: loggerConfig.basicAuth,
        json: true,
        format: format.combine(formatErrorStacks(), format.json()),
        labels: {
          id: event.context.id,
          service: loggerConfig.service,
          method: event.method,
          path: event.path,
        },
        batching: true,
        gracefulShutdown: true,
        clearOnError: false,
        replaceTimestamp: true,
        onConnectionError: (err) =>
          console.error("Loki connection error:", err),
      }),
    );
  }

  return createLogger({
    level: "http",
    defaultMeta: {
      service: loggerConfig.service,
      id: event.context.id,
      type: winstonTypes[type],
      request: {
        method: event.method,
        url: getRequestURL(event, {
          xForwardedHost: true,
          xForwardedProto: true,
        }),
        path: event.path,
        ip: getRequestIP(event),
        protocol: getRequestProtocol(event),
        host: getRequestHost(event),
        headers: getRequestHeaders(event),
        body: requestBody,
        rawBody,
        fingerprint,
        formData,
        multipartFormData,
      },
      user,
    },
    transports: loggerTransports,
  });
};

export const getLogger = async (event: H3Event) => {
  return getLoggerInstance(event, "httpRequestLog");
};

export const sendResponseLog = async (event: H3Event, response?: unknown) => {
  const loggerInstance = await getLoggerInstance(event, "httpRequestResponse");

  let body: unknown | undefined = response;

  if (response instanceof Error) {
    body = {
      error: true,
      url: getRequestURL(event, {
        xForwardedHost: true,
        xForwardedProto: true,
      }).toString(),
      statusCode:
        response instanceof H3Error
          ? response.statusCode
          : getResponseStatus(event),
      statusMessage:
        response instanceof H3Error
          ? (response.statusMessage ?? "Server Error")
          : (getResponseStatusText(event) ?? "Server Error"),
      message: response.message,
      data: (response as H3Error).data,
      stack: process.env.NODE_ENV === "production" ? undefined : response.stack,
    };
  }

  return loggerInstance.http({
    response: {
      status: getResponseStatus(event),
      statusText:
        response instanceof Error
          ? (getResponseStatusText(event) ?? "Server Error")
          : getResponseStatusText(event),
      headers: getResponseHeaders(event),
      body,
    },
    error: response instanceof Error ? response : undefined,
  });
};
