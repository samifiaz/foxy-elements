import { CSSResult, CSSResultArray } from 'lit-element';
import { Data, TextFieldParams } from './types';
import { ScopedElementsMap, ScopedElementsMixin } from '@open-wc/scoped-elements';
import { TemplateResult, html } from 'lit-html';

import { ConfirmDialog } from '../../private/ConfirmDialog/ConfirmDialog';
import { DialogHideEvent } from '../../private/Dialog/DialogHideEvent';
import { NucleonElement } from '../NucleonElement/index';
import { NucleonV8N } from '../NucleonElement/types';
import { PropertyTable } from '../../private/index';
import { Themeable } from '../../../mixins/themeable';
import { addBreakpoints } from '../../../utils/add-breakpoints';
import { ifDefined } from 'lit-html/directives/if-defined';
import { validate as isEmail } from 'email-validator';
import memoize from 'lodash-es/memoize';

export class CustomerForm extends ScopedElementsMixin(NucleonElement)<Data> {
  static get scopedElements(): ScopedElementsMap {
    return {
      'vaadin-text-field': customElements.get('vaadin-text-field'),
      'x-property-table': PropertyTable,
      'x-confirm-dialog': ConfirmDialog,
      'vaadin-button': customElements.get('vaadin-button'),
      'foxy-spinner': customElements.get('foxy-spinner'),
      'foxy-i18n': customElements.get('foxy-i18n'),
    };
  }

  static get styles(): CSSResult | CSSResultArray {
    return Themeable.styles;
  }

  static get v8n(): NucleonV8N<Data> {
    return [
      ({ first_name: v }) => !v || v.length <= 50 || 'first_name_too_long',
      ({ last_name: v }) => !v || v.length <= 50 || 'last_name_too_long',
      ({ tax_id: v }) => !v || v.length <= 50 || 'tax_id_too_long',
      ({ email: v }) => (v && v.length > 0) || 'email_required',
      ({ email: v }) => (v && v.length <= 100) || 'email_too_long',
      ({ email: v }) => (v && isEmail(v)) || 'email_invalid_email',
    ];
  }

  private static __ns = 'customer-form';

  private __getValidator = memoize((prefix: string) => () => {
    return !this.errors.some(err => err.startsWith(prefix));
  });

  private __bindField = memoize((key: keyof Data) => {
    return (evt: CustomEvent) => {
      this.edit({ [key]: (evt.target as HTMLInputElement).value });
    };
  });

  private __untrackTranslations?: () => void;

  private __removeBreakpoins?: () => void;

  connectedCallback(): void {
    super.connectedCallback();
    this.__untrackTranslations = customElements
      .get('foxy-i18n')
      .onTranslationChange(() => this.requestUpdate());
    this.__removeBreakpoins = addBreakpoints(this);
  }

  render(): TemplateResult {
    const ns = CustomerForm.__ns;

    const isTemplateValid = this.in({ idle: { template: { dirty: 'valid' } } });
    const isSnapshotValid = this.in({ idle: { snapshot: { dirty: 'valid' } } });
    const isDisabled = !this.in('idle');
    const isValid = isTemplateValid || isSnapshotValid;

    return html`
      <x-confirm-dialog
        message="delete_prompt"
        confirm="delete"
        cancel="cancel"
        header="delete"
        theme="primary error"
        lang=${this.lang}
        ns=${ns}
        id="confirm"
        data-testid="confirm"
        @hide=${this.__handleConfirmHide}
      >
      </x-confirm-dialog>

      <div class="space-y-l" data-testid="wrapper" aria-busy=${this.in('busy')} aria-live="polite">
        <div class="grid grid-cols-1 sm-grid-cols-2 gap-m">
          ${this.__renderTextField({ field: 'first_name' })}
          ${this.__renderTextField({ field: 'last_name' })}
          ${this.__renderTextField({ field: 'email', required: true })}
          ${this.__renderTextField({ field: 'tax_id' })}
        </div>

        ${this.href ? this.__renderPropertyTable() : undefined}

        <vaadin-button
          class="w-full"
          theme=${this.in('idle') ? `primary ${this.href ? 'error' : 'success'}` : ''}
          data-testid="action"
          ?disabled=${(this.in({ idle: 'template' }) && !isValid) || isDisabled}
          @click=${this.__handleActionClick}
        >
          <foxy-i18n ns=${ns} key=${this.href ? 'delete' : 'create'} lang=${this.lang}></foxy-i18n>
        </vaadin-button>

        ${!this.in('idle')
          ? html`
              <div class="absolute inset-0 flex items-center justify-center">
                <foxy-spinner
                  class="p-m bg-base shadow-xs rounded-t-l rounded-b-l"
                  state=${this.in('busy') ? 'busy' : 'error'}
                  layout="vertical"
                  data-testid="spinner"
                >
                </foxy-spinner>
              </div>
            `
          : ''}
      </div>
    `;
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.__untrackTranslations?.();
    this.__removeBreakpoins?.();
    this.__getValidator.cache.clear?.();
  }

  private get __t() {
    return customElements.get('foxy-i18n').i18next.getFixedT(this.lang, CustomerForm.__ns);
  }

  private __renderPropertyTable() {
    return html`
      <x-property-table
        .items=${(['date_modified', 'date_created'] as const).map(field => ({
          name: this.__t(field),
          value: this.data ? this.__t('date', { value: new Date(this.data[field]) }) : '',
        }))}
      >
      </x-property-table>
    `;
  }

  private __getErrorMessage(prefix: string) {
    const error = this.errors.find(err => err.startsWith(prefix));
    return error ? this.__t(error.replace(prefix, 'v8n')).toString() : '';
  }

  private __renderTextField({ field, required = false }: TextFieldParams) {
    return html`
      <vaadin-text-field
        label=${this.__t(field).toString()}
        value=${ifDefined(this.form?.[field]?.toString())}
        error-message=${this.__getErrorMessage(field)}
        data-testid=${field}
        .checkValidity=${this.__getValidator(field)}
        ?disabled=${!this.in('idle')}
        ?required=${required}
        @input=${this.__bindField(field)}
        @keydown=${this.__handleKeyDown}
      >
      </vaadin-text-field>
    `;
  }

  private __handleKeyDown(evt: KeyboardEvent) {
    if (evt.key === 'Enter') this.submit();
  }

  private __handleActionClick(evt: Event) {
    if (this.in({ idle: 'snapshot' })) {
      const confirm = this.renderRoot.querySelector('#confirm');
      (confirm as ConfirmDialog).show(evt.currentTarget as HTMLElement);
    } else {
      this.submit();
    }
  }

  private __handleConfirmHide(evt: DialogHideEvent) {
    if (!evt.detail.cancelled) this.delete();
  }
}
