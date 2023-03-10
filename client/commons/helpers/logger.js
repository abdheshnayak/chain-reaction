const isDev = process.env.NODE_ENV === 'development';

const logger = {
  time: isDev ? console.time : () => {},
  timeEnd: isDev ? console.timeEnd : () => {},
  log: isDev ? console.log : () => {},

  warn: console.warn,
  trace: (...args) => {
    let err;
    try {
      err = JSON.stringify(args, null, 2);
    } catch (_) {
      console.log('');
    }

    if (err) {
      console.trace(err);
    } else {
      console.trace(args);
    }
  },

  error: (...args) => {
    let err;
    try {
      err = JSON.stringify(args, null, 2);
    } catch (_) {
      console.log('');
    }

    if (err) {
      console.trace(err);
    } else {
      console.trace(args);
    }
  },
};

export default logger;
