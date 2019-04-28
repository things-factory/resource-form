import { html, css } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin.js'

import { store, PageView, ScrollbarStyles } from '@things-factory/shell'
import { resourceParser } from '@things-factory/resource-base'

import '../components/simple-grid/simple-grid'
import '../components/simple-list/simple-list'

class ResourceUI extends connect(store)(resourceParser(PageView)) {
  static get styles() {
    return [
      ScrollbarStyles,
      css`
        :host {
          display: flex;
          flex-direction: column;

          overflow: hidden;
        }

        simple-grid,
        simple-list {
          flex: 1;
        }
      `
    ]
  }

  static get properties() {
    return {
      layout: String,
      resourceForm: String,
      resourceId: String,
      baseUrl: String,
      data: Object,
      page: Number,
      limit: Number,
      _columns: Array
    }
  }

  get tools() {
    return html`
      <label>${this.menuTitle}</label>
    `
  }

  render() {
    return html`
      <header>${this.renderSearchForm()}</header>

      ${this.layout == 'WIDE'
        ? html`
            <simple-grid
              .columns=${this._columns}
              .data=${this.data}
              .limit=${this.limit}
              .page=${this.page}
              @page-changed=${e => {
                this.page = e.detail
              }}
              @limit-changed=${e => {
                this.limit = e.detail
              }}
            >
            </simple-grid>
          `
        : html`
            <simple-list
              .columns=${this._columns}
              .data=${this.data}
              .limit=${this.limit}
              .page=${this.page}
              @page-changed=${e => {
                this.page = e.detail
              }}
              @limit-changed=${e => {
                this.limit = e.detail
              }}
            >
            </simple-list>
          `}

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

  get searchForm() {
    return this.shadowRoot.querySelector('#search-form')
  }

  async _getResourceData() {
    // TODO: get base url from store or somthing...
    const res = await fetch(`${this.baseUrl}/menus/${this.resourceId}/menu_meta`, {
      credentials: 'include'
    })

    if (res.ok) {
      const json = await res.json()
      if (json) {
        this.menuTitle = json.menu.title
        this.resourceUrl = json.menu.resource_url
        this._parseResourceMeta(json)
      }
    }
  }

  _parseResourceMeta(metaData) {
    this._columns = metaData.columns

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

    this._searchData()
  }

  async _searchData() {
    const fields = Array.from(this.searchForm.children)
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

    const searchParams = new URLSearchParams()
    searchParams.append('query', JSON.stringify(searchConditions))
    searchParams.append('page', this.page || 1)
    searchParams.append('limit', this.limit || 50)

    const res = await fetch(`${this.baseUrl}/${this.resourceUrl}?${searchParams}`, {
      credentials: 'include'
    })
    if (res.ok) {
      let data = await res.json()
      if (data) {
        this.data = data
      }
    }
  }

  stateChanged(state) {
    this.layout = state.layout.width
    this.baseUrl = state.app.baseUrl
    this.resourceId = state.app.resourceId
  }

  updated(changed) {
    if (changed.has('active')) {
      /*
        page가 active 상태인 경우만, updated가 호출된다.
        따라서, 이 부분에는 active 상태가 false => true 로 된 경우에 처리할 작업을 수행한다.
      */
      if (this.active) {
        this.data = []
        this.searchForm.reset()

        this._getResourceData().then(() => {
          this._searchData()
        })
      }
    }

    if (changed.has('limit') || changed.has('page')) {
      this._searchData()
    }
  }
}

window.customElements.define('resource-ui', ResourceUI)
