import Dispatcher from '../src/Dispatcher';
import invariant from '../src/invariant';
import sinon from 'sinon';
import {assert} from 'chai';

describe('Dispatcher', () => {
  process.env.NODE_ENV = 'development';

  let dispatcher;
  let callbackA;
  let callbackB;

  beforeEach(() => {
    dispatcher = new Dispatcher();
    callbackA = sinon.spy();
    callbackB = sinon.spy();
  });

  it('可以分派 payload 到所有注册的回调', () => {
    dispatcher.register(callbackA);
    dispatcher.register(callbackB);
    const payload = {};

    dispatcher.dispatch(payload);
    assert(callbackA.withArgs(payload).calledOnce);
    assert(callbackB.withArgs(payload).calledOnce);

    dispatcher.dispatch(payload);
    assert(callbackA.withArgs(payload).calledTwice);
    assert(callbackB.withArgs(payload).calledTwice);
  });

  it('可以等待早注册的回调执行完毕再执行', () => {
    const tokenA = dispatcher.register(callbackA);

    dispatcher.register(payload => {
      dispatcher.waitFor([tokenA]);
      assert(callbackA.withArgs(payload).calledOnce);
      callbackB(payload);
    });

    const payload = {};
    dispatcher.dispatch(payload);
    assert(callbackA.withArgs(payload).calledOnce);
    assert(callbackB.withArgs(payload).calledOnce);
  });

  it('可以等待晚注册的回调执行完毕再执行', () => {
    dispatcher.register(payload => {
      dispatcher.waitFor([tokenB]);
      assert(callbackB.withArgs(payload).calledOnce);
      callbackA(payload);
    });

    const tokenB = dispatcher.register(callbackB);

    const payload = {};
    dispatcher.dispatch(payload);
    assert(callbackA.withArgs(payload).calledOnce);
    assert(callbackB.withArgs(payload).calledOnce);
  });

});

