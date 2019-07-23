import { css, html } from 'lit-element'
import { connect } from 'pwa-helpers/connect-mixin.js'
import gql from 'graphql-tag'

import PullToRefresh from 'pulltorefreshjs'

import {
  client,
  gqlBuilder,
  PageView,
  PullToRefreshStyles,
  ScrollbarStyles,
  store,
  isMobileDevice
} from '@things-factory/shell'
import { i18next } from '@things-factory/i18n-base'
import '@things-factory/form-ui'
import '@things-factory/component-ui/component/popup/pop-up'

import '../components/data-list-wrapper'

class ResourceUI extends connect(store)(PageView) {
  static get styles() {
    return [
      ScrollbarStyles,
      PullToRefreshStyles,
      css`
        :host {
          display: flex;
          flex-direction: column;

          overflow: hidden;
        }

        data-list-wrapper {
          flex: 1;
          overflow-y: auto;
        }
      `
    ]
  }

  static get properties() {
    return {
      resourceForm: String,
      resourceId: String,
      baseUrl: String,
      page: Number,
      limit: Number,
      sortingFields: Array,
      _columns: Array,
      items: Array,
      total: Number,
      importedData: Array,
      _formLoaded: Boolean,
      pageProp: String
    }
  }

  get context() {
    return {
      title: this.menuTitle,
      exportable: {
        name: this.menuTitle,
        data: this._exportableData.bind(this)
      },
      importable: {
        handler: this.importHandler.bind(this)
      },
      printable: {
        accept: ['paper', 'preview'],
        content: () => {
          return this
        }
      },
      actions: (this.buttons || []).map(button => {
        return {
          title: button.text,
          action: button.action
        }
      })
    }
  }

  constructor() {
    super()

    this.pageProp = 'page'
    this.items = []
    this.total = 0
    this.importedData = []
    this.page = 1
    this.limit = 20
  }

  firstUpdated() {
    /*
     * TODO 다국어 언어 변화에 대한 대응으로 적절한 지 확인해야함.
     * 다국어 파일이 로드되기 전에 i18next.t(field.term) 이 동작한다면 다국어 동작이 완료되지 않을 수 있음.
     * 따라서, 새로운 다국어 파일이 로드된 후 _parseResourceMeta() 를 재실행 함.
     */
    i18next.store.on('added', (lng, ns) => {
      console.trace('이 메시지 발생 시 꼭 확인되어야 함.')
      this._parseResourceMeta()
    })
  }

  importHandler(records) {
    debugger
    this.importedData = records
    this.shadowRoot.querySelector('pop-up').open()
  }

  _exportableData() {
    if (!this.items || !(this.items instanceof Array) || this.items.length == 0) {
      this.items = [{}]
    }

    return this.items.map(item => {
      return this._columns.reduce((record, column) => {
        record[column.term || column.name] = item[column.name]
        return record
      }, {})
    })
  }

  render() {
    return html`
      <pop-up .title="${this.menuTitle}">
        <data-list-wrapper
          .mode="WIDE"
          .columns=${this._columns}
          .items=${this.importedData}
          .total=${this.importedData.length}
          .limit=${this.limit}
          .page=${this.page}
        >
        </data-list-wrapper>
      </pop-up>

      <header>
        <search-form
          id="search-form"
          .fields="${this.searchFields}"
          initFocus="description"
          @submit="${this._searchData}"
        ></search-form>
      </header>

      <data-list-wrapper
        pulltorefresh
        .mode=${isMobileDevice() ? 'LIST' : 'GRID'}
        .columns=${this._columns}
        .records=${this.items}
        .total=${this.total}
        .limit=${this.limit}
        .page=${this.page}
        @page-changed=${e => {
          this.page = e.detail
        }}
        @limit-changed=${e => {
          this.limit = e.detail
        }}
        @sorters-changed=${e => {
          this.sortingFields = e.detail
          this._searchData()
        }}
      >
      </data-list-wrapper>
    `
  }

  get searchForm() {
    return this.shadowRoot.querySelector('#search-form')
  }

  async _getResourceData() {
    this.columns = []

    const response = await client.query({
      query: gql`
        query {
          menu(name: "${this.resourceId}") {
            name,
            resourceUrl,
            buttons {
              text
            },
            columns {
              name
              term
              colType
              colSize
              nullable
              refType
              refName
              refUrl
              refRelated
              searchRank
              sortRank
              reverseSort
              searchEditor
              searchOper
              searchInitVal
              gridRank
              gridEditor
              gridFormat
              gridValidator
              gridWidth
              gridAlign
              formEditor
              formValidator
              formFormat
              defVal
              rangeVal
              ignoreOnSave
            }
          }
        }
      `
    })

    this.menuMeta = response.data.menu
    this.menuTitle = this.menuMeta.name
    this.resourceUrl = this._underToCamel(this.menuMeta.resourceUrl)

    this._parseResourceMeta()

    /* page context를 update해주어야 한다. */
    this.updateContext()

    /* parsing이 완료된 후에 page를 변경한다. 페이지 변경에 의해 searchData()가 실행되어야 한다. */
    if (this.page == 1) {
      this._searchData()
    } else {
      this.page = 1
    }
  }

