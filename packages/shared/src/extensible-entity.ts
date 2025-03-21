/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { VerseaError } from './error';

export interface ExtensiblePropDescription {
  required?: boolean;
  default?: unknown;
  validator?: (value: unknown) => boolean;
  onMerge?: (value: unknown, otherValue: unknown) => unknown;
}

/**
 * 获取所有的派生类
 * @param instance 派生类的实例
 * @param baseClass 基础类
 */
function findAllDerivedClass(
  instance: ExtensibleEntity,
  baseClass: typeof ExtensibleEntity,
  currentValue: typeof ExtensibleEntity[] = [],
): typeof ExtensibleEntity[] {
  const targetConstructor = instance.constructor as typeof ExtensibleEntity;

  // 只寻找派生类，不包含这个基类
  if (targetConstructor === baseClass) {
    return currentValue;
  }

  const result: typeof ExtensibleEntity[] = [...currentValue];
  if (targetConstructor && !currentValue.includes(targetConstructor)) {
    result.push(targetConstructor);
  }

  /* istanbul ignore next */
  if (!instance.__proto__) {
    return result;
  }

  return findAllDerivedClass(instance.__proto__ as ExtensibleEntity, baseClass, result);
}

export class ExtensibleEntity {
  [key: string]: unknown;

  /** 类上可扩展的属性和该属性的描述 */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  private static __ExtensiblePropDescriptions__: Record<string, ExtensiblePropDescription> | undefined;

  /** 实例上所有可扩展的属性和该属性的描述 */
  protected extensiblePropDescriptions: Record<string, ExtensiblePropDescription> = {};

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(options: Record<string, any> = {}) {
    const constructors = findAllDerivedClass(this, ExtensibleEntity);
    // 从子类开始遍历，子类 -> 孙子类 -> ...
    constructors.reverse().forEach((ctor) => {
      const descriptions: Record<string, ExtensiblePropDescription> | undefined = ctor.__ExtensiblePropDescriptions__;
      if (descriptions) {
        Object.keys(descriptions).forEach((key: string) => {
          this.extensiblePropDescriptions[key] = descriptions[key];
        });
      }
    });

    Object.keys(this.extensiblePropDescriptions).forEach((key: string) => {
      this._setEntityProp(key, options[key], this.extensiblePropDescriptions[key]);
    });
  }

  /**
   * 在实体类上新增一个字段
   */
  public static defineProp(key: string, description: ExtensiblePropDescription = {}): void {
    if (!Object.prototype.hasOwnProperty.call(this, '__ExtensiblePropDescriptions__')) {
      this.__ExtensiblePropDescriptions__ = {};
    }

    if (this.__ExtensiblePropDescriptions__![key]) {
      throw new VerseaError(`Duplicate prop: ${key}`);
    }

    if (
      process.env.NODE_ENV !== 'production' &&
      typeof description.default === 'object' &&
      description.default !== null
    ) {
      console.warn(
        `Invalid default value for prop "${key}": Props with type Object/Array must use a factory function to return the default value.`,
      );
    }

    this.__ExtensiblePropDescriptions__![key] = description;
  }

  private _setEntityProp(key: string, value: unknown, description: ExtensiblePropDescription): void {
    if (value === undefined) {
      const defaultValue = description.default;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      value = typeof defaultValue === 'function' ? defaultValue() : defaultValue;
    }

    if (description.required && value === undefined) {
      throw new VerseaError(`Missing required prop: "${key}"`);
    }

    if (description.validator && !description.validator(value)) {
      throw new VerseaError(`Invalid prop: custom validator check failed for prop "${key}"`);
    }

    this[key] = value;
  }
}
