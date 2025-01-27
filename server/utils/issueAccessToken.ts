/* eslint-disable import/default */
import jwt from 'jsonwebtoken'

const issueAccessToken = (
  payload: jwt.JwtPayload,
  { secret, expiresIn = '15m' }: { secret: string; expiresIn?: string }
) =>
  jwt.sign(payload, secret, {
    expiresIn
  })

export default issueAccessToken
