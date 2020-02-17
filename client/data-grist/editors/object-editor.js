import '@material/mwc-icon'
import { i18next } from '@things-factory/i18n-base'
import { openPopup } from '@things-factory/layout-base'
import { css, html, LitElement } from 'lit-element'
import '../../elements/object-selector'

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
        justify-content: inherit;
      }

      span {
        display: flex;
        flex: auto;

        justify-content: inherit;
      }

      mwc-icon {
        width: 20px;
        font-size: 1.5em;
        margin-left: auto;
      }
    `
  }

  render() {
    var value = this.value || {}

    var { nameField = 'name', descriptionField = 'description' } = this.column.record.options || {}
    var name, description
    if (typeof nameField === 'function') {
      name = nameField(value)
    } else {
      name = value[nameField]
    }

    if (typeof descriptionField === 'function') {
      description = descriptionField(value)
    } else {
      description = value[descriptionField] && `(${value[descriptionField]})`
    }

    return html`
      ${!value
        ? html``
        : html`
            <span>${name || ''}${description || ''}</span>
          `}
      <mwc-icon>arrow_drop_down</mwc-icon>
    `
  }

  async firstUpdated() {
    this.value = this.record[this.column.name]
    this.template = ((this.column.record || {}).options || {}).template

    await this.updateComplete

    this.shadowRoot.addEventListener('click', e => {
      e.stopPropagation()

      this.openSelector()
    })
  }

  openSelector() {
    if (this.popup) {
      delete this.popup
    }

    const confirmCallback = selected => {
      var { idField = 'id', nameField = 'name', descriptionField = 'description' } = this.column.record.options || {}

      this.dispatchEvent(
        new CustomEvent('field-change', {
          bubbles: true,
          composed: true,
          detail: {
            before: this.value,
            after: {
              ...(this.column.record.options.select || [])
                .map(field => field.name)
                .reduce((obj, fieldName) => {
                  return (obj = {
                    ...obj,
                    [fieldName]: selected[fieldName]
                  })
                }, {}),
              [idField]: selected[idField],
              [nameField]: selected[nameField],
              [descriptionField]: selected[descriptionField]
            },
            record: this.record,
            column: this.column,
            row: this.row
          }
        })
      )
    }

    var value = this.value || {}
    var valueField = this.column.record.options.valueField
    var actualValue
    if (typeof valueField === 'function') {
      actualValue = valueField(value)
    } else if (valueField) {
      actualValue = value[valueField]
    } else {
      actualValue = value.id
    }

    var template =
      this.template ||
      html`
        <object-selector
          .value=${actualValue}
          .confirmCallback=${confirmCallback.bind(this)}
          .queryName=${this.column.record.options.queryName}
          .select=${this.column.record.options.select}
          .list=${this.column.record.options.list}
          .basicArgs=${this.column.record.options.basicArgs}
          .valueField=${this.column.record.options.valueField}
        ></object-selector>
      `

    this.popup = openPopup(template, {
      backdrop: true,
      size: 'large',
      title: i18next.t('title.select_item')
    })
  }
}

customElements.define('object-editor', ObjectEditor)
