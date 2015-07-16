import {assert} from 'chai';
import transmitter from '../src/transmitter';
import sinon from 'sinon';

describe('transmitter', () => {
  it('存在方法 subscribe push unsubscribe', () => {
    const bus = transmitter();
    assert.isFunction(bus.subscribe);
    assert.isFunction(bus.push);
    assert.isFunction(bus.unsubscribe);
  });

  it('可以使用 subscribe 注册一个函数，返回对象带有 dispose 方法，可以之后 dispose 掉', () => {
    const bus = transmitter();
    const result = bus.subscribe(()=> {
    });
    assert.isObject(result);
    assert.isFunction(result.dispose);
    const undef = result.dispose();
    assert.isUndefined(undef);
  });

  it('可以 pushing 值到之前注册的所有函数中', () => {
    const bus = transmitter();
    const spy = sinon.spy();

    const subscription = bus.subscribe(spy);

    bus.push('hello');

    assert.ok(spy.calledOnce);
    assert(spy.firstCall.args[0] === 'hello');

    subscription.dispose();
  });

  it('可以 unsubscribe', () => {
    const bus = transmitter();
    const spy = sinon.spy();
    bus.subscribe(spy);
    bus.unsubscribe(spy);

    bus.push(1);

    assert.notOk(spy.calledOnce);
    assert(spy.callCount === 0);
  });

  it('可以 unsubscribe 未注册的函数', () => {
    const bus = transmitter();
    bus.unsubscribe(() => {});
  });
});
