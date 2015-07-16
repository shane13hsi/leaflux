export default function transmitter() {
  const subscriptions = [];

  const unsubscribe = (onChange) => {
    const idx = subscriptions.indexOf(onChange);
    if (idx >= 0) {
      subscriptions.splice(idx, 1);
    }
  };

  const subscribe = (onChange) => {
    subscriptions.push(onChange);
    // NOTE:  闭包会持续对 onChange 的引用
    const dispose = () => unsubscribe(onChange);
    return {dispose};
  };

  const push = (value) => {
    subscriptions.forEach(subscription => subscription(value));
  };

  return {subscribe, push, unsubscribe};
}
