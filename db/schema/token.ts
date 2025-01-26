import { Schema } from 'mongoose'

const schema = new Schema({
  token: String,
  timestamp: Number,
  userId: String
})

export default schema
