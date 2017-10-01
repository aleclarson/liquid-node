const lexical = require('./lexical')
const toStr = Object.prototype.toString

var Scope = {
  getAll: function () {
    var ctx = {}
    for (var i = this.scopes.length - 1; i >= 0; i--) {
      Object.assign(ctx, this.scopes[i])
    }
    return ctx
  },
  get: function (str) {
    for (var i = this.scopes.length - 1; i >= 0; i--) {
      try {
        return this.getPropertyByPath(this.scopes[i], str)
      } catch (e) {
        if (/undefined variable/.test(e.message)) {
          continue
        }
        if (/Cannot read property/.test(e.message)) {
          if (this.opts.strict_variables) {
            e.message += ': ' + str
            throw e
          } else {
            continue
          }
        } else {
          e.message += ': ' + str
          throw e
        }
      }
    }
    if (this.opts.strict_variables) {
      throw TypeError('undefined variable: ' + str)
    }
  },
  set: function (k, v) {
    this.setPropertyByPath(this.scopes[this.scopes.length - 1], k, v)
    return this
  },
  push: function (ctx) {
    if (!ctx) throw Error(`trying to push ${ctx} into scopes`)
    return this.scopes.push(ctx)
  },
  pop: function () {
    return this.scopes.pop()
  },
  unshift: function (ctx) {
    if (!ctx) throw Error(`trying to push ${ctx} into scopes`)
    return this.scopes.unshift(ctx)
  },
  shift: function () {
    return this.scopes.shift()
  },
  setPropertyByPath: function (obj, path, val) {
    if (typeof path === 'string') {
      var paths = path.replace(/\[/g, '.').replace(/\]/g, '').split('.')
      for (var i = 0; i < paths.length; i++) {
        var key = paths[i]
        if (i === paths.length - 1) {
          return (obj[key] = val)
        }
        if (undefined === obj[key]) obj[key] = {}
                // case for readonly objects
        obj = obj[key] || {}
      }
    }
  },

  getPropertyByPath: function (obj, path) {
    var paths = this.propertyAccessSeq(path + '')
    var varName = paths.shift()
    if (!obj.hasOwnProperty(varName)) {
      throw TypeError('undefined variable')
    }
    var variable = obj[varName]
    var lastName = paths.pop()
    paths.forEach(p => (variable = variable[p]))
    if (undefined !== lastName) {
      if (lastName === 'size' &&
                (toStr.call(variable) === '[object Array]' ||
                    toStr.call(variable) === '[object String]')) {
        return variable.length
      }
      variable = variable[lastName]
    }
    return variable
  },

  /*
   * Parse property access sequence from access string
   * @example
   * accessSeq("foo.bar")            // ['foo', 'bar']
   * accessSeq("foo['bar']")      // ['foo', 'bar']
   * accessSeq("foo['b]r']")      // ['foo', 'b]r']
   * accessSeq("foo[bar.coo]")    // ['foo', 'bar'], for bar.coo == 'bar'
   */
  propertyAccessSeq: function (str) {
    var seq = []
    var name = ''
    for (var i = 0; i < str.length; i++) {
      if (str[i] === '[') {
        seq.push(name)
        name = ''

        var delemiter = str[i + 1]
        if (delemiter !== "'" && delemiter !== '"') {
          // foo[bar.coo]
          var j = matchRightBracket(str, i + 1)
          if (j === -1) throw Error(`unbalanced []: ${str}`)
          name = str.slice(i + 1, j)
          if (lexical.isInteger(name)) {
            // foo[1]
            seq.push(name)
          } else {
            // foo["bar"]
            seq.push(this.get(name))
          }
          name = ''
          i = j
        } else {
          // foo["bar"]
          j = str.indexOf(delemiter, i + 2)
          if (j === -1) throw Error(`unbalanced ${delemiter}: ${str}`)
          name = str.slice(i + 2, j)
          seq.push(name)
          name = ''
          i = j + 2
        }
      } else if (str[i] === '.') {
        // foo.bar
        // foo.bar[0].foo
        // In the case of foo.bar[0].foo, must check length because
        // name will be empty after the closing `]` is handled above.
        if (name.length) seq.push(name)
        name = ''
      } else {
        // foo.bar
        name += str[i]
      }
    }
    if (name.length) seq.push(name)
    return seq
  }
}

function matchRightBracket (str, begin) {
  var stack = 1 // count of '[' - count of ']'
  for (var i = begin; i < str.length; i++) {
    if (str[i] === '[') {
      stack++
    }
    if (str[i] === ']') {
      stack--
      if (stack === 0) {
        return i
      }
    }
  }
  return -1
}

exports.factory = function (ctx, opts) {
  opts = Object.assign({
    strict_variables: false,
    strict_filters: false,
    blocks: {}
  }, opts)

  ctx = Object.assign(ctx, {
    liquid: opts
  })

  var scope = Object.create(Scope)
  scope.opts = opts
  scope.scopes = [ctx]
  return scope
}
