/* eslint-disable import/default */
import jwt from 'jsonwebtoken'

const verify = (token: string, secret:string) => new Promise<jwt.JwtPayload>((resolve, reject) => {
  // eslint-disable-next-line import/no-named-as-default-member
  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      reject(err)
    }
    resolve(decoded as jwt.JwtPayload)
  })
})

export default verify
