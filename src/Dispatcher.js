/**
 * @provideModule Dispatcher
 * */

import invariant from './invariant';

const _prefix = 'ID_';

/**
 * 用来广播 payloads 到注册的回调。和一般的 pub-sub 区别在于两点：
 *
 *  1) 回调并不会订阅特定的事件。每一个 payload 都会分派给所有注册的回调。
 *  2) 回调会被整个或者部分延迟，以等待其他回调执行完毕。
 * */
export default class Dispatcher {

  constructor() {
    /**
     * @type {number} 内部 ID 生成器，自增 1
     */
    this._lastID = 1;
    /**
     * @type {Object} 维护所有被注册的回调
     */
    this._callbacks = {};
    /**
     * @type {boolean} 内部状态，表明在被 dispatching
     */
    this._isDispatching = false;
    /**
     * @type {Object}
     */
    this._isPending = {};
    /**
     * @type {Object}
     */
    this._isHandled = {};
    /**
     * @type {Object} 当前挂起（正在处理）的 payload
     */
    this._pendingPayload = null;
  }

  /**
   * 注册一个回调，用来被每一个分派的 payload 调用
   * 返回一个 token，被 `waitFor()` 会用到
   *
   * @param {function} callback
   * @return {string} id
   * */
  register(callback) {
    let id = _prefix + this._lastID++;
    this._callbacks[id] = callback;
    return id;
  }

  /**
   * 根据 token 删除一个回调
   *
   * @param {string} id
   * */
  unregister(id) {
    invariant(
      this._callbacks[id],
      'Dispatcher.unregister(...): `%s` does not map to a registered callback.',
      id
    );
    delete this._callbacks[id];
  }

  /**
   * 等待特定的回调执行完后再执行当前的回调。
   * 只有在 dispatching 时才可以被使用
   *
   * @param {array<string>} ids
   * */
  waitFor(ids) {
    invariant(
      this._isDispatching,
      'Dispatcher.waitFor(...): Must be invoked while dispatching.'
    );
    for (let ii = 0; ii < ids.length; ii++) {
      let id = ids[ii];
      if (this._isPending[id]) {
        // 如果是挂起状态，但是没有已处理，则认为是 循环依赖
        invariant(
          this._isHandled[id],
          'Dispatcher.waitFor(...): Circular dependency detected while ' +
          'waiting for `%s`.',
          id
        );
        continue;
      }
      invariant(
        this._callbacks[id],
        'Dispatcher.waitFor(...): `%s` does not map to a registered callback.',
        id
      );
      this._invokeCallback(id);
    }
  }

  /**
   * 将一个 payload 分派给所有注册过的回调
   *
   * @param {Object} payload
   * */
  dispatch(payload) {
    invariant(
      !this._isDispatching,
      'Dispatch.dispatch(...): Cannot dispatch in the middle of a dispatch.'
    );
    this._startDispatching(payload);
    try {
      Object.keys(this._callbacks).forEach(id => {
        // 如果是挂起，则跳过。由于在 _startDispatching 时清除过挂起状态，此时挂起，
        // 有可能是 waitFor 时调用了 _invokeCallback
        if (this._isPending[id]) {
          return;
        }
        this._invokeCallback(id);
      });
    } finally {
      this._stopDispatching();
    }
  }

  /**
   * 返回 Dispatcher 是否在 dispatching
   *
   * @return {boolean}
   * */
  isDispatching() {
    return this._isDispatching;
  }

  /**
   * 根据 id 调用保存的回调出来 payload。并且设置内部状态。
   * 调用方有两处：
   *  1) 在 waitFor 中，调用 waitFor 的参数 ids 数组，设置要等待的回调的内部状态
   *  2) dispatch 时候，设置显式 dispatch 的回调的内部状态
   *
   * @param {stirng} id
   * @internal
   * */
  _invokeCallback(id) {
    // 挂起状态
    this._isPending[id] = true;
    // 调用回调处理
    this._callbacks[id](this._pendingPayload);
    // 已处理（ TODO: 似乎不是同步的）
    this._isHandled[id] = true;
  }

  /**
   * 当 dispatching 的时候，设置相应的内部状态：
   * 1) 清除挂起/已处理状态
   * 2) 设置挂起 payload
   * 3) 设置 _isDispatching 为 true
   *
   * @param {Object} payload
   * @internal
   * */
  _startDispatching(payload) {
    Object.keys(this._callbacks).forEach(id => {
      this._isPending[id] = false;
      this._isHandled[id] = false;
    });
    this._pendingPayload = payload;
    this._isDispatching = true;
  }

  /**
   * 清除 dispatching 用到的内部状态
   *
   * @internal
   * */
  _stopDispatching() {
    this._pendingPayload = null;
    this._isDispatching = false;
  }

}
