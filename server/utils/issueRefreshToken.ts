import { v4 } from 'uuid'

const issueRefreshToken = () => passwordHash(v4())

export default issueRefreshToken
