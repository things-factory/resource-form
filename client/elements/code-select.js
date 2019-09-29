import gql from 'graphql-tag'
import { client } from '@things-factory/shell'

const FETCH_COMMON_CODE_GQL = codeName => gql`
{
  commonCode(name: "${codeName}") {
    details {
      name
      description
      rank
    }
  }
}
`

/*
 * USAGE
 *
 * <select codename="USER_TYPES" is="code-select"></select>
 *
 */
export class CodeSelect extends HTMLSelectElement {
  static get observedAttributes() {
    return ['codename']
  }

  connectedCallback() {}

  async attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this._fecthCodes(newValue)
    }
  }

  async _fecthCodes(codeName) {
    this.innerHTML = ''

    var response = await client.query({
      query: FETCH_COMMON_CODE_GQL(codeName)
    })

    var commonCode = response && response.data && response.data.commonCode

    if (commonCode) {
      var codes = [{ name: '', description: '' }]
        .concat(
          commonCode.details.sort(function(a, b) {
            return a.rank - b.rank
          })
        )
        .forEach(code => {
          let option = document.createElement('option')
          option.value = code.name
          option.text = `${code.name}${code.description ? ` - ${code.description}` : ''}`
          this.add(option, null)
        })
    }
  }
}

customElements.define('code-select', CodeSelect, { extends: 'select' })
