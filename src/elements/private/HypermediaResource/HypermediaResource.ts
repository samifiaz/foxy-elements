import { ElementContext, ElementError, ElementEvent, ElementResourceV8N, Resource } from './types';
import { StateMachine, interpret } from 'xstate';

import { PropertyDeclarations } from 'lit-element';
import { Translatable } from '../../../mixins/translatable';
import { isEqual } from 'lodash-es';
import { machine } from './machine';

export abstract class HypermediaResource<T extends Resource> extends Translatable {
  static get resourceV8N(): ElementResourceV8N<any> {
    return {};
  }

  static get properties(): PropertyDeclarations {
    return {
      resource: { attribute: false, noAccessor: true },
      href: { type: String, noAccessor: true },
    };
  }

  private readonly __deferredEvents: ElementEvent<T>[] = [];

  private readonly __machine = machine.withContext({
    resourceV8N: (this.constructor as typeof HypermediaResource).resourceV8N,
    resource: null,
    element: this,
    backup: null,
    errors: [],
    href: null,
  }) as StateMachine<ElementContext<T>, any, ElementEvent<T>>;

  private readonly __service = interpret(this.__machine)
    .onTransition(({ changed }) => changed && this.requestUpdate())
    .onChange(() => this.requestUpdate());

  get errors(): ElementError[] {
    const { initialized } = this.__service;
    return initialized ? this.__service.state.context.errors : [];
  }

  get href(): string | null {
    const { initialized } = this.__service;
    return initialized ? this.__service.state.context.href : null;
  }

  set href(value: string | null) {
    if (value !== this.href) this.__send({ type: 'SET_HREF', data: value });
  }

  get resource(): T | null {
    const { initialized } = this.__service;
    return initialized ? this.__service.state.context.resource : null;
  }

  set resource(value: T | null) {
    if (!isEqual(value, this.resource)) this.__send({ type: 'SET_RESOURCE', data: value });
  }

  abstract readonly rel: string;

  connectedCallback(): void {
    super.connectedCallback();
    if (!this.__service.initialized) {
      this.__service.start();
      this.__deferredEvents.forEach(evt => this.__service.send(evt));
      this.__deferredEvents.length = 0;
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.__service.stop();
  }

  protected _getErrorMessages(): Record<string, string> {
    return this.errors
      .filter(err => err.type === 'input')
      .reduce((map, err) => ({ ...map, [err.target!]: this._t(err.code!) }), {});
  }

  protected _setProperty(resource: Partial<T>): void {
    this.__send({ type: 'SET_PROPERTY', data: resource });
  }

  protected _restore(): void {
    this.__send({ type: 'RELOAD' });
  }

  protected _reload(): void {
    this.__send({ type: 'RELOAD' });
  }

  protected _submit(): void {
    this.__send({ type: 'SUBMIT' });
  }

  protected _delete(): void {
    this.__send({ type: 'DELETE' });
  }

  protected _is(state: string): boolean {
    return this.__service.state.matches(state);
  }

  private __send(evt: ElementEvent<T>) {
    this.__service.initialized ? this.__service.send(evt) : this.__deferredEvents.push(evt);
  }
}
