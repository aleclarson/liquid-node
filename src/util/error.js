
createType('TokenizationError', function(message, token) {
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, this.constructor)
  }
  this.name = this.constructor.name

  this.input = token.input
  this.line = token.line
  this.file = token.file

  this.message = createMessage(message, token)
  this.context = createContext(token.input, token.line)
})

createType('ParseError', function(e, token) {
  Object.assign(this, e)
  this.originalError = e
  this.name = this.constructor.name

  this.input = token.input
  this.line = token.line
  this.file = token.file

  this.message = createMessage(e.message || 'Unknown Error', token)
  this.context = createContext(token.input, token.line)
})

createType('RenderError', function(e, tpl) {
  Object.assign(this, e)
  this.originalError = e
  this.name = this.constructor.name

  this.input = tpl.token.input
  this.line = tpl.token.line
  this.file = tpl.token.file

  this.message = createMessage(e.message || 'Unknown Error', tpl.token)
  this.context = createContext(tpl.token.input, tpl.token.line)
})

createType('RenderBreakError', function(message) {
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, this.constructor)
  }
  this.name = this.constructor.name
  this.message = message || ''
})

function createType(name, init) {
  var ctr = function(e) {
    if (e instanceof ctr) {
      return e
    }
    var self = Object.create(ctr.prototype)
    init.apply(self, arguments)
    return self
  }
  Object.defineProperty(ctr, 'name', {value: name})
  ctr.prototype = Object.create(Error.prototype)
  ctr.prototype.constructor = ctr
  return exports[name] = ctr
}

function createContext(input, line) {
  var lines = input.split('\n')
  var endIndex = Math.min(line + 3, lines.length)

  var ctx = []
  var index = Math.max(line - 3, 0)
  while (++index <= endIndex) {
    ctx.push([
      (index === line) ? '>> ' : '   ',
      align(index, endIndex),
      '| ',
      lines[index - 1]
    ].join(''))
  }

  return ctx.map(line => line + '\n').join('')
}

function createMessage(msg, token) {
  msg = msg || ''
  if (token.file) {
    msg += ', file:' + token.file
  }
  if (token.line) {
    msg += ', line:' + token.line
  }
  return msg
}

function align(n, max) {
  var length = (max + '').length
  var str = n + ''
  var blank = Array(length - str.length).join(' ')
  return blank + str
}
