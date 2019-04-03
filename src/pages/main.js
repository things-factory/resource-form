import { html, LitElement } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin.js'
import { store } from '@things-factory/shell'

import logo from '../../assets/images/hatiolab-logo.png'

class ResourceFormMain extends connect(store)(LitElement) {
  static get properties() {
    return {
      resourceForm: String
    }
  }
  render() {
    return html`
      <section>
        <h2>ResourceForm</h2>
        <img src=${logo}></img>
      </section>
    `
  }

  stateChanged(state) {
    this.resourceForm = state.resourceForm.state_main
  }
}

window.customElements.define('resource-form-main', ResourceFormMain)
