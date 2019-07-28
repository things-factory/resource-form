import { html } from 'lit-html'

import { store } from '@things-factory/shell'
import { addRoutingType } from '@things-factory/menu-base'

import { TOOL_POSITION } from '@things-factory/layout-base'
import { APPEND_CONTEXT_TOOL } from '@things-factory/context-base'

import { registerEditor, registerRenderer } from '@things-factory/grist-ui'

import { ObjectRenderer } from './data-grist/renderers/object-renderer'
import { ObjectEditor } from './data-grist/editors/object-editor'

import './components/page-action-context-bar'

export default function bootstrap() {
  registerRenderer('object', ObjectRenderer)
  registerEditor('object', ObjectEditor)

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
