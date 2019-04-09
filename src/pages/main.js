import { store } from '@things-factory/shell'
import { html, css } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin.js'
import ResourceDataParser from '../components/resource-data-parser'

class ResourceFormMain extends connect(store)(ResourceDataParser) {
  static get styles() {
    return css`
      :host {
        height: 100%;
        display: flex;
        flex-direction: column;
      }
      section {
        flex: 1;
        display: flex;
        flex-direction: column;
      }
      textarea {
        height: 400px;
      }
    `
  }
  static get properties() {
    return {
      resourceForm: String,
      resourceId: String
    }
  }

  render() {
    return html`
      <header>
        ${this.renderTitle()} ${this.renderSearchForm()}
      </header>

      <section>
        ${this.renderGrid()}
      </section>

      <footer>
        ${this.renderButton()}
      </footer>
    `
  }

  renderTitle() {
    return html`
      <h2>${this.menuTitle}</h2>
    `
  }

  renderSearchForm() {
    return html`
      <form id="search-form" @submit="${this._handleFormSubmit}">
        ${(this.searchFormFields || []).map(searchFormField => {
          return html`
            <input name="${searchFormField.name}" placeholder="${searchFormField.label}" op="${searchFormField.op}" />
          `
        })}

        <button>Search</button>
      </form>
    `
  }

  renderGrid() {
    return html`
      <textarea id="grid"></textarea>
    `
  }

  renderButton() {
    return html`
      <div id="btn-container">
        ${(this.buttons || []).map(button => {
          return html`
            <button id="${button.text}-btn" @click="${this._handleBtnClick}">${button.text}</button>
          `
        })}
      </div>
    `
  }

  async _getResourceData() {
    // TODO: get base url from store or somthing...
    this.baseUrl = 'http://52.231.75.202/rest'
    const res = await fetch(`${this.baseUrl}/menus/${this.resourceId}/menu_meta`, {
      credentials: 'include'
    })

    if (res.ok) {
      const json = await res.json()
      if (json) {
        this.menuTitle = json.menu.name
        this.resourceUrl = json.menu.resource_url
        this._parseResourceMeta(json)
      }
    }
  }

  _parseResourceMeta(metaData) {
    // 1. Buttons
    this.buttons = metaData.buttons
    // 2. Parse Sort Fields - search form
    // this.sortFields = this._parseSortFields(metaData.columns)
    // 3. Parse Select Fields - search form
    // this.selectFields = this._parseSelectFields(metaData.columns)
    // 4. Parse Search Form Fields - search form
    this.searchFormFields = this._parseSearchFormFields(metaData.columns)
    // 5. Parse Resource Form Fields - detail form
    // this.resourceFormFields = this._parseResourceFormFields(metaData.columns)
    // 6. Parse Grid Models - grid form
    // this.gridModel = this._parseGridModel(metaData.columns)
    // 7. Parse Grid Columns - grid form
    // this.gridColumns = this._parseGridColumns(metaData.columns)
    this.requestUpdate()
  }

  _handleBtnClick(event) {
    this.dispatchEvent(
      new CustomEvent(`${event.currentTarget.id}-click`, {
        cancelable: true
      })
    )
  }

  _handleFormSubmit(event) {
    event.preventDefault()
    const fields = Array.from(event.currentTarget.children)
    const searchConditions = []
    fields.forEach(f => {
      if (f.name && f.value) {
        searchConditions.push({
          name: f.name,
          value: f.value,
          operator: f.getAttribute('op')
        })
      }
    })

    this._searchData(searchConditions)
  }

  async _searchData(conditions) {
    const searchParams = new URLSearchParams()
    searchParams.append('query', JSON.stringify(conditions))
    const res = await fetch(`${this.baseUrl}/${this.resourceUrl}?${searchParams}`, {
      credentials: 'include'
    })
    if (res.ok) {
      let data = await res.json()
      if (data) {
        this.data = data
        this.shadowRoot.querySelector('#grid').value = JSON.stringify(this.data)
      }
    }
  }

  stateChanged(state) {
    this.resourceForm = state.resourceForm.state_main
    this.resourceId = state.app.resourceId

    if (this.resourceId && state.app.page === 'resource-form-main') this._getResourceData()
  }
}

window.customElements.define('resource-form-main', ResourceFormMain)
