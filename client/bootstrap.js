import { html } from 'lit-html'

import { store } from '@things-factory/shell'
import { addRoutingType } from '@things-factory/menu-base'

import { APPEND_CONTEXT_TOOL, TOOL_POSITION } from '@things-factory/layout-base'

export default function bootstrap() {
  import('./components/page-action-context-bar')
  store.dispatch(addRoutingType('RESOURCE', 'resource'))

  store.dispatch({
    type: APPEND_CONTEXT_TOOL,
    tool: {
      template: html`
        <page-action-context-bar></page-action-context-bar>
      `,
      position: TOOL_POSITION.REAR_END,
      context: 'actions'
    }
  })
}
