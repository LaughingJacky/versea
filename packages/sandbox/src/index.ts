// export default 'hello world';
import {
  buildProviderModule,
  IAppService,
  IAppServiceKey,
  App,
  AppOptions,
  IAppKey,
  provide,
  provideValue,
  IRouter,
  IRouterKey,
} from '@versea/core';
import { Container, inject } from 'inversify';

const parent = new Container({ defaultScope: 'Singleton' });

@provide(IAppKey, 'Constructor')
export class NewApp extends App {
  public path: string;

  constructor(options: AppOptions & { path: string }) {
    super(options);
    this.path = options.path;
  }
}

provideValue('test1', 'TestData');

@provide('Test')
export class Test {
  // eslint-disable-next-line @typescript-eslint/no-parameter-properties
  constructor(@inject('TestData') public data: string) {}
}

parent.load(buildProviderModule());

// provideValue('test2', 'TestData');

parent.rebind('TestData').toConstantValue('test2');

// parent.rebind(IAppKey).toConstructor(NewApp);

const app1 = parent.get<IAppService>(IAppServiceKey).registerApplication({
  name: 'app1',
  path: 'app1_path',
} as AppOptions);
const app2 = parent.get<IAppService>(IAppServiceKey).registerApplication({
  name: 'app2',
  path: 'app2_path',
  routes: [
    {
      path: 'a',
    },
  ],
} as AppOptions);
const matcher = parent.get<IRouter>(IRouterKey);
const test = parent.get<Test>('Test');
console.log(app1, app2, matcher);
console.log(test);
