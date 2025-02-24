import { expect, oneEvent } from '@open-wc/testing';

import { API } from './API';
import { API as CoreAPI } from '@foxy.io/sdk/core';
import { FetchEvent } from './FetchEvent';
import { stub } from 'sinon';

describe('NucleonElement', () => {
  describe('API', () => {
    it('extends FoxySDK.Core.API', () => {
      const api = new API(window);
      expect(api).to.be.instanceOf(CoreAPI);
      expect(api).to.have.deep.property('base', new URL(document.baseURI));
    });

    it('emits FetchEvent on given target when fetching', async () => {
      const whenGotEvent = oneEvent(window, 'fetch');
      const request = new Request('./test', {
        method: 'POST',
        body: 'Test',
        headers: { Foo: 'Bar' },
      });

      new API(window).fetch(request);
      const event = ((await whenGotEvent) as unknown) as FetchEvent;

      expect(event).to.be.instanceOf(FetchEvent);
      expect(event).to.have.property('cancelable', true);
      expect(event).to.have.property('composed', true);
      expect(event).to.have.property('bubbles', true);
      expect(event).to.have.deep.property('request', request);
    });

    it('makes a request if FetchEvent is not cancelled', () => {
      const fetchStub = stub(window, 'fetch').resolves(new Response());
      const request = new Request('./test');
      new API(window).fetch(request);

      expect(fetchStub).to.have.been.calledWith(request);
      fetchStub.restore();
    });

    it('leaves request handling to library consumer when FetchEvent is cancelled', () => {
      return new Promise<void>(resolve => {
        const fetchStub = stub(window, 'fetch').resolves(new Response());

        window.addEventListener('fetch', event => {
          event.preventDefault();
          expect(fetchStub).to.have.not.been.called;
          fetchStub.restore();
          resolve();
        });

        new API(window).fetch(new Request('./test'));
      });
    });
  });
});
