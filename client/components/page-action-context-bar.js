import { LitElement, html, css } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin'

import '@material/mwc-button'

import { store } from '@things-factory/shell'

class PageActionContextBar extends connect(store)(LitElement) {
  static get properties() {
    return {
      _actions: Array
    }
  }

  static get styles() {
    return [css``]
  }

  render() {
    return html`
      ${this._actions.map(
        action => html`
          ${action.select && action.select.length > 0
            ? html`
                <select @change="${action.action}">
                  ${action.select.map(
                    option => html`
                      <option>${option}</option>
                    `
                  )}
                </select>
              `
            : html`
                <mwc-button @click="${action.action}">${action.title}</mwc-button>
              `}
        `
      )}
    `
  }

  stateChanged(state) {
    this._actions = (state.route && state.route.context && state.route.context.actions) || []
  }
}

customElements.define('page-action-context-bar', PageActionContextBar)
