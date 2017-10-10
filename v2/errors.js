
class GoesError extends Error {
  toString() {
    return `${this.constructor.name}: ${this.message}`;
  }
}

class DownloadError extends GoesError {}
class ImageExistsError extends GoesError {}

module.exports = {
  DownloadError,
  ImageExistsError
};
