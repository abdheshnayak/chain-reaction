import NewProtocol from './protocol';

const EventEmitter = require('events');

const NewStarx = () => {
  // const Emitter = new ee();

  const JS_WS_CLIENT_TYPE = 'js-websocket';
  const JS_WS_CLIENT_VERSION = '0.0.1';

  const Protocol = NewProtocol();
  const decodeIOEncoder = null;
  const decodeIODecoder = null;
  const { Package } = Protocol;
  const { Message } = Protocol;
  // var EventEmitter = Emitter;
  // @ts-ignore
  const { rsa } = window;

  // if (
  //   typeof window !== 'undefined' &&
  //   typeof sys !== 'undefined' &&
  //   sys.localStorage
  // ) {
  //   window.localStorage = sys.localStorage;
  // }

  const RES_OK = 200;
  // eslint-disable-next-line no-unused-vars
  const RES_FAIL = 500;
  const RES_OLD_CLIENT = 501;

  if (typeof Object.create !== 'function') {
    Object.create = (o) => {
      function F() {}
      F.prototype = o;
      return new F();
    };
  }
  const root = {};

  const starx = Object.create(EventEmitter.prototype); // object extend from object
  root.starx = starx;
  // socket = null;
  let socket = null;
  let reqId = 0;
  const callbacks = {};
  const handlers = {};
  // Map from request id to route
  const routeMap = {};
  let dict = {}; // route string to code
  let abbrs = {}; // code to route string

  let isSocketOpen = false;

  let heartbeatInterval = 0;
  let heartbeatTimeout = 0;
  let nextHeartbeatTimeout = 0;
  const gapThreshold = 100; // heartbeat gap threashold
  let heartbeatId = null;
  let heartbeatTimeoutId = null;
  let handshakeCallback = null;

  let decode = null;
  let encode = null;

  let reconnect = false;
  let reconncetTimer = null;
  let reconnectUrl = null;
  let reconnectAttempts = 0;
  let reconnectionDelay = 5000;
  const DEFAULT_MAX_RECONNECT_ATTEMPTS = 10;

  let useCrypto;

  const handshakeBuffer = {
    sys: {
      type: JS_WS_CLIENT_TYPE,
      version: JS_WS_CLIENT_VERSION,
      rsa: {},
    },
    user: {},
  };

  let initCallback = null;

  const deCompose = (msg) => {
    let { route } = msg;

    // Decompose route from dict
    if (msg.compressRoute) {
      if (!abbrs[route]) {
        return {};
      }

      // eslint-disable-next-line no-multi-assign
      route = msg.route = abbrs[route];
    }

    if (decodeIODecoder && decodeIODecoder.lookup(route)) {
      return decodeIODecoder.build(route).decode(msg.body);
    }
    return JSON.parse(Protocol.strdecode(msg.body));

    // eslint-disable-next-line no-unreachable
    return msg;
  };

  // eslint-disable-next-line no-multi-assign
  const defaultDecode = (starx.decode = (data) => {
    const msg = Message.decode(data);

    if (msg.id > 0) {
      msg.route = routeMap[msg.id];
      delete routeMap[msg.id];
      if (!msg.route) {
        return;
      }
    }

    msg.body = deCompose(msg);
    // eslint-disable-next-line consistent-return
    return msg;
  });

  // eslint-disable-next-line no-multi-assign
  const defaultEncode = (starx.encode = (reqqId, route, msg) => {
    const type = reqqId ? Message.TYPE_REQUEST : Message.TYPE_NOTIFY;

    if (decodeIOEncoder && decodeIOEncoder.lookup(route)) {
      const Builder = decodeIOEncoder.build(route);
      msg = new Builder(msg).encodeNB();
    } else {
      msg = Protocol.strencode(JSON.stringify(msg));
    }

    let compressRoute = 0;
    if (dict && dict[route]) {
      route = dict[route];
      compressRoute = 1;
    }

    return Message.encode(reqqId, type, compressRoute, route, msg);
  });

  const reset = () => {
    reconnect = false;
    reconnectionDelay = 1000 * 5;
    reconnectAttempts = 0;
    clearTimeout(reconncetTimer);
  };

  const send = (packet) => {
    if (isSocketOpen) {
      socket.send(packet.buffer);
    }
  };

  const processPackage = (msgs) => {
    if (Array.isArray(msgs)) {
      for (let i = 0; i < msgs.length; i++) {
        const msg = msgs[i];
        handlers[msg.type](msg.body);
      }
    } else {
      handlers[msgs.type](msgs.body);
    }
  };

  const connect = (params, url, cb) => {
    console.log(`connect to ${url}`);

    params = params || {};
    const maxReconnectAttempts =
      params.maxReconnectAttempts || DEFAULT_MAX_RECONNECT_ATTEMPTS;
    reconnectUrl = url;

    // eslint-disable-next-line no-unused-vars
    const onopen = (event) => {
      isSocketOpen = true;
      if (reconnect) {
        starx.emit('reconnect');
      }
      reset();
      const obj = Package.encode(
        Package.TYPE_HANDSHAKE,
        Protocol.strencode(JSON.stringify(handshakeBuffer))
      );
      send(obj);
    };
    const onmessage = (event) => {
      // @ts-ignore
      processPackage(Package.decode(event.data), cb);
      // new package arrived, update the heartbeat timeout
      if (heartbeatTimeout) {
        nextHeartbeatTimeout = Date.now() + heartbeatTimeout;
      }
    };
    const onerror = (event) => {
      starx.emit('io-error', event);
      console.error('socket error: ', event);
    };
    const onclose = (event) => {
      isSocketOpen = false;
      starx.emit('close', event);
      starx.emit('disconnect', event);
      console.log('socket closed');
      // console.log('socket close: ', event);
      if (!!params.reconnect && reconnectAttempts < maxReconnectAttempts) {
        reconnect = true;
        reconnectAttempts++;
        reconncetTimer = setTimeout(() => {
          connect(params, reconnectUrl, cb);
        }, reconnectionDelay);
        reconnectionDelay *= 2;
      }
    };
    socket = new WebSocket(url);
    socket.binaryType = 'arraybuffer';
    socket.onopen = onopen;
    socket.onmessage = onmessage;
    socket.onerror = onerror;
    socket.onclose = onclose;
  };

  starx.init = (params, cb) => {
    initCallback = cb;
    const { host } = params;
    const { port } = params;
    const { path } = params;

    encode = params.encode || defaultEncode;
    decode = params.decode || defaultDecode;

    let url;
    if (host === 'localhost') {
      url = `ws://${host}`;
    } else {
      url = `wss://${host}`;
    }
    if (port) {
      url += `:${port}`;
    }

    if (path) {
      url += path;
    }

    handshakeBuffer.user = params.user;
    if (params.encrypt) {
      useCrypto = true;
      rsa.generate(1024, '10001');
      const data = {
        rsa_n: rsa.n.toString(16),
        rsa_e: rsa.e,
      };
      handshakeBuffer.sys.rsa = data;
    }
    handshakeCallback = params.handshakeCallback;
    connect(params, url, cb);

    root.starx = starx;
  };

  starx.disconnect = () => {
    if (socket) {
      if (socket.disconnect) socket.disconnect();
      if (socket.close) socket.close();
      console.log('disconnect');
      socket = null;
    }

    if (heartbeatId) {
      clearTimeout(heartbeatId);
      heartbeatId = null;
    }
    if (heartbeatTimeoutId) {
      clearTimeout(heartbeatTimeoutId);
      heartbeatTimeoutId = null;
    }
  };

  const sendMessage = (reqqId, route, msg) => {
    if (useCrypto) {
      msg = JSON.stringify(msg);
      const sig = rsa.signString(msg, 'sha256');
      msg = JSON.parse(msg);
      msg.__crypto__ = sig;
    }

    if (encode) {
      msg = encode(reqqId, route, msg);
    }

    const packet = Package.encode(Package.TYPE_DATA, msg);
    send(packet);
  };

  starx.request = (route, msg, cb) => {
    // @ts-ignore
    // eslint-disable-next-line no-undef
    if (arguments.length === 2 && typeof msg === 'function') {
      cb = msg;
      msg = {};
    } else {
      msg = msg || {};
    }
    route = route || msg.route;
    if (!route) {
      return;
    }

    reqId++;
    sendMessage(reqId, route, msg);

    callbacks[reqId] = cb;
    routeMap[reqId] = route;
  };

  starx.notify = (route, msg) => {
    msg = msg || {};
    sendMessage(0, route, msg);
  };

  // const handler = {};

  // eslint-disable-next-line no-unused-vars
  const heartbeat = (data) => {
    if (!heartbeatInterval) {
      // no heartbeat
      return;
    }

    const obj = Package.encode(Package.TYPE_HEARTBEAT);
    if (heartbeatTimeoutId) {
      clearTimeout(heartbeatTimeoutId);
      heartbeatTimeoutId = null;
    }

    if (heartbeatId) {
      // already in a heartbeat interval
      return;
    }
    heartbeatId = setTimeout(() => {
      heartbeatId = null;
      send(obj);

      nextHeartbeatTimeout = Date.now() + heartbeatTimeout;
      // eslint-disable-next-line no-use-before-define
      heartbeatTimeoutId = setTimeout(heartbeatTimeoutCb, heartbeatTimeout);
    }, heartbeatInterval);
  };

  const heartbeatTimeoutCb = () => {
    const gap = nextHeartbeatTimeout - Date.now();
    if (gap > gapThreshold) {
      heartbeatTimeoutId = setTimeout(heartbeatTimeoutCb, gap);
    } else {
      console.error('server heartbeat timeout');
      starx.emit('heartbeat timeout');
      starx.disconnect();
    }
  };

  // Initilize data used in starx client
  const initData = (data) => {
    if (!data || !data.sys) {
      return;
    }
    const d = data.sys.dict;

    // Init compress dict
    if (d) {
      dict = d;
      abbrs = {};

      Object.keys(d).map((route) => {
        abbrs[d[route]] = route;
        return null;
      });

      // for (const route in dict) {
      //   abbrs[dict[route]] = route;
      // }
    }

    // root.starx = starx;
  };

  const handshakeInit = (data) => {
    if (data.sys && data.sys.heartbeat) {
      heartbeatInterval = data.sys.heartbeat * 1000; // heartbeat interval
      heartbeatTimeout = heartbeatInterval * 2; // max heartbeat timeout
    } else {
      heartbeatInterval = 0;
      heartbeatTimeout = 0;
    }

    initData(data);

    if (typeof handshakeCallback === 'function') {
      handshakeCallback(data.user);
    }
  };

  const processMessage = (starx_, msg) => {
    if (!msg.id) {
      // server push message
      starx_.emit(msg.route, msg.body);
      return;
    }

    // if have a id then find the callback function with the request
    const cb = callbacks[msg.id];

    delete callbacks[msg.id];
    if (typeof cb !== 'function') {
      return;
    }

    cb(msg.body);
  };

  const handshake = (data) => {
    data = JSON.parse(Protocol.strdecode(data));
    if (data.code === RES_OLD_CLIENT) {
      starx.emit('error', 'client version not fullfill');
      return;
    }

    if (data.code !== RES_OK) {
      starx.emit('error', 'handshake fail');
      return;
    }

    handshakeInit(data);

    const obj = Package.encode(Package.TYPE_HANDSHAKE_ACK);
    send(obj);
    if (initCallback) {
      initCallback(socket);
    }
  };

  const onData = (data) => {
    let msg = data;
    if (decode) {
      msg = decode(msg);
    }
    processMessage(starx, msg);
  };

  const onKick = (data) => {
    data = JSON.parse(Protocol.strdecode(data));
    starx.emit('onKick', data);
  };

  handlers[Package.TYPE_HANDSHAKE] = handshake;
  handlers[Package.TYPE_HEARTBEAT] = heartbeat;
  handlers[Package.TYPE_DATA] = onData;
  handlers[Package.TYPE_KICK] = onKick;

  // const processMessageBatch = (starx_, msgs) => {
  //   for (let i = 0, l = msgs.length; i < l; i++) {
  //     processMessage(starx_, msgs[i]);
  //   }
  // };

  return root;
};

export default NewStarx;
