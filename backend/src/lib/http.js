class HttpError extends Error {
  constructor(status, code, message, fields) {
    super(message)
    this.status = status
    this.code = code
    this.fields = fields
  }
}

const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next)
const ok = (res, data, meta) => res.json(meta ? { data, meta } : { data })

module.exports = { HttpError, asyncRoute, ok }
