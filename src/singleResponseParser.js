export default function singleResponseParser(bytes, state = {body: ''}, flush = false) {
  if (!state.textDecoder) {
    state.textDecoder = new TextDecoder();
  }

  const textDecoder = state.textDecoder;
  state.body += textDecoder.decode(bytes, { stream: !flush });

  if (flush) {
    return [[JSON.parse(state.body)], state];
  }

  return [ [], state ];
}
