import { store, PageView } from '@things-factory/shell'

import { html, css } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin.js'
import { parser } from '../mixin/resource-parser'

class ResourceFormMain extends connect(store)(parser(PageView)) {
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
        flex: 1;
      }
    `
  }
  static get properties() {
    return {
      resourceForm: String,
      resourceId: String,
      baseUrl: String
    }
  }

  render() {
    return html`
      <page-toolbar>
        <label>${this.menuTitle}</label>
      </page-toolbar>

      <header>${this.renderSearchForm()}</header>

      <section>
        ${this.renderGrid()}
      </section>

      <footer>
        ${this.renderButton()}
      </footer>
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
    this.baseUrl = state.app.baseUrl
    this.resourceId = state.app.resourceId
  }

  updated(changed) {
    if (changed.has('active')) {
      /*
        page가 active 상태인 경우만, updated가 호출된다.
        따라서, 이 부분에는 active 상태가 false => true 로 된 경우에 처리할 작업을 수행한다.
      */
      this.active && this._getResourceData()
    }
  }
}

window.customElements.define('resource-form', ResourceFormMain)
