'use strict'

const mongoose = require('mongoose')
// although linter says we're not using this, I have in my notes
// from the mongoose populate lesson that this is necessary to
// complete the one-to-many relationship; see line 27
const User = require('./user.js')

// eventually add a comment_id field (like the owner field)
const imageSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  tags: [String],
  url: {
    type: String,
    required: true
  },
  latitude: Number,
  longitude: Number,
  city: String,
  state: String,
  country: String,
  _owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function (doc, ret, options) {
      const userId = (options.user && options.user._id) || false
      ret.editable = userId && userId.equals(doc._owner)
      return ret
    }
  }
})

const Image = mongoose.model('Image', imageSchema)

module.exports = Image
