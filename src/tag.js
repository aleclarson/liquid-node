const lexical = require('./lexical')
const Syntax = require('./syntax')

function hash (markup, scope) {
  var obj = {}
  var match
  lexical.hashCapture.lastIndex = 0
  while ((match = lexical.hashCapture.exec(markup))) {
    var k = match[1]
    var v = match[2]
    obj[k] = Syntax.evalValue(v, scope)
  }
  return obj
}

function TagCache(engine) {
  this.engine = engine
  this.renderer = engine.renderer
  this.tags = {}
  return this
}

TagCache.prototype = {
  constructor: TagCache,
  register: function(name, tagImpl) {
    this.tags[name] = tagImpl
  },
  parse: function(token, tokens) {
    var tag = new Tag(token)
    if (!this.tags.hasOwnProperty(tag.name)) {
      throw Error(`[Liquid] Tag does not exist: '${tag.name}'`)
    }
    var tagImpl = Object.create this.tags[tag.name]
    tagImpl.engine = this.engine
    if (typeof tagImpl.parse == 'function') {
      tagImpl.parse(token, tokens)
    }
    tag.tagImpl = tagImpl
    return tag
  },
  clear: function() {
    this.tags = {}
  }
}

// Exports
module.exports = TagCache
TagCache.Tag = Tag

function Tag(token) {
  this.type = 'tag'
  this.token = token
  this.name = token.name
  return this
}

Tag.prototype = {
  constructor: Tag,
  render: function(scope) {
    var obj = hash(this.token.args, scope)
    var impl = this.tagImpl
    if (typeof impl.render !== 'function') {
      return Promise.resolve('')
    }
    return Promise.resolve()
      .then(() => impl.render(scope, obj))
      .catch(function (e) {
        if (e instanceof Error) {
          throw e
        }
        var msg = `Please reject with an Error in ${impl.render}, got ${e}`
        throw Error(msg)
      })
  }
}
