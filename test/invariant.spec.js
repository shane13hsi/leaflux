import {assert} from 'chai';
import invariant from '../src/invariant';

describe('invariant', () => {

  afterEach(() => {
    delete process.env.NODE_ENV;
  });

  it('条件为true的时候，不会抛出异常；否则抛出定义好的异常信息', () => {
    assert.doesNotThrow(() => invariant(true, 'invariant message'));
    assert.throws(() => invariant(false, 'invariant message'), /invariant message/);
  });

  it('在开发环境中，不能没有预定义的异常信息', () => {
    process.env.NODE_ENV = 'development';
    assert.throws(() => invariant(true), /requires an error/i);
    assert.throws(() => invariant(false), /requires an error/i);

  });

  it('在生产环境中，可以没有预定义的异常信息', () => {
    process.env.NODE_ENV = 'production';
    assert.doesNotThrow(() => invariant(true));
    assert.throws(() => invariant(false), /use the non-minified dev environment/i);
  });
});