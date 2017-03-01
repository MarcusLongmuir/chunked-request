import BrowserHeaders from 'browser-headers';

import { isObject } from '../util';

export const READABLE_BYTE_STREAM = 'readable-byte-stream';

export default function fetchRequest(options) {
  const { onRawChunk, onRawComplete, method, body, credentials } = options;
  const headers = marshallHeaders(options.headers);

  function pump(reader, res) {
    return reader.read()
      .then(result => {
        if (result.done) {
          setTimeout(() => {
            onRawComplete({
              statusCode: res.status,
              transport: READABLE_BYTE_STREAM,
              raw: res
            });
          });
          return;
        }
        onRawChunk(result.value);
        return pump(reader, res);
      });
  }

  function onError(err) {
    setTimeout(() => {
      options.onRawComplete({
        statusCode: 0,
        transport: READABLE_BYTE_STREAM,
        raw: err
      });
    });
  }

  fetch(options.url, { headers, method, body, credentials })
    .then(res => {
      const browserHeaders = new BrowserHeaders(res.headers);
      options.onRawHeaders(browserHeaders, res.status);
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
