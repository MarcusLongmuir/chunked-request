import { isObject } from '../util';

export const READABLE_BYTE_STREAM = 'readable-byte-stream';

export default function fetchRequest(options) {
  const { onRawChunk, onRawComplete, method, body, credentials } = options;
  const headers = marshallHeaders(options.headers);

  function pump(reader, res) {
    return reader.read()
      .then(result => {
        if (result.done) {
          return onRawComplete({
            statusCode: res.status,
            transport: READABLE_BYTE_STREAM,
            raw: res
          });
        }
        onRawChunk(result.value);
        return pump(reader, res);
      });
  }

  function onError(err) {
    options.onRawComplete({
      statusCode: 0,
      transport: READABLE_BYTE_STREAM,
      raw: err
    });
  }

  fetch(options.url, { headers, method, body, credentials })
    .then(res => {
      options.onRawHeaders(res.headers, res.status);
      return pump(res.body.getReader(), res)
    })
    .catch(onError);
}

function marshallHeaders(v) {
  if (v instanceof Headers) {
    return v;
  } else if (isObject(v)) {
    return new Headers(v);
  }
}
