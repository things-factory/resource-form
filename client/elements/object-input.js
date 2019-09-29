import { LitElement, html, css, customElement } from 'lit-element'
import gql from 'graphql-tag'
import { client, gqlBuilder } from '@things-factory/shell'
import { openPopup } from '@things-factory/layout-base'
import { i18next } from '@things-factory/i18n-base'

import './object-selector'

/*
 * USAGE
 *
 * <input type="text" query-name="boards" value="9432279e-28ea-4c60-bb92-6211439ec390" is="object-input" />
 *
 */
class ObjectInputContainer extends LitElement {
  static get styles() {
    return css`
      :host {
        display: inline;
        position: relative;
      }

      div {
        position: absolute;
        height: 100%;
        width: 100%;
        left: 0;
        top: 0;
      }

      ::slotted(input) {
        opacity: 0;
      }
    `
  }

  static get properties() {
    return {
      queryName: String,
      value: String,
      _object: Object
    }
  }

  render() {
    var object = this._object || {}
    return html`
      <slot> </slot>
      <div>${object.name}</div>
    `
  }

  get input() {
    return this.querySelector('input')
  }

  async firstUpdated() {
    await this.updateComplete

    this.shadowRoot.addEventListener('click', () => {
      this.queryName && this.openSelector(this.queryName)
    })
  }

  async updated(changes) {
    if (changes.has('queryName') || changes.has('value')) {
      if (this.queryName && this.value) {
        this._object = await this._fetchObject(this.queryName, this.value)
      } else {
        this._object = {}
      }
    }
  }

  async _fetchObject(queryName, id) {
    const response = await client.query({
      query: gql`
        query {
          ${queryName} (${gqlBuilder.buildArgs({
        filters: [
          {
            name: 'id',
            operator: 'eq',
            value: id
          }
        ]
      })}) {
            items {
              id
              name
              description
            }
            total
          }
        }
      `
    })

    return response.data[queryName].items[0]
  }

  openSelector(queryName) {
    if (this.popup) {
      delete this.popup
    }

    const confirmCallback = selected => {
      this._object = selected

      this.input.setAttribute('value', this._object.id)
    }

    var value = this._object || {}
    var basicArgs = {}

    var template =
      this.template ||
      html`
        <object-selector
          .value=${value.id}
          .confirmCallback=${confirmCallback.bind(this)}
          .queryName=${queryName}
          .basicArgs=${basicArgs}
        ></object-selector>
      `

    this.popup = openPopup(template, {
      backdrop: true,
      size: 'large',
      title: i18next.t('title.select_item')
    })
  }
}

customElements.define('object-input-container', ObjectInputContainer)

export class ObjectInput extends HTMLInputElement {
  static get observedAttributes() {
    return ['query-name', 'value']
  }

  connectedCallback() {
    if (this.__container) {
      this.__container.value = this.value
      this.__container.queryName = this.getAttribute('query-name')

      return
    }

    this.__container = document.createElement('object-input-container')
    this.parentNode.insertBefore(this.__container, this)
    this.__container.appendChild(this)
  }

  async attributeChangedCallback(name, oldValue, newValue) {}
}

customElements.define('object-input', ObjectInput, { extends: 'input' })
