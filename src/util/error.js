
function ParseError(error, token) {
  this.message = createMessage(error.message || 'Unknown error while parsing', token)
  this.context = createContext(token.input, token.line)
  this.stack = error.stack
}

function RenderError(error, template) {
  var token = template.token
  this.message = createMessage(error.message || 'Unknown error while rendering', token)
  this.context = createContext(token.input, token.line)
  this.stack = error.stack
}

function RenderBreakError(message) {
  this.message = message || ''
}

function TokenizationError(message, token) {
  this.message = createMessage(message, token)
  this.context = createContext(token.input, token.line)
}

module.exports = {
  ParseError: createType(ParseError),
  RenderError: createType(RenderError),
  RenderBreakError: createType(RenderBreakError),
  TokenizationError: createType(TokenizationError),
}

//
// Helpers
//

function createType(constructor) {
  var prototype = constructor.prototype
  Object.setPrototypeOf(prototype, Error.prototype)
  function LiquidError(arg) {
    if (arg && arg.constructor === constructor) {
      return arg // Pass through an error of the same type.
    }
    var error = Object.create(prototype)
    error.name = constructor.name
    constructor.apply(error, arguments)
    if (!error.stack && Error.captureStackTrace) {
      Error.captureStackTrace(error, LiquidError)
    }
    return error
  }
  LiquidError.prototype = prototype
  return LiquidError
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

function align(n, max) {
  var length = (max + '').length
  var str = n + ''
  var blank = Array(length - str.length).join(' ')
  return blank + str
}