  _parseResourceMeta() {
    var metaData = this.menuMeta

    this._columns = metaData.columns
      .filter(column => column.gridRank > 0)
      .map(column => {
        column.term = i18next.t(column.term)
        return column
      })
      .sort((a, b) => {
        return a['gridRank'] > b['gridRank'] ? 1 : -1
      })

    // TODO: submit 테스트용도 서버에서 실행 로직을 전달 받을 수 있거나 resource-ui 가 직접 submit 가능 여부를 판단할 수 있도록 수정
    this.buttons = metaData.buttons.concat({ text: 'submit', action: this._searchData.bind(this) })

    this.searchFields = metaData.columns
      .filter(field => field.searchRank && field.searchRank > 0)
      .sort((a, b) => (a['searchRank'] > b['searchRank'] ? 1 : -1))
      .map(field => {
        return {
          name: field.name,
          type: field.searchEditor ? field.searchEditor : 'text',
          props: {
            min: field.rangeVal ? field.rangeVal.split(',')[0] : null,
            max: field.rangeVal ? field.rangeVal.split(',')[1] : null,
            searchOper: field.searchOper ? field.searchOper : 'eq',
            placeholder: field.term
          },
          value: field.searchInitVal
        }
      })

    this.sortingFields = metaData.columns
      .filter(column => column.sortRank && column.sortRank > 0)
      .sort((a, b) => {
        return a.sortRank > b.sortRank ? 1 : -1
      })
  }

  async _searchData() {
    this.items = []

    const response = await client.query({
      query: gql`
        ${this._queryBuilder()}
      `
    })

    this.items = response.data.response.items || []
    this.total = response.data.response.total || 0
  }

  _queryBuilder() {
    /* column 정보가 없는 경우 systax 오류를 방지하기 위해, '임시로' id를 제공함. */
    var fields =
      this._columns && this._columns.length > 0
        ? this._columns
            .map(column => {
              return column.refType == 'Entity' || column.refType == 'Menu'
                ? `${this._underToCamel(column.name).replace('Id', '')} { id name }`
                : this._underToCamel(column.name)
            })
            .join()
        : 'id'

    const queryStr = `
    query {
      response: ${this.resourceUrl} (
        ${gqlBuilder.buildArgs({
          filters: this._parseSearchConditions(),
          pagination: this._parsePagination(),
          sortings: this._parseSortings()
        })}
      ) {
        items {
          ${fields}
        }
        total
      }
    }
  `

    return queryStr
  }

  _underToCamel(str) {
    if (str.indexOf('_') > 0) {
      const strArr = str.split('_')
      str = strArr
        .map((str, idx) => {
          if (idx > 0) {
            str = str.replace(str[0], str[0].toUpperCase())
          }

          return str
        })
        .join('')
    }

    return str
  }

  _parseSearchConditions() {
    const conditions = []

    this.searchForm.getFields().forEach(field => {
      if (field.value) {
        conditions.push({
          name: field.name,
          operator: field.getAttribute('searchOper'),
          value: field.value,
          dataType: this._columns.find(c => c.name === field.name).colType
        })
      }
    })

    return conditions
  }

  _parsePagination() {
    return {
      limit: this.limit,
      page: this.page
    }
  }

  _parseSortings() {
    const sortings = []
    if (this.sortingFields && this.sortingFields.length > 0) {
      this.sortingFields.map(field => {
        sortings.push({
          name: this._underToCamel(field.name),
          desc: field.reverseSort ? field.reverseSort : false
        })
      })
    }

    return sortings
  }

  stateChanged(state) {
    this.baseUrl = state.app.baseUrl
    this.resourceId = state.route.resourceId
  }

  async updated(changed) {
    if (changed.has('resourceId')) {
      /*
       * 새로운 searchForm이 만들어지는 경우에는,
       * _searchData() 전에 새로운 meta정보를 가져온 것을 보장하기 위해서 await를 사용한다.
       */
      await this._getResourceData()
    }

    if (changed.has('limit') || changed.has('page')) {
      this._searchData()
    }
  }

  async activated(active) {
    if (active) {
      await this.updateComplete
      /*
       * 첫번째 active 시에는 element가 생성되어있지 않으므로,
       * 꼭 updateComplete를 기다린 후에 mainElement설정을 해야한다.
       */
      this._ptr = PullToRefresh.init({
        mainElement: this.shadowRoot.querySelector('[pulltorefresh]'),
        distIgnore: 30,
        instructionsPullToRefresh: 'Pull down to refresh',
        instructionsRefreshing: 'Refreshing',
        instructionsReleaseToRefresh: 'Release to refresh',
        onRefresh: () => {
          this._getResourceData()
        }
      })
    } else {
      this._ptr && this._ptr.destroy()
      delete this._ptr
    }
  }
}

window.customElements.define('resource-ui', ResourceUI)
