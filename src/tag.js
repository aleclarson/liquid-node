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

module.exports = function () {
  var tagImpls = {}

  var _tagInstance = {
    render: function (scope) {
      var obj = hash(this.token.args, scope)
      var impl = this.tagImpl
      if (typeof impl.render !== 'function') {
        return Promise.resolve('')
      }
      return Promise.resolve()
                .then(() => typeof impl.render === 'function'
                    ? impl.render(scope, obj) : '')
                .catch(function (e) {
                  if (e instanceof Error) {
                    throw e
                  }
                  var msg = `Please reject with an Error in ${impl.render}, got ${e}`
                  throw Error(msg)
                })
    },
    parse: function (token, tokens) {
      this.type = 'tag'
      this.token = token
      this.name = token.name

      var tagImpl = tagImpls[this.name]
      if (!tagImpl) throw Error(`tag ${this.name} not found`)
      this.tagImpl = Object.create(tagImpl)
      if (this.tagImpl.parse) {
        this.tagImpl.parse(token, tokens)
      }
    }
  }

  function register (name, tag) {
    tagImpls[name] = tag
  }

  function construct (token, tokens) {
    var instance = Object.create(_tagInstance)
    instance.parse(token, tokens)
    return instance
  }

  function clear () {
    tagImpls = {}
  }

  return {
    construct,
    register,
    clear
  }
}
