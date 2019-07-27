import { LitElement, html, css } from 'lit-element'

import '@material/mwc-icon'

import { openPopup } from '@things-factory/layout-base'
import './object-selector'

export class ObjectEditor extends LitElement {
  static get properties() {
    return {
      value: Object,
      column: Object,
      record: Object,
      row: Number
    }
  }

  static get styles() {
    return css`
      :host {
        display: flex;
        flex-flow: row nowrap;

        padding: 7px 0px;
        box-sizing: border-box;

        width: 100%;
        height: 100%;

        border: 0;
        background-color: transparent;

        font: var(--grist-object-editor-font);
        color: var(--grist-object-editor-color);
      }

      span {
        display: block;
        flex: auto;

        height: 100%;

        text-align: inherit;
      }

      mwc-icon {
        width: 20px;
        font-size: 20px;
        vertical-align: middle;
      }
    `
  }

  render() {
    var { idField = 'id', nameField = 'name', descriptionField = 'description' } = this.column.record.options || {}
    var value = this.value || {
      [idField]: '',
      [nameField]: '',
      [descriptionField]: ''
    }

    if (!JSON.stringify(value[descriptionField])) {
    }

    return html`
      ${!JSON.stringify(value[descriptionField])
        ? html`
            <span>${value[nameField]}</span>
            <mwc-icon>arrow_drop_down</mwc-icon>
          `
        : html`
            <span>${value[nameField]} (${value[descriptionField]})</span>
            <mwc-icon>arrow_drop_down</mwc-icon>
          `}
    `
  }

  firstUpdated() {
    this.value = this.record[this.column.name]
    this.template = ((this.column.record || {}).options || {}).template

    this.addEventListener('click', e => {
      e.stopPropagation()

      this.openSelector()
    })
    this.openSelector()
  }

  get icon() {
    return this.shadowRoot.querySelector('mwc-icon')
  }

  select() {}

  focus() {
    this.icon.focus()
  }

  openSelector() {
    if (this.popup) {
      delete this.popup
    }

    const confirmCallback = selected => {
      var after = Object.assign({}, this.record, {
        __dirty__: 'M',
        [this.column.name]: selected
      })

      this.dispatchEvent(
        new CustomEvent('record-change', {
          bubbles: true,
          composed: true,
          detail: {
            before: this.record,
            after,
            row: this.row,
            column: this.column
          }
        })
      )
    }

    var template =
      this.template ||
      html`
        <object-selector
          .value=${this.value.id}
          style="width: 550px;height: 400px;"
          .confirmCallback=${confirmCallback.bind(this)}
          .queryName=${this.column.record.options.queryName}
          .basicArgs=${this.column.record.options.basicArgs}
        ></object-selector>
      `

    this.popup = openPopup(template, {
      backdrop: true
    })
  }
}

customElements.define('object-editor', ObjectEditor)
