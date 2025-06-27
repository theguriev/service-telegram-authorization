import { H3Event, EventHandlerRequest } from "h3";

const MONTH = 1000 * 60 * 60 * 24 * 30;
const MINUTES_15 = 1000 * 60 * 15;

const useTokens = ({
  event,
  userId,
  role = "user",
  id,
}: {
  event: H3Event<EventHandlerRequest>;
  userId: string;
  role?: string;
  id?: string;
}) => {
  const refreshToken = issueRefreshToken();
  const { secret } = useRuntimeConfig();
  const timestamp = Date.now();
  const expiresRefreshToken = new Date(timestamp + MONTH);
  const expiresAccessToken = new Date(timestamp + MINUTES_15);
  const initialId = id || userId;
  const accessToken = issueAccessToken(
    { userId, role, id: initialId },
    { secret }
  );

  setCookie(event, "refreshToken", refreshToken, {
    expires: expiresRefreshToken,
    sameSite: "none",
    secure: true,
  });

  setCookie(event, "accessToken", accessToken, {
    expires: expiresAccessToken,
    sameSite: "none",
    secure: true,
  });

  const save = async () => {
    const refreshTokenDocument = new ModelToken({
      userId,
      token: refreshToken,
      timestamp,
      id,
      role,
    });
    return await refreshTokenDocument.save();
  };

  const deleteByUserId = async () => {
    const refreshTokenDocument = new ModelToken();
    return await refreshTokenDocument.collection.deleteMany({
      userId: initialId,
    });
  };
  return { refreshToken, accessToken, timestamp, save, deleteByUserId };
};

export default useTokens;
