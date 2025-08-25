class InvalidProductUrlError extends Error {
  constructor(message) {
    super(message);
    this.name = "InvalidProductUrlError";
  }
}

module.exports = {
  InvalidProductUrlError
};