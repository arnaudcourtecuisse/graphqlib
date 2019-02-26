
const flowAsync = (fn, ...fns) => {
  const nextFn = fns.length ? flowAsync(...fns) : x => x;
  return async (...args) => nextFn(await fn(...args));
};

module.exports = { flowAsync };
