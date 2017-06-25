
function TokenizationError (message, token) {
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, this.constructor)
  }
  this.name = this.constructor.name

  this.input = token.input
  this.line = token.line
  this.file = token.file

  var context = mkContext(token.input, token.line)
  this.message = mkMessage(message, token)
  this.stack = context + '\n' + (this.stack || '')
}
TokenizationError.prototype = Object.create(Error.prototype)
TokenizationError.prototype.constructor = TokenizationError

function ParseError (e, token) {
  Object.assign(this, e)
  this.originalError = e
  this.name = this.constructor.name

  this.input = token.input
  this.line = token.line
  this.file = token.file

  var context = mkContext(token.input, token.line)
  this.message = mkMessage(e.message || 'Unkown Error', token)
  this.stack = context + '\n' + (e.stack || '')
}
ParseError.prototype = Object.create(Error.prototype)
ParseError.prototype.constructor = ParseError

function RenderError (e, tpl) {
    // return the original render error
  if (e instanceof RenderError) {
    return e
  }
  Object.assign(this, e)
  this.originalError = e
  this.name = this.constructor.name

  this.input = tpl.token.input
  this.line = tpl.token.line
  this.file = tpl.token.file

  var context = mkContext(tpl.token.input, tpl.token.line)
  this.message = mkMessage(e.message || 'Unkown Error', tpl.token)
  this.stack = context + '\n' + (e.stack || '')
}
RenderError.prototype = Object.create(Error.prototype)
RenderError.prototype.constructor = RenderError

function RenderBreakError (message) {
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, this.constructor)
  }
  this.name = this.constructor.name
  this.message = message || ''
}
RenderBreakError.prototype = Object.create(Error.prototype)
RenderBreakError.prototype.constructor = RenderBreakError

function mkContext (input, line) {
  var lines = input.split('\n')
  var endIndex = Math.min(line + 3, lines.length)

  var index = Math.max(line - 3, 0)
  while (++index <= endIndex) {
    lines[index] = [
      (index === line) ? '>> ' : '   ',
      align(index, endIndex),
      '| ',
      lines[index - 1]
    ].join('')
  }

  return lines.join('\n')
}

function align (n, max) {
  var length = (max + '').length
  var str = n + ''
  var blank = Array(length - str.length).join(' ')
  return blank + str
}

function mkMessage (msg, token) {
  msg = msg || ''
  if (token.file) {
    msg += ', file:' + token.file
  }
  if (token.line) {
    msg += ', line:' + token.line
  }
  return msg
}

module.exports = {
  TokenizationError,
  ParseError,
  RenderBreakError,
  RenderError
}
