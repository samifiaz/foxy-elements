import '@vaadin/vaadin-button';
import '../Calendar/index';
import '../Spinner/index';
import '../I18n/index';

import { SubscriptionCancellationForm } from './SubscriptionCancellationForm';

customElements.define('foxy-subscription-cancellation-form', SubscriptionCancellationForm);

export { SubscriptionCancellationForm };
