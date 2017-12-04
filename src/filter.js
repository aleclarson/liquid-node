const lexical = require('./lexical')
const Syntax = require('./syntax')

var valueRE = new RegExp(`${lexical.value.source}`, 'g')

function FilterCache(engine, options) {
  this.engine = engine
  this.renderer = engine.renderer
  this.filters = {}
  this.strict_filters = options.strict_filters
  return this
}

FilterCache.prototype = {
  constructor: FilterCache,
  register: function(name, filter) {
    this.filters[name] = filter
  },
  parse: function() {
    var match = lexical.filterLine.exec(str)
    if (!match) throw Error('illegal filter: ' + str)

    var name = match[1]
    var argList = match[2] || ''
    var filter = filters[name]
    if (typeof filter == 'function') {
      var args = []
      while ((match = valueRE.exec(argList.trim()))) {
        var v = match[0]
        var re = new RegExp(`${v}\\s*:`, 'g')
        re.test(match.input) ? args.push(`'${v}'`) : args.push(v)
      }
      filter = new Filter(name, args, filter)
    } else if (this.strict_filters) {
      throw TypeError(`undefined filter: ${name}`)
    } else {
      filter = new Filter(name, [], x => x)
    }

    filter.engine = this.engine
    return filter
  },
  clear: function() {
    this.filters = {}
  }
}

// Exports
module.exports = FilterCache
FilterCache.Filter = Filter

function Filter(name, args, filter) {
  this.name = name
  this.filter = filter
  this.args = args
  this.engine = null
  return this
}

Filter.prototype = {
  constructor: Filter,
  render: function (output, scope) {
    var args = this.args.map(arg => Syntax.evalValue(arg, scope))
    args.unshift(output)
    return this.filter.apply(this.engine, args, scope)
  }
}
